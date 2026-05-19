export interface Vértice {
  identificador: string;
  latitude: number;
  longitude: number;
  latitudeGMS: string;
  longitudeGMS: string;
}

export interface ImovelAcre {
  nome: string;
  numero_car: string;
  sigef_codigo: string;
  proprietario: string;
  cpf_cnpj: string;
  municipio: string;
  area_ha: number;
  situacao_certificacao: string; // "Certificado" | "Retificado" | "Título Pendente"
  status_ambiental: "Regular" | "Sob Análise" | "Embargado" | "Área de Risco";
  detalhes_deforestacao?: string;
  verset_limite?: Vértice[];
  legal_reserva_percent: number;
  app_area_ha: number;
  observacoes: string;
  centro_lat: number;
  centro_lng: number;
  coordenada_embargo?: { lat: number; lng: number; area_embargo_ha?: number };
}

// Municípios do Acre com suas coordenadas centrais de referência
export const MUNICIPIOS_ACRE = [
  { nome: "Rio Branco", lat: -9.9754, lng: -67.8249 },
  { nome: "Cruzeiro do Sul", lat: -7.6322, lng: -72.6710 },
  { nome: "Sena Madureira", lat: -9.0658, lng: -68.6569 },
  { nome: "Tarauacá", lat: -8.1614, lng: -70.7656 },
  { nome: "Feijó", lat: -8.1643, lng: -70.3541 },
  { nome: "Brasiléia", lat: -11.0069, lng: -68.7497 },
  { nome: "Xapuri", lat: -10.6517, lng: -68.5044 },
  { nome: "Porto Acre", lat: -9.5881, lng: -67.5323 },
  { nome: "Epitaciolândia", lat: -11.0267, lng: -68.7411 },
  { nome: "Plácido de Castro", lat: -10.3344, lng: -67.1869 },
  { nome: "Mâncio Lima", lat: -7.6142, lng: -72.8958 },
  { nome: "Rodrigues Alves", lat: -7.7413, lng: -72.6480 },
  { nome: "Acrelândia", lat: -9.8252, lng: -66.8839 },
  { nome: "Bujari", lat: -9.8311, lng: -67.9519 },
  { nome: "Capixaba", lat: -10.3732, lng: -67.6761 },
  { nome: "Manoel Urbano", lat: -8.8389, lng: -69.2599 },
  { nome: "Assis Brasil", lat: -10.9398, lng: -69.5663 },
  { nome: "Porto Walter", lat: -8.2687, lng: -72.7439 },
  { nome: "Marechal Thaumaturgo", lat: -8.9407, lng: -72.7915 },
  { nome: "Santa Rosa do Purus", lat: -9.4328, lng: -69.9872 },
  { nome: "Jordão", lat: -9.4336, lng: -70.6669 }
];

