import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { buscar_imovel_por_coordenada } from "./src/db/imoveis.js"; // Use JS extension in ESM or directly compile

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization of Gemini SDK to prevent server startup crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave GEMINI_API_KEY é necessária no painel de segredos (Secrets) ou variáveis de ambiente.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Endpoint direto para busca espacial de imóveis
app.post("/api/buscar-imovel", (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Latitude e Longitude são obrigatórias." });
    }
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: "Latitude e Longitude devem ser valores numéricos válidos." });
    }

    const resultado = buscar_imovel_por_coordenada(latNum, lngNum);
    return res.json(resultado);
  } catch (err: any) {
    console.error("Erro no api/buscar-imovel:", err);
    return res.status(500).json({ error: err.message || "Erro interno do servidor." });
  }
});

// Declaração da ferramenta (Function Calling) do CAR/SIGEF para o Gemini
const buscarImovelFunctionDeclaration: FunctionDeclaration = {
  name: "buscar_imovel_por_coordenada",
  description: "Busca na base de dados geográficos do Acre (CAR/SIGEF) o imóvel rural que intersecta a latitude e a longitude fornecidas em formato decimal. Use este método SEMPRE que o fiscal ambiental fornecer ou perguntar sobre uma coordenada (GMS ou Decimal).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      latitude: {
        type: Type.NUMBER,
        description: "Latitude em formato decimal (ex: -9.9740). Note que no Acre e no hemisfério Sul as latitudes são negativas.",
      },
      longitude: {
        type: Type.NUMBER,
        description: "Longitude em formato decimal (ex: -67.8100). Note que no Acre as longitudes são negativas (Oeste).",
      },
    },
    required: ["latitude", "longitude"],
  },
};

// 2. Chat Inteligente para o Fiscal Ambiental dotado de Function Calling
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Histórico de mensagens é obrigatório." });
    }

    const ai = getGeminiClient();

    // Montando o contexto com as conversas anteriores
    // Formata o histórico adequadamente para a chamada do modelo
    const promptContents: any[] = [];
    
    for (const msg of messages) {
      promptContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }

    // Instrukções de sistema detalhadas
    const systemInstruction = 
      "Você é o 'AcreGeo-Fiscal IA', um assistente virtual especialista de elite em geoprocessamento e legislação ambiental aplicados à fiscalização rural no Estado do Acre, Brasil. " +
      "Seu papel é auxiliar auditores fiscais ecológicos (do IMAC, IBAMA e Polícia Ambiental) a localizar propriedades e emitir pareceres oficiais de infrações, embargos ou regularidade.\n\n" +
      "FLUXO CRÍTICO DE COORDENADAS:\n" +
      "1. Se o fiscal digitar coordenadas geográficas de qualquer forma (por exemplo, GMS: 9°57'24\"S 67°48'36\"W, 9 58 29 S 67 48 36 W, ou em Decimais: -9.974, -67.810):\n" +
      "   - Traduza inteligentemente esses valores para Latitude e Longitude decimais. Lembre que o Acre está totalmente inserido no hemisfério SUL (latitude negativa entre -7.0 e -11.5) e hemisfério OESTE (longitude negativa entre -66.0 e -74.0).\n" +
      "   - Chame IMEDIATAMENTE a ferramenta `buscar_imovel_por_coordenada` utilizando a chamada de função (Function Calling).\n" +
      "2. Quando a ferramenta retornar os dados de imóvel (CAR, Nome, Proprietário, CPF mascarado, Área, Situação e Status):\n" +
      "   - Apresente um parecer ou Relatório Técnico detalhado estruturado estritamente em Português do Brasil.\n" +
      "   - No relatório, detalhe dados cadastrais (Número do Recibo do CAR, ID de Certificação do SIGEF/INCRA, CNIR), análise cartográfica de limites municipais, enquadramento jurídico ambiental (Código Florestal Lei 12.651/2012) e um parecer fiscal conclusivo recomendando homologação, embargos de área se houver infração por desmatamento, ou multa cabível.\n" +
      "   - Mantenha um tom altamente profissional, formal, conciso e instrutivo, digno de um laudo pericial oficial de engenharia florestal.";

    // Primeira chamada do modelo para ver se ele ativa a função
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: promptContents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [buscarImovelFunctionDeclaration] }]
      }
    });

    const functionCalls = response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      // O modelo decidiu acionar a função de busca espacial
      const call = functionCalls[0];
      const args: any = call.args;
      const { latitude, longitude } = args;

      console.log(`[FC] Executando buscar_imovel_por_coordenada para lat: ${latitude}, lng: ${longitude}`);
      
      // Executa a busca real de dados na nossa base local no backend
      const resultadoDb = buscar_imovel_por_coordenada(latitude, longitude);

      // Envia os resultados de volta para o Gemini finalizar o texto com base no retorno da Tool
      const responseFinal = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...promptContents,
          // Insere a resposta do próprio modelo pedindo para rodar o tool
          response.candidates?.[0]?.content!,
          // Insere a resposta do Tool para o modelo ler
          {
            role: "tool",
            parts: [{
              text: JSON.stringify({
                name: "buscar_imovel_por_coordenada",
                response: resultadoDb
              })
            }]
          }
        ],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [buscarImovelFunctionDeclaration] }]
        }
      });

      // Retorna para a UI o texto final formatador pelo modelo + a estrutura crua do imóvel encontrado para reatividade na UI (focar mapa, abrir tabela de dados etc.)
      return res.json({
        content: responseFinal.text,
        toolUsed: "buscar_imovel_por_coordenada",
        coordinatesUsed: { latitude, longitude },
        foundProperty: resultadoDb.data || null,
        errorDb: resultadoDb.erro || null,
        foraDoEstado: resultadoDb.foraDoEstado || false
      });
    }

    // Caso o usuário estivesse apenas conversando ou tirando dúvidas e não forneceu coordenadas
    return res.json({
      content: response.text,
      toolUsed: null,
      foundProperty: null
    });

  } catch (err: any) {
    console.error("Erro no api/gemini/chat:", err);
    return res.status(500).json({ error: err.message || "Erro no serviço IA do Gemini." });
  }
});

// Configuração do Servidor Estático / Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OK] Servidor AcreGeo-Fiscal rodando em http://localhost:${PORT}`);
  });
}

startServer();