// 5 Propriedades Reais/Simuladas de Alta Fidelidade no Acre
export const IMOVEIS_PRESET: ImovelAcre[] = [
  {
    nome: "Fazenda Esperança",
    numero_car: "AC-1200401-E83FB00109282302482348A",
    sigef_codigo: "0100000021398-33",
    proprietario: "Sebastião de Souza Mendes",
    cpf_cnpj: "012.***.***-45",
    municipio: "Rio Branco",
    area_ha: 412.5,
    situacao_certificacao: "Certificado",
    status_ambiental: "Regular",
    legal_reserva_percent: 21.4,
    app_area_ha: 15.2,
    observacoes: "Preservação permanente intacta ao longo do braço tributário do Rio Iquiri. Excesso de cobertura florestal averbada (RL correspondente a 21.4% da área total). Ausência de focos de queimada ativos nos últimos 360 dias.",
    centro_lat: -9.9740,
    centro_lng: -67.8100,
    verset_limite: [
      { identificador: "M-001", latitude: -9.9650, longitude: -67.8200, latitudeGMS: "09°57'54.0\"S", longitudeGMS: "67°49'12.0\"W" },
      { identificador: "M-002", latitude: -9.9650, longitude: -67.8000, latitudeGMS: "09°57'54.0\"S", longitudeGMS: "67°48'00.0\"W" },
      { identificador: "M-003", latitude: -9.9830, longitude: -67.8000, latitudeGMS: "09°58'58.8\"S", longitudeGMS: "67°48'00.0\"W" },
      { identificador: "M-004", latitude: -9.9830, longitude: -67.8200, latitudeGMS: "09°58'58.8\"S", longitudeGMS: "67°49'12.0\"W" }
    ]
  },
  {
    nome: "Sítio Novo Alvorecer",
    numero_car: "AC-1200393-BC8230492813947EA",
    sigef_codigo: "0100000032904-11",
    proprietario: "Maria Helena de Oliveira Coimbra",
    cpf_cnpj: "432.***.***-12",
    municipio: "Xapuri",
    area_ha: 85.3,
    situacao_certificacao: "Certificado",
    status_ambiental: "Sob Análise",
    legal_reserva_percent: 18.2,
    app_area_ha: 4.8,
    observacoes: "Sinal de sobreposição marginal detectado na divisa norte com a Reserva Extrativista Chico Mendes (reivindicação de 8.2 ha em litígio). Requer vistoria local em campo para conferência de marcos físicos divisórios originais.",
    centro_lat: -10.6512,
    centro_lng: -68.4988,
    verset_limite: [
      { identificador: "V-10", latitude: -10.6480, longitude: -68.5020, latitudeGMS: "10°38'52.8\"S", longitudeGMS: "68°30'07.2\"W" },
      { identificador: "V-11", latitude: -10.6480, longitude: -68.4950, latitudeGMS: "10°38'52.8\"S", longitudeGMS: "68°29'42.0\"W" },
      { identificador: "V-12", latitude: -10.6540, longitude: -68.4950, latitudeGMS: "10°39'14.4\"S", longitudeGMS: "68°29'42.0\"W" },
      { identificador: "V-13", latitude: -10.6540, longitude: -68.5020, latitudeGMS: "10°39'14.4\"S", longitudeGMS: "68°30'07.2\"W" }
    ]
  },
  {
    nome: "Fazenda Búfalo Branco",
    numero_car: "AC-1200203-DEADBEEF683921094E",
    sigef_codigo: "0100000010293-88",
    proprietario: "Francisco das Chagas Albuquerque",
    cpf_cnpj: "109.***.***-67",
    municipio: "Cruzeiro do Sul",
    area_ha: 1250.8,
    situacao_certificacao: "Certificado",
    status_ambiental: "Regular",
    legal_reserva_percent: 20.0,
    app_area_ha: 45.0,
    observacoes: "Grande propriedade pecuária na bacia do Rio Croa. Reserva legal consolidada de 250.16 ha recomposta via prorrogação de PRADA. Canalização de efluentes controlada. Fiscalização recomendada devido ao avanço de propriedades limítrofes.",
    centro_lat: -7.6322,
    centro_lng: -72.6710,
    verset_limite: [
      { identificador: "REF-01", latitude: -7.6200, longitude: -72.6800, latitudeGMS: "07°37'12.0\"S", longitudeGMS: "72°40'48.0\"W" },
      { identificador: "REF-02", latitude: -7.6200, longitude: -72.6600, latitudeGMS: "07°37'12.0\"S", longitudeGMS: "72°39'36.0\"W" },
      { identificador: "REF-03", latitude: -7.6450, longitude: -72.6600, latitudeGMS: "07°38'42.0\"S", longitudeGMS: "72°39'36.0\"W" },
      { identificador: "REF-04", latitude: -7.6450, longitude: -72.6800, latitudeGMS: "07°38'42.0\"S", longitudeGMS: "72°40'48.0\"W" }
    ]
  },
  {
    nome: "Fazenda São João da Aliança",
    numero_car: "AC-1200500-AEBF12093846193CA",
    sigef_codigo: "0100000045612-44",
    proprietario: "Agropecuária Aliança Ltda.",
    cpf_cnpj: "14.832.*** /0001-99",
    municipio: "Sena Madureira",
    area_ha: 2450.0,
    situacao_certificacao: "Certificado",
    status_ambiental: "Embargado",
    detalhes_deforestacao: "Desmatamento ilegal de 34 ha de floresta primária intocada nascente de cabeceira em Julho de 2025.",
    legal_reserva_percent: 14.5,
    app_area_ha: 12.0,
    observacoes: "CRÍTICO: Imóvel sob termo de embargo ativo emitido pelo IMAC/IBAMA devido a desmatamento sem plano de manejo de exploração florestal. Multa lavrada no valor de R$ 170.000,00 e restrição de comercialização de gado bovino proveniente das poligonais embargadas.",
    centro_lat: -9.0415,
    centro_lng: -68.6570,
    coordenada_embargo: { lat: -9.0435, lng: -68.6550, area_embargo_ha: 34 },
    verset_limite: [
      { identificador: "PT-01", latitude: -9.0300, longitude: -68.6700, latitudeGMS: "09°01'48.0\"S", longitudeGMS: "68°40'12.0\"W" },
      { identificador: "PT-02", latitude: -9.0300, longitude: -68.6400, latitudeGMS: "09°01'48.0\"S", longitudeGMS: "68°38'24.0\"W" },
      { identificador: "PT-03", latitude: -9.0550, longitude: -68.6400, latitudeGMS: "09°03'18.0\"S", longitudeGMS: "68°38'24.0\"W" },
      { identificador: "PT-04", latitude: -9.0550, longitude: -68.6700, latitudeGMS: "09°03'18.0\"S", longitudeGMS: "68°40'12.0\"W" }
    ]
  },
  {
    nome: "Sítio Rio Jordão",
    numero_car: "AC-1200609-F3C1D2A90B88E776F",
    sigef_codigo: "0100000056789-99",
    proprietario: "Raimundo Nonato Leitão da Silva",
    cpf_cnpj: "283.***.***-91",
    municipio: "Tarauacá",
    area_ha: 112.4,
    situacao_certificacao: "Título Pendente",
    status_ambiental: "Regular",
    legal_reserva_percent: 80.0, // Alta preservação amazônica
    app_area_ha: 8.9,
    observacoes: "Assentamento familiar em posse pacífica. Destina-se ao extrativismo sustentável do açaí nativo e borracha silvestre. Sem desmatamentos registrados. Integra-se ao programa estadual de incentivos aos serviços ambientais (SISA-Acre). CAR pendente de validação estatal homologatória final.",
    centro_lat: -8.1235,
    centro_lng: -70.7650,
    verset_limite: [
      { identificador: "P-1", latitude: -8.1180, longitude: -70.7700, latitudeGMS: "08°07'04.8\"S", longitudeGMS: "70°46'12.0\"W" },
      { identificador: "P-2", latitude: -8.1180, longitude: -70.7600, latitudeGMS: "08°07'04.8\"S", longitudeGMS: "70°45'36.0\"W" },
      { identificador: "P-3", latitude: -8.1280, longitude: -70.7600, latitudeGMS: "08°07'40.8\"S", longitudeGMS: "70°45'36.0\"W" },
      { identificador: "P-4", latitude: -8.1280, longitude: -70.7700, latitudeGMS: "08°07'40.8\"S", longitudeGMS: "70°46'12.0\"W" }
    ]
  }
];

// Calcula a distância euclidiana para determinar proximidade
function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  // Fator de conversão aproximado em km na linha do equador e proximidades do Acre:
  // 1 grau ~ 111.12 km
  return Math.sqrt(dLat * dLat + dLng * dLng) * 111.12;
}

// Converte coordenadas decimais em texto amigável formatado em GMS
export function decimalParaGMS(dec: number, isLatitude: boolean): string {
  const absoluto = Math.abs(dec);
  const graus = Math.floor(absoluto);
  const minutosFrac = (absoluto - graus) * 60;
  const minutos = Math.floor(minutosFrac);
  const segundos = Math.round((minutosFrac - minutos) * 60 * 100) / 100;
  
  let direcao = "";
  if (isLatitude) {
    direcao = dec < 0 ? "S" : "N";
  } else {
    direcao = dec < 0 ? "W" : "E";
  }
  
  return `${String(graus).padStart(2, "0")}°${String(minutos).padStart(2, "0")}'${String(segundos.toFixed(1)).padStart(4, "0")}"${direcao}`;
}

// Reconstrói o hash determinístico usando constantes simples para gerar os mesmos dados para a mesma coordenada
function pseudoRandomParaCoordenada(lat: number, lng: number, campo: string): number {
  const str = `${lat.toFixed(5)}|${lng.toFixed(5)}|${campo}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Converte para inteiro de 32 bits
  }
  return Math.abs(hash);
}

// NOMES fantásticos para propriedades e pessoas baseados no hash
const PREFIXOS_IMOVEL = ["Fazenda", "Sítio", "Chácara", "Estância", "Gleba"];
export const NOMES_IMOVEL = ["Vista Alegre", "Santa Luzia", "São Francisco", "Rio Acre", "Alto Paraíso", "Belo Monte", "Seringal Cabicera", "Três Lagoas", "Samaúma Gigante", "Iquiri", "Muru", "Purus", "Envira"];
export const DETENTORES = [
  "Antônio Bezerra da Silva",
  "Francisca de Souza Pinheiro",
  "Manoel Cabral de Andrade",
  "Carlos Eduardo Albuquerque",
  "Raimunda Nonata Rocha",
  "Sebastião Ferreira Lima",
  "José Alencar de Melo",
  "Maria das Graças Medeiros",
  "Zezinho da Costa Filho"
];

// Pesquisa imóvel por coordenadas espaciais.
// Retorna um imóvel correspondente. Se cair fora do Acre, indica um erro de boundaries.
export function buscar_imovel_por_coordenada(lat: number, lng: number): { data?: ImovelAcre; erro?: string; foraDoEstado?: boolean } {
  // Limites aproximados do estado do Acre
  const LAT_MIN = -11.5;
  const LAT_MAX = -7.0;
  const LNG_MIN = -74.0;
  const LNG_MAX = -66.0;

  if (lat < LAT_MIN || lat > LAT_MAX || lng < LNG_MIN || lng > LNG_MAX) {
    return {
      erro: `Nenhum imóvel mapeado nesta coordenada. O ponto informado (${lat.toFixed(4)}, ${lng.toFixed(4)}) encontra-se fora dos limites territoriais do Estado do Acre (Lat [-11.5, -7.0], Lng [-74.0, -66.0]).`,
      foraDoEstado: true
    };
  }

  // 1. Procura se a coordenada intersecta uma das nossas propriedades estáticas (preset) em um raio aproximado de 5.5 km
  for (const imovel of IMOVEIS_PRESET) {
    const dist = calcularDistancia(lat, lng, imovel.centro_lat, imovel.centro_lng);
    if (dist <= 5.5) {
      return { data: imovel };
    }
  }

  // 2. Se não intersectar nenhuma propriedade pré-definida, geramos de forma determinística
  // para que qualquer local no Acre possua um imóvel certificado/registrado correspondente ou vazio!
  // Usamos seed baseada na coordenada para que seja determinístico!
  const hasImovelCoordenada = pseudoRandomParaCoordenada(lat, lng, "existencia") % 100;
  
  // 35% de chance de ser uma área vazia de imóveis declarados (apenas floresta de florestamento público ou terras indígenas ainda sem delimitação individualizada no CAR)
  if (hasImovelCoordenada < 15) {
    return {
      erro: "Nenhum imóvel correspondente a CAR ou SIGEF ativo foi detectado precisamente nesta poligonal. Trata-se possivelmente de Terras Públicas não Demarcadas, Floresta Estadual de Produção Controlada ou Área de Preservação Pública sem proprietário privado registrado."
    };
  }

  // Descobre o município mais próximo
  let municipioMaisProximo = MUNICIPIOS_ACRE[0];
  let menorDistancia = calcularDistancia(lat, lng, municipioMaisProximo.lat, municipioMaisProximo.lng);
  
  for (let i = 1; i < MUNICIPIOS_ACRE.length; i++) {
    const dist = calcularDistancia(lat, lng, MUNICIPIOS_ACRE[i].lat, MUNICIPIOS_ACRE[i].lng);
    if (dist < menorDistancia) {
      menorDistancia = dist;
      municipioMaisProximo = MUNICIPIOS_ACRE[i];
    }
  }

  // Geração determinística baseada na coordenada
  const seedPrefix = pseudoRandomParaCoordenada(lat, lng, "prefixo") % PREFIXOS_IMOVEL.length;
  const seedNome = pseudoRandomParaCoordenada(lat, lng, "nome") % NOMES_IMOVEL.length;
  const seedProp = pseudoRandomParaCoordenada(lat, lng, "prop") % DETENTORES.length;
  const seedArea = (pseudoRandomParaCoordenada(lat, lng, "area") % 1450) + 12.5; // Ha
  const seedCertif = pseudoRandomParaCoordenada(lat, lng, "cert") % 10;
  const seedStatus = pseudoRandomParaCoordenada(lat, lng, "status") % 100;
  const seedCPF = pseudoRandomParaCoordenada(lat, lng, "cpf") % 900000;
  const seedCodImovel = pseudoRandomParaCoordenada(lat, lng, "cod_i") % 90000;
  
  const nomePropriedade = `${PREFIXOS_IMOVEL[seedPrefix]} ${NOMES_IMOVEL[seedNome]}`;
  const carRandom = `AC-1200${100 + (seedNome % 100)}-${pseudoRandomParaCoordenada(lat, lng, "car1").toString(16).toUpperCase().substring(0, 16)}`;
  const sigefRandom = `01000000${seedCodImovel}-${Math.floor(seedCPF / 10000)}`;
  const proprietario = DETENTORES[seedProp];
  const cpfMasked = `${String(Math.floor(seedCPF / 100)).padStart(3, "0")}.***.***-${String(seedCPF % 100).padStart(2, "0")}`;

  // Determinar status ambiental
  let status_ambiental: "Regular" | "Sob Análise" | "Embargado" | "Área de Risco" = "Regular";
  let detalhes_deforestacao: string | undefined = undefined;
  if (seedStatus < 15) {
    status_ambiental = "Embargado";
    detalhes_deforestacao = `Desmatamento com alerta SAD de ${Math.floor(seedArea / 5.2)} ha detectado nas proximidades por satélite nos últimos 12 meses, violando o Art. 12 da Lei nº 12.651/2012.`;
  } else if (seedStatus < 40) {
    status_ambiental = "Sob Análise";
  }

  const situacao_certificacao = seedCertif < 6 ? "Certificado" : seedCertif < 9 ? "Retificado" : "Título Pendente";
  const app_area_ha = parseFloat((seedArea * 0.05).toFixed(1));
  const legal_reserva_percent = status_ambiental === "Regular" ? 20.0 : 15.6;

  // Gerar vértices do imóvel em volta da coordenada de forma determinística (+- 0.015 graus)
  const offset = 0.010;
  const verset_limite: Vértice[] = [
    {
      identificador: "PT-A",
      latitude: lat + offset,
      longitude: lng - offset,
      latitudeGMS: decimalParaGMS(lat + offset, true),
      longitudeGMS: decimalParaGMS(lng - offset, false),
    },
    {
      identificador: "PT-B",
      latitude: lat + offset,
      longitude: lng + offset,
      latitudeGMS: decimalParaGMS(lat + offset, true),
      longitudeGMS: decimalParaGMS(lng + offset, false),
    },
    {
      identificador: "PT-C",
      latitude: lat - offset,
      longitude: lng + offset,
      latitudeGMS: decimalParaGMS(lat - offset, true),
      longitudeGMS: decimalParaGMS(lng + offset, false),
    },
    {
      identificador: "PT-D",
      latitude: lat - offset,
      longitude: lng - offset,
      latitudeGMS: decimalParaGMS(lat - offset, true),
      longitudeGMS: decimalParaGMS(lng - offset, false),
    }
  ];

  const observacoes = status_ambiental === "Embargado"
    ? `Imóvel apresenta inconformidade legal. Alerta de desflorestamento ativo. Embargo cartográfico parcial e autuação em trâmite no Instituto de Meio Ambiente do Acre (IMAC).`
    : `Imóvel geolocalizado com sucesso na jurisdição de ${municipioMaisProximo.nome}. Cadastro no CAR ativo e integrado no sistema fundiário federal. Condição socioambiental considerada estável.`;

  return {
    data: {
      nome: nomePropriedade,
      numero_car: carRandom,
      sigef_codigo: sigefRandom,
      proprietario,
      cpf_cnpj: cpfMasked,
      municipio: municipioMaisProximo.nome,
      area_ha: parseFloat(seedArea.toFixed(1)),
      situacao_certificacao,
      status_ambiental,
      detalhes_deforestacao,
      verset_limite,
      legal_reserva_percent,
      app_area_ha,
      observacoes,
      centro_lat: parseFloat(lat.toFixed(5)),
      centro_lng: parseFloat(lng.toFixed(5)),
      coordenada_embargo: status_ambiental === "Embargado" ? {
        lat: parseFloat((lat + 0.0031).toFixed(5)),
        lng: parseFloat((lng - 0.0027).toFixed(5)),
        area_embargo_ha: Math.max(1, Math.floor(seedArea / 5.2))
      } : undefined
    }
  };
}

// Analisa e extrai coordenadas decimais de uma string (que pode estar em GMS ou decimais soltos)
export function extrairCoordenadasGMS(texto: string): { latitude: number; longitude: number; erro?: string } {
  // Limpar texto de espaços extras
  const clean = texto.trim();

  // Caso 1: Decimais diretos de tipo "-9.9740, -67.8100" ou "-9.9740 -67.8100" ou com ponto e vírgula
  const decimalRegExp = /(-?\d+\.\d+)\s*[,;\s]\s*(-?\d+\.\d+)/;
  const matchDec = clean.match(decimalRegExp);
  if (matchDec) {
    return {
      latitude: parseFloat(matchDec[1]),
      longitude: parseFloat(matchDec[2])
    };
  }

  // Caso 2: GMS estructurado como: 9°58'28.9"S 67°48'36.0"W ou 09° 58' 28.9" S / 67° 48' 36" W
  // Vamos analisar cada coordenada de forma separada por regexes
  // Regex para Latitude GMS: (Graus)°(Minutos)'(Segundos)" (S ou N)
  const gmsLatReg = /(\d+)\s*[°º]?\s*(\d+)\s*['’]?\s*(\d+(?:\.\d+)?)\s*["”]?\s*([SsNn])/;
  // Regex para Longitude GMS: (Graus)°(Minutos)'(Segundos)" (O, W, E ou L)
  const gmsLngReg = /(\d+)\s*[°º]?\s*(\d+)\s*['’]?\s*(\d+(?:\.\d+)?)\s*["”]?\s*([OoWwEeLl])/;

  const latMatch = clean.match(gmsLatReg);
  const lngMatch = clean.match(gmsLngReg);

  if (latMatch && lngMatch) {
    const latG = parseInt(latMatch[1]);
    const latM = parseInt(latMatch[2]);
    const latS = parseFloat(latMatch[3]);
    const latDir = latMatch[4].toUpperCase();

    const lngG = parseInt(lngMatch[1]);
    const lngM = parseInt(lngMatch[2]);
    const lngS = parseFloat(lngMatch[3]);
    const lngDir = lngMatch[4].toUpperCase();

    let latitude = latG + (latM / 60) + (latS / 3600);
    if (latDir === "S") {
      latitude = -latitude;
    }

    let longitude = lngG + (lngM / 60) + (lngS / 3600);
    if (lngDir === "W" || lngDir === "O") {
      longitude = -longitude;
    }

    return { latitude, longitude };
  }

  // Tenta extrair apenas números e direções se vier sem símbolos ° ' "
  // Formato: 09 58 29 S 67 48 36 O
  const gmsEspacadoLat = /(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s*([SsNn])/;
  const gmsEspacadoLng = /(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s*([OoWwEeLl])/;

  const latMatchEsp = clean.match(gmsEspacadoLat);
  const lngMatchEsp = clean.match(gmsEspacadoLng);

  if (latMatchEsp && lngMatchEsp) {
    const latG = parseInt(latMatchEsp[1]);
    const latM = parseInt(latMatchEsp[2]);
    const latS = parseFloat(latMatchEsp[3]);
    const latDir = latMatchEsp[4].toUpperCase();

    const lngG = parseInt(lngMatchEsp[1]);
    const lngM = parseInt(lngMatchEsp[2]);
    const lngS = parseFloat(lngMatchEsp[3]);
    const lngDir = lngMatchEsp[4].toUpperCase();

    let latitude = latG + (latM / 60) + (latS / 3600);
    if (latDir === "S") {
      latitude = -latitude;
    }

    let longitude = lngG + (lngM / 60) + (lngS / 3600);
    if (lngDir === "W" || lngDir === "O") {
      longitude = -longitude;
    }

    return { latitude, longitude };
  }

  return {
    latitude: 0,
    longitude: 0,
    erro: "Não foi possível extrair coordenadas válidas. Exemplos de formatos aceitos:\n- Decimal: -9.9740, -67.8100\n- GMS: 09°58'24.0\"S 67°48'36.0\"W\n- GMS Simplificado: 09 58 24 S 67 48 36 O"
  };
}
