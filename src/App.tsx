import { useState, useEffect, useRef } from "react";
import { 
  Compass, 
  MapPin, 
  Layers, 
  FileText, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Hash, 
  Globe, 
  Printer, 
  Sparkles, 
  ChevronRight, 
  Download, 
  Search, 
  RefreshCw, 
  BookOpen, 
  Check,
  Shield,
  HelpCircle
} from "lucide-react";
import { buscar_imovel_por_coordenada, extrairCoordenadasGMS, decimalParaGMS, ImovelAcre, MUNICIPIOS_ACRE } from "./db/imoveis";
import { PropertyMiniMap } from "./components/PropertyMiniMap";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function App() {
  // GMS Input States (Latitude)
  const [latG, setLatG] = useState("09");
  const [latM, setLatM] = useState("58");
  const [latS, setLatS] = useState("26.4");
  const [latDir, setLatDir] = useState("S"); // S ou N

  // GMS Input States (Longitude)
  const [lngG, setLngG] = useState("67");
  const [lngM, setLngM] = useState("48");
  const [lngS, setLngS] = useState("36.0");
  const [lngDir, setLngDir] = useState("W"); // W (Oeste) ou E

  // Input Mode Coordinate: "gms" | "raw"
  const [coordType, setCoordType] = useState<"gms" | "raw">("gms");
  const [rawTextCoords, setRawTextCoords] = useState("09°58'26.4\"S 67°48'36.0\"W");

  // General App States
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "report">("dashboard");
  const [foundProperty, setFoundProperty] = useState<ImovelAcre | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [gisLayer, setGisLayer] = useState<"car" | "app" | "reserva" | "deforestation">("car");
  const [searchLoading, setSearchLoading] = useState(false);

  // Suggested Acre coordinate samples for easy testing
  const SUGERIDAS = [
    { 
      label: "Fazenda Esperança (Rio Branco)", 
      gms: "09°58'26.4\"S 67°48'36.0\"W",
      lat: -9.9740, 
      lng: -67.8100 
    },
    { 
      label: "Fazenda São João da Aliança (Sena Madureira - Embargada)", 
      gms: "09°02'29.4\"S 68°39'25.2\"W",
      lat: -9.0415, 
      lng: -68.6570 
    },
    { 
      label: "Sítio Novo Alvorecer (Xapuri - Sob Análise)", 
      gms: "10°39'04.3\"S 68°29'55.7\"W",
      lat: -10.6512, 
      lng: -68.4988 
    },
    { 
      label: "Fazenda Búfalo Branco (Cruzeiro do Sul)", 
      gms: "07°37'55.9\"S 72°40'15.6\"W",
      lat: -7.6322, 
      lng: -72.6710 
    },
    { 
      label: "Sítio Rio Jordão (Tarauacá - Título Pendente)", 
      gms: "08°07'24.6\"S 70°45'54.0\"W",
      lat: -8.1235, 
      lng: -70.7650 
    }
  ];

  // Chatbot Gemini States
  const [conversation, setConversation] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Olá Auditor Fiscal Ambiental! Eu sou o **AcreGeo-Fiscal AI**.\n\nForneça coordenadas em **GMS (Graus, Minutos e Segundos)** ou **Decimal** para rastrearmos o imóvel rural no CAR/SIGEF, verificarmos sobreposições com reservas legais, APPs, áreas de litígios indígenas e gerarmos em tempo real um laudo ambiental formatado para o seu processo de autuação ou parecer.\n\nExperimente as coordenadas sugeridas no painel à esquerda ou faça perguntas técnicas!"
    }
  ]);
  const [userChatInput, setUserChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Leaflet Map Refs
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const circleBufferRef = useRef<any>(null);

  // Coordenada exata inserida pelo usuário para mostrar no mini-mapa
  const [insertedLatLng, setInsertedLatLng] = useState<{lat: number; lng: number}>({ lat: -9.9740, lng: -67.8100 });

  // Leaflet Map Preview Refs (Barra Lateral)
  const mapPreviewRef = useRef<any>(null);
  const markerPreviewRef = useRef<any>(null); // Ponto exato da coordenada inserida pelo usuário
  const polygonPreviewRef = useRef<any>(null);
  const circleBufferPreviewRef = useRef<any>(null);
  const embargoLayerRef = useRef<any>(null);
  const embargoPreviewLayerRef = useRef<any>(null);

  // Initialize leafLet Map once
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).L && !mapRef.current) {
      const L = (window as any).L;
      // Centered at Acre State center
      const initialMap = L.map("map-gis-container", { zoomControl: false }).setView([-9.5, -69.5], 7);
      
      // Google Satellite Hybrid layer (satellite with roads, rivers and labels for clear context)
      L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        attribution: '&copy; Google Satellite'
      }).addTo(initialMap);

      L.control.zoom({ position: "bottomright" }).addTo(initialMap);
      mapRef.current = initialMap;

      // Inicializa também o mapa preview da barra lateral
      const initialPreviewMap = L.map("map-preview-container", { zoomControl: false }).setView([-9.9740, -67.8100], 12);
      
      L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        attribution: '&copy; Google Satellite'
      }).addTo(initialPreviewMap);

      L.control.zoom({ position: "bottomright" }).addTo(initialPreviewMap);
      mapPreviewRef.current = initialPreviewMap;

      // Executa busca inicial padrão na Fazenda Esperança
      handleSearchInternal(-9.9740, -67.8100);
    }
  }, []);

  // Update Map Preview (Sidebar) whenever insertedLatLng or foundProperty changes
  useEffect(() => {
    if (mapPreviewRef.current) {
      const L = (window as any).L;

      // Clear previous layers
      if (markerPreviewRef.current) mapPreviewRef.current.removeLayer(markerPreviewRef.current);
      if (polygonPreviewRef.current) mapPreviewRef.current.removeLayer(polygonPreviewRef.current);
      if (circleBufferPreviewRef.current) mapPreviewRef.current.removeLayer(circleBufferPreviewRef.current);
      if (embargoPreviewLayerRef.current) {
        mapPreviewRef.current.removeLayer(embargoPreviewLayerRef.current);
        embargoPreviewLayerRef.current = null;
      }

      const insertedPos: [number, number] = [insertedLatLng.lat, insertedLatLng.lng];

      // Plot the EXACT inserted user coordinate with an orange/red custom style point so it pops up inside the polygon!
      const insertedIcon = L.divIcon({
        className: 'user-inserted-pulse',
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow-md"></div>
                 <div class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-500 opacity-60"></div>
               </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      markerPreviewRef.current = L.marker(insertedPos, { icon: insertedIcon })
        .addTo(mapPreviewRef.current)
        .bindPopup(`<div class="text-xs text-zinc-950 font-sans p-1">
                      <strong class="text-red-600 block mb-0.5 font-bold">Sua Coordenada Inserida</strong>
                      Lat: ${insertedLatLng.lat.toFixed(5)}<br/>
                      Lng: ${insertedLatLng.lng.toFixed(5)}
                    </div>`)
        .openPopup();

      if (foundProperty) {
        // Plot boundaries representation
        if (foundProperty.verset_limite && foundProperty.verset_limite.length > 0) {
          const polygonCoordinates = foundProperty.verset_limite.map(v => [v.latitude, v.longitude]);
          
          let colorStatus = "#10b981"; // emerald
          if (foundProperty.status_ambiental === "Sob Análise") colorStatus = "#eab308"; // yellow
          if (foundProperty.status_ambiental === "Embargado") colorStatus = "#ef4444"; // red

          polygonPreviewRef.current = L.polygon(polygonCoordinates, {
            color: colorStatus,
            fillColor: colorStatus,
            fillOpacity: 0.25,
            weight: 3
          }).addTo(mapPreviewRef.current);

          // Fit bounds to the CAR polygon so the user sees the whole property and where their coordinate is inside
          mapPreviewRef.current.fitBounds(polygonPreviewRef.current.getBounds(), { padding: [20, 20] });
        } else {
          // Fallback if no vertices are present (plot circular buffer)
          let colorStatus = "#10b981";
          if (foundProperty.status_ambiental === "Sob Análise") colorStatus = "#eab308";
          if (foundProperty.status_ambiental === "Embargado") colorStatus = "#ef4444";

          circleBufferPreviewRef.current = L.circle([foundProperty.centro_lat, foundProperty.centro_lng], {
            color: colorStatus,
            fillColor: colorStatus,
            fillOpacity: 0.15,
            radius: 800
          }).addTo(mapPreviewRef.current);

          mapPreviewRef.current.setView(insertedPos, 13);
        }

        // Plot real embargo coordinate check (Requirement 1)
        if (foundProperty.status_ambiental === "Embargado" && foundProperty.coordenada_embargo) {
          const embargoPos: [number, number] = [foundProperty.coordenada_embargo.lat, foundProperty.coordenada_embargo.lng];
          const embargoCircle = L.circle(embargoPos, {
            color: "#dc2626",
            fillColor: "#ef4444",
            fillOpacity: 0.5,
            radius: 300,
            weight: 2,
            dashArray: "4, 4"
          }).addTo(mapPreviewRef.current);

          embargoCircle.bindPopup(`<div class="text-xs text-zinc-950 font-sans p-1">
            <strong class="text-red-600 block mb-0.5 font-bold">⚠️ AREA EMBARGADA</strong>
            Coordenada do Embargo:<br/>
            Lat: ${foundProperty.coordenada_embargo.lat.toFixed(5)}<br/>
            Lng: ${foundProperty.coordenada_embargo.lng.toFixed(5)}<br/>
            Área afetada: ~${foundProperty.coordenada_embargo.area_embargo_ha || 34} ha
          </div>`).openPopup();

          embargoPreviewLayerRef.current = embargoCircle;
        }
      } else {
        // Just focus on inserted coordinate if no properties are matched
        mapPreviewRef.current.setView(insertedPos, 12);
      }
    }
  }, [insertedLatLng, foundProperty]);

  // Update Map layers & focus whenever active property changes or GIS layer toggle is changed
  useEffect(() => {
    if (mapRef.current && foundProperty) {
      const L = (window as any).L;

      // Clear previous overlay layers
      if (markerRef.current) mapRef.current.removeLayer(markerRef.current);
      if (polygonRef.current) mapRef.current.removeLayer(polygonRef.current);
      if (circleBufferRef.current) mapRef.current.removeLayer(circleBufferRef.current);
      if (embargoLayerRef.current) {
        mapRef.current.removeLayer(embargoLayerRef.current);
        embargoLayerRef.current = null;
      }

      const center: [number, number] = [foundProperty.centro_lat, foundProperty.centro_lng];

      // Custom animated target circle (precision buffer)
      let colorStatus = "#10b981"; // emerald
      if (foundProperty.status_ambiental === "Sob Análise") colorStatus = "#eab308"; // yellow
      if (foundProperty.status_ambiental === "Embargado") colorStatus = "#ef4444"; // red

      const pulseIcon = L.divIcon({
        className: 'custom-leaflet-pulse',
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-4 h-4 rounded-full" style="background-color: ${colorStatus}; opacity: 0.8;"></div>
                 <div class="animate-ping absolute inline-flex h-7 w-7 rounded-full opacity-40" style="background-color: ${colorStatus};"></div>
               </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      markerRef.current = L.marker(center, { icon: pulseIcon }).addTo(mapRef.current);

      // Plot boundaries representation
      if (foundProperty.verset_limite && foundProperty.verset_limite.length > 0) {
        const polygonCoordinates = foundProperty.verset_limite.map(v => [v.latitude, v.longitude]);
        
        // Custom decoration based on selected GIS thematic view
        let layerColor = colorStatus;
        let fillOpacityValue = 0.25;
        let lineDashed = "";

        if (gisLayer === "app") {
          layerColor = "#3b82f6"; // blue
          fillOpacityValue = 0.4;
        } else if (gisLayer === "reserva") {
          layerColor = "#f97316"; // orange
          fillOpacityValue = 0.35;
        } else if (gisLayer === "deforestation") {
          layerColor = "#ef4444"; // intense red
          fillOpacityValue = gisLayer === "deforestation" && foundProperty.status_ambiental === "Embargado" ? 0.6 : 0.05;
          lineDashed = "10, 10";
        }

        polygonRef.current = L.polygon(polygonCoordinates, {
          color: layerColor,
          fillColor: layerColor,
          fillOpacity: fillOpacityValue,
          weight: 3,
          dashArray: lineDashed
        }).addTo(mapRef.current);

        mapRef.current.fitBounds(polygonRef.current.getBounds(), { padding: [50, 50] });
      } else {
        // Simple precision search circle if no bounds polygons are present
        circleBufferRef.current = L.circle(center, {
          color: colorStatus,
          fillColor: colorStatus,
          fillOpacity: 0.15,
          radius: 1200 // 1.2km precision radii
        }).addTo(mapRef.current);

        mapRef.current.setView(center, 13);
      }

      // Plot real embargo coordinate check (Requirement 1)
      if (foundProperty.status_ambiental === "Embargado" && foundProperty.coordenada_embargo) {
        const embargoPos: [number, number] = [foundProperty.coordenada_embargo.lat, foundProperty.coordenada_embargo.lng];
        
        const embargoCircle = L.circle(embargoPos, {
          color: "#dc2626",
          fillColor: "#ef4444",
          fillOpacity: 0.55,
          radius: 350,
          weight: 3,
          dashArray: "5, 5"
        }).addTo(mapRef.current);

        embargoCircle.bindPopup(`<div class="text-xs text-zinc-950 font-sans p-1">
          <strong class="text-red-600 block mb-0.5 font-bold">⚠️ ÁREA EMBARGADA (Area Embargada)</strong>
          <span class="text-zinc-500 font-mono text-[10px] block mb-1">Poligonal sob embargo e multa ativa</span>
          Coordenada do Embargo:<br/>
          Lat: ${foundProperty.coordenada_embargo.lat.toFixed(5)} S<br/>
          Lng: ${foundProperty.coordenada_embargo.lng.toFixed(5)} W<br/>
          Tamanho do Desflorestamento: ~${foundProperty.coordenada_embargo.area_embargo_ha || 34} ha
        </div>`);

        embargoLayerRef.current = embargoCircle;
      }
    }
  }, [foundProperty, gisLayer]);

  // Handle local data exploration (Coordinate Calculation, DB Searching & Center Map)
  const handleSearchInternal = (lat: number, lng: number) => {
    setSearchLoading(true);
    setSearchError(null);
    setInsertedLatLng({ lat, lng });

    const res = buscar_imovel_por_coordenada(lat, lng);
    if (res.erro) {
      setSearchError(res.erro);
      setFoundProperty(null);
    } else if (res.data) {
      setFoundProperty(res.data);
      // Synchronize GMS form values
      syncFormValues(res.data.centro_lat, res.data.centro_lng);
    }
    setSearchLoading(false);
  };

  // Convert GMS inputs of the Form and call query
  const handleGMSQuery = () => {
    const lg = parseInt(latG) || 0;
    const lm = parseInt(latM) || 0;
    const ls = parseFloat(latS) || 0;
    const ldir = latDir.toUpperCase();

    const lngg = parseInt(lngG) || 0;
    const lngm = parseInt(lngM) || 0;
    const lngs = parseFloat(lngS) || 0;
    const lngdir = lngDir.toUpperCase();

    // Convert to decimal degrees
    let latDecimal = lg + (lm / 60) + (ls / 3600);
    if (ldir === "S") latDecimal = -latDecimal;

    let lngDecimal = lngg + (lngm / 60) + (lngs / 3600);
    if (lngdir === "W" || lngdir === "O") lngDecimal = -lngDecimal;

    handleSearchInternal(latDecimal, lngDecimal);
  };

  // Process manual paste/raw string input
  const handleRawQuery = () => {
    const parsed = extrairCoordenadasGMS(rawTextCoords);
    if (parsed.erro) {
      setSearchError(parsed.erro);
    } else {
      handleSearchInternal(parsed.latitude, parsed.longitude);
    }
  };

  // Sync Form when coordinates updates via Gemini call or button click
  const syncFormValues = (latDec: number, lngDec: number) => {
    // Lat GMS parsing for form
    const absLat = Math.abs(latDec);
    const laG = Math.floor(absLat);
    const laMfrac = (absLat - laG) * 60;
    const laM = Math.floor(laMfrac);
    const laS = (laMfrac - laM) * 60;

    setLatG(String(laG));
    setLatM(String(laM));
    setLatS(laS.toFixed(1));
    setLatDir(latDec < 0 ? "S" : "N");

    // Lng GMS parsing for form
    const absLng = Math.abs(lngDec);
    const lnG = Math.floor(absLng);
    const lnMfrac = (absLng - lnG) * 60;
    const lnM = Math.floor(lnMfrac);
    const lnS = (lnMfrac - lnM) * 60;

    setLngG(String(lnG));
    setLngM(String(lnM));
    setLngS(lnS.toFixed(1));
    setLngDir(lngDec < 0 ? "W" : "E");

    setRawTextCoords(`${decimalParaGMS(latDec, true)} ${decimalParaGMS(lngDec, false)}`);
  };

  // Quick select preconfigured coordinates
  const selectSugerida = (sug: typeof SUGERIDAS[0]) => {
    setRawTextCoords(sug.gms);
    syncFormValues(sug.lat, sug.lng);
    handleSearchInternal(sug.lat, sug.lng);
  };

  // Submit chat to Backend Node/Express API (handles Gemini Call directly)
  const sendChatMessage = async (presetText?: string) => {
    const query = presetText || userChatInput;
    if (!query.trim()) return;

    const newMsgs = [...conversation, { role: "user" as const, content: query }];
    setConversation(newMsgs);
    setUserChatInput("");
    setChatLoading(true);

    try {
      const apiResponse = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs })
      });

      if (!apiResponse.ok) {
        throw new Error("Resposta indisponível do servidor.");
      }

      const rawData = await apiResponse.json();
      
      setConversation(prev => [...prev, { role: "assistant", content: rawData.content }]);

      // Check if Gemini invoked coordinate search function and returns reactive property updates!
      if (rawData.foundProperty) {
        setFoundProperty(rawData.foundProperty);
        setSearchError(null);
        syncFormValues(rawData.foundProperty.centro_lat, rawData.foundProperty.centro_lng);
        
        // Also focus on dashboard automatically to show the visual GIS map updates!
        if (activeTab === "chat") {
          setActiveTab("dashboard");
        }
      } else if (rawData.errorDb) {
        setSearchError(rawData.errorDb);
        setFoundProperty(null);
      }
    } catch (err: any) {
      console.error(err);
      setConversation(prev => [...prev, { 
        role: "assistant", 
        content: `⚠️ **Falha na Conexão:** Não foi possível contactar o assistente inteligente no backend.\n\nDetalhe do erro: ${err.message || err}` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper trigger to open Chat discussing active land anomalies
  const handleConsultIAOnProperty = () => {
    if (!foundProperty) return;
    setActiveTab("chat");
    sendChatMessage(`Faça uma auditoria fiscal detalhada para a coordenada ${foundProperty.centro_lat}, ${foundProperty.centro_lng} (${foundProperty.nome}).`);
  };

  // PDF Technical Report generator simulator for audit processes
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans grid-overlay text-zinc-100">
      
      {/* 1. TOP HEADER DECORATION (Acre Militarized Agency/Federal standard look) */}
      <header className="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg tracking-tight text-white">AcreGeo-Fiscal</h1>
              <span className="text-[10px] uppercase font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                SISTEMA INTEGRADO V2026
              </span>
            </div>
            <p className="text-xs text-zinc-400">Ambiente de Operação e Analítica de Imóveis Rurais — Acre, Brasil</p>
          </div>
        </div>

        {/* Audit Meta badges */}
        <div className="flex items-center gap-3 self-end md:self-center font-mono text-[11px]">
          <div className="hidden sm:flex flex-col items-end border-r border-zinc-800 pr-3">
            <span className="text-zinc-500">CONEXÃO INPE DE DESMATAMENTO</span>
            <span className="text-emerald-500 font-medium">SAD / DETER ATIVO</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-300">Banco CAR/SIGEF Online</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN HUB ACTIONS (DASHBOARD TABS AND GIS CHASSIS) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT COLUMN: 3-cols (GMS Inputs, Quick Samples and layer panels) - NO PRINT */}
        <section className="lg:col-span-3 border-r border-zinc-800 bg-zinc-900/30 overflow-y-auto no-print">
          
          {/* Coordinates Inputs Form Container */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Coordenadas Geográficas
              </span>
              <div className="flex rounded-md p-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono">
                <button 
                  onClick={() => setCoordType("gms")} 
                  className={`px-2 py-1 rounded-sm transition ${coordType === "gms" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400"}`}
                >
                  Form GMS
                </button>
                <button 
                  onClick={() => setCoordType("raw")} 
                  className={`px-2 py-1 rounded-sm transition ${coordType === "raw" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400"}`}
                >
                  Texto
                </button>
              </div>
            </div>

            {coordType === "gms" ? (
              <div className="space-y-4">
                {/* Latitude GMS Input Fields */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase">Latitude (SUL / S)</span>
                  <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                    <div>
                      <input 
                        type="text" 
                        value={latG} 
                        onChange={(e) => setLatG(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded py-1 px-1 text-center text-sm focus:border-emerald-500 outline-none text-white font-bold" 
                        placeholder="GG" 
                      />
                      <label className="text-[9px] text-zinc-500">Graus</label>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={latM} 
                        onChange={(e) => setLatM(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded py-1 px-1 text-center text-sm focus:border-emerald-500 outline-none text-white font-bold" 
                        placeholder="MM" 
                      />
                      <label className="text-[9px] text-zinc-500">Minutos</label>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={latS} 
                        onChange={(e) => setLatS(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded py-1 px-1 text-center text-sm focus:border-emerald-500 outline-none text-white font-bold" 
                        placeholder="SS.S" 
                      />
                      <label className="text-[9px] text-zinc-500">Segundos</label>
                    </div>
                    <div>
                      <select 
                        value={latDir} 
                        onChange={(e) => setLatDir(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded py-1 px-1 text-center text-sm focus:border-emerald-500 outline-none text-emerald-400 font-bold"
                      >
                        <option value="S">S (Sul)</option>
                        <option value="N">N (Norte)</option>
                      </select>
                      <label className="text-[9px] text-zinc-500">Hemi.</label>
                    </div>
                  </div>
                </div>

                {/* Longitude GMS Input Fields */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase">Longitude (OESTE / W)</span>
                  <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                    <div>
                      <input 
                        type="text" 
                        value={lngG} 
                        onChange={(e) => setLngG(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded py-1 px-1 text-center text-sm focus:border-emerald-500 outline-none text-white font-bold" 
                        placeholder="GG" 
                      />
                      <label className="text-[9px] text-zinc-500">Graus</label>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={lngM} 
                        onChange={(e) => setLngM(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded py-1 px-1 text-center text-sm focus:border-emerald-500 outline-none text-white font-bold" 
                        placeholder="MM" 
                      />
                      <label className="text-[9px] text-zinc-500">Minutos</label>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={lngS} 
                        onChange={(e) => setLngS(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded py-1 px-1 text-center text-sm focus:border-emerald-500 outline-none text-white font-bold" 
                        placeholder="SS.S" 
                      />
                      <label className="text-[9px] text-zinc-500">Segundos</label>
                    </div>
                    <div>
                      <select 
                        value={lngDir} 
                        onChange={(e) => setLngDir(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded py-1 px-1 text-center text-sm focus:border-emerald-500 outline-none text-emerald-400 font-bold"
                      >
                        <option value="W">W / O</option>
                        <option value="E">E</option>
                      </select>
                      <label className="text-[9px] text-zinc-500">Hemi.</label>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleGMSQuery}
                  disabled={searchLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition font-medium text-xs text-white rounded flex items-center justify-center gap-1.5 shadow"
                >
                  <Search className="w-3.5 h-3.5" />
                  {searchLoading ? "Buscando..." : "Consultar Coordenada"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase">Texto Livro ou Decimal Copiado</span>
                  <input 
                    type="text" 
                    value={rawTextCoords}
                    onChange={(e) => setRawTextCoords(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded py-2 px-3 text-xs focus:border-emerald-500 outline-none text-white font-mono font-medium" 
                    placeholder="Ex: 09°58'26.4&quot;S 67°48'36&quot;W ou -9.974, -67.810" 
                  />
                  <label className="text-[9px] text-zinc-500">Suporta colar de laudos, PDFs ou GPS (GMS/Decimal)</label>
                </div>
                <button 
                  onClick={handleRawQuery}
                  disabled={searchLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 transition font-medium text-xs text-white rounded flex items-center justify-center gap-1.5 shadow"
                >
                  <Search className="w-3.5 h-3.5" />
                  {searchLoading ? "Buscando..." : "Extrair & Consultar"}
                </button>
              </div>
            )}
          </div>

          {/* Painel de Resultados Imediatos da Coordenada Inserida (Requisito 2) */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/20 space-y-3.5 no-print">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-semibold">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Resultado da Coordenada
            </span>

            {/* Quadro Médio: Mapa Real da Coordenada Inserida */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Localização no Mapa Real</span>
                <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-805">
                  PT: {insertedLatLng.lat.toFixed(5)}, {insertedLatLng.lng.toFixed(5)}
                </span>
              </div>
              
              <div 
                id="map-preview-container" 
                className="w-full h-[230px] rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden relative z-0"
              >
                {/* O Leaflet injetará o mapa de preview aqui */}
              </div>
              <p className="text-[9px] text-zinc-500 font-mono text-center">
                Ponto Vermelho: Posicionamento inserido • Polígono: Área CAR/SIGEF
              </p>
            </div>

            {/* Informações estruturadas de resultado imediato */}
            {foundProperty ? (
              <div className="space-y-2 pt-0.5">
                <div className="p-2.5 bg-zinc-900/40 border border-zinc-800 rounded-lg space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="truncate">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block leading-none">Imóvel Encontrado</span>
                      <strong className="font-semibold text-white truncate block">{foundProperty.nome}</strong>
                    </div>
                    <div className="flex-shrink-0">
                      {foundProperty.status_ambiental === "Regular" && (
                        <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-mono font-bold">
                          REGULAR
                        </span>
                      )}
                      {foundProperty.status_ambiental === "Sob Análise" && (
                        <span className="px-1.5 py-0.5 bg-yellow-950 text-yellow-400 border border-yellow-800 rounded text-[10px] font-mono font-bold">
                          ANÁLISE
                        </span>
                      )}
                      {foundProperty.status_ambiental === "Embargado" && (
                        <span className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[10px] font-mono font-bold">
                          ÁREA EMBARGADA
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1.5 border-t border-zinc-800/60">
                    <div className="col-span-2">
                      <span className="text-zinc-500 block text-[9px]">RECIBO CAR:</span>
                      <span className="text-zinc-300 font-bold break-all select-all leading-tight block">{foundProperty.numero_car}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px]">CÓDIGO SIGEF:</span>
                      <span className="text-zinc-350 select-all block">{foundProperty.sigef_codigo}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px]">ÁREA DECLA:</span>
                      <span className="text-zinc-350 font-bold block">{foundProperty.area_ha.toLocaleString("pt-BR")} ha</span>
                    </div>
                    <div className="col-span-2 border-t border-zinc-850 pt-1">
                      <span className="text-zinc-500 block text-[9px]">DETENTOR REGISTRADO:</span>
                      <span className="text-zinc-300 font-bold truncate block">{foundProperty.proprietario}</span>
                    </div>
                  </div>

                  {foundProperty.status_ambiental === "Embargado" && (
                    <div className="p-2 bg-red-950/40 border border-red-800/60 rounded text-[10px] text-red-200 mt-2 space-y-1">
                      <span className="font-bold flex items-center gap-1 text-red-400 uppercase font-mono">
                        <AlertTriangle className="w-3 h-3 text-red-400" /> Area Embargada
                      </span>
                      <p className="leading-tight text-zinc-300 font-sans">
                        Supressão não autorizada detectada na poligonal do imóvel.
                      </p>
                      {foundProperty.coordenada_embargo && (
                        <div className="mt-1 font-sans">
                          <span className="text-[9px] text-zinc-400 block font-mono">COORDENADAS DO EMBARGO:</span>
                          <span className="font-mono text-white font-semibold block bg-zinc-950/80 px-1 py-1 border border-red-900/40 rounded mt-0.5 select-all">
                            Lat: {foundProperty.coordenada_embargo.lat.toFixed(5)} S, Lng: {foundProperty.coordenada_embargo.lng.toFixed(5)} W
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : searchError ? (
              <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded-lg text-[11px] text-red-400 leading-normal font-sans space-y-1">
                <span className="font-bold font-mono uppercase text-[9px] flex items-center gap-1 text-red-500">
                  <AlertTriangle className="w-3.5 h-3.5" /> Território Sem Cobertura CAR
                </span>
                <p>{searchError}</p>
              </div>
            ) : (
              <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center text-xs text-zinc-500 font-mono">
                Aguardando decodificação de coordenadas...
              </div>
            )}
          </div>

          {/* GIS Thematic Layer Controller */}
          <div className="p-4">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              Temáticas de Sensitividade Geográfica
            </h3>
            <div className="space-y-1 select-none">
              <label 
                onClick={() => setGisLayer("car")}
                className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer border ${
                  gisLayer === "car" 
                    ? "bg-emerald-950/45 border-emerald-800/60 text-emerald-300" 
                    : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span>Delimitação Oficial CAR</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">{gisLayer === "car" ? "Ativa" : ""}</span>
              </label>

              <label 
                onClick={() => setGisLayer("app")}
                className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer border ${
                  gisLayer === "app" 
                    ? "bg-blue-950/45 border-blue-800/60 text-blue-300" 
                    : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span>Preservação Correntes APP</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">{gisLayer === "app" ? "Ativa" : ""}</span>
              </label>

              <label 
                onClick={() => setGisLayer("reserva")}
                className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer border ${
                  gisLayer === "reserva" 
                    ? "bg-orange-950/45 border-orange-850/60 text-orange-300" 
                    : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-500"></div>
                  <span>Percentual Reserva Legal (20% AMZ)</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">{gisLayer === "reserva" ? "Ativa" : ""}</span>
              </label>

              <label 
                onClick={() => setGisLayer("deforestation")}
                className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer border ${
                  gisLayer === "deforestation" 
                    ? "bg-red-950/45 border-red-800/60 text-red-300" 
                    : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500 animate-pulse"></div>
                  <span>Alertas Satélites desmatamento</span>
                </div>
                <span className="text-[9px] font-mono text-red-400">{gisLayer === "deforestation" ? "Deter+" : ""}</span>
              </label>
            </div>
          </div>

        </section>

        {/* MIDDLE SECTION: Tab navigation, interactive Leaflet Map canvas, metadata tables (GMS coordinates report) */}
        <main className="lg:col-span-9 flex flex-col overflow-hidden">
          
          {/* Main Action TABS - NO PRINT */}
          <nav className="flex justify-between items-center border-b border-zinc-800 bg-zinc-900/50 px-4 md:px-6 py-2.5 no-print">
            <div className="flex items-center gap-1 w-full sm:w-auto">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === "dashboard" ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Compass className="w-4 h-4" />
                Painel Consolidado (GIS)
              </button>
              
              <button 
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition relative ${
                  activeTab === "chat" ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700" : "text-zinc-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Auditoría IA Especializada
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </button>

              <button 
                onClick={() => setActiveTab("report")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === "report" ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700" : "text-zinc-400 hover:text-white"
                }`}
              >
                <FileText className="w-4 h-4" />
                Parecer Técnico (Laudo)
              </button>
            </div>

            <div className="hidden sm:flex items-center">
              <span className="text-[10px] font-mono text-zinc-500">COORD: {foundProperty ? `${foundProperty.centro_lat.toFixed(4)}, ${foundProperty.centro_lng.toFixed(4)}` : "AGUARDANDO"}</span>
            </div>
          </nav>

          {/* TAB 1: DASHBOARD CONSOLIDADO */}
          {activeTab === "dashboard" && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden h-full">
              
              {/* Map GIS Canvas */}
              <div className="md:col-span-7 relative bg-zinc-950 border-r border-zinc-800 flex flex-col h-[350px] md:h-full">
                
                {/* Layer Map Status Indicator */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
                  <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 py-1.5 px-3 rounded shadow text-[10px] font-mono backdrop-blur">
                    <span className="w-2 h-2 rounded bg-emerald-500"></span>
                    <span className="text-zinc-300 font-semibold">GOOGLE SATELLITE HYBRID</span>
                  </div>
                  {foundProperty && (
                    <div className="flex items-center gap-2 bg-zinc-900/95 border border-zinc-800 py-1 px-3 rounded shadow text-[10px] font-mono backdrop-blur text-zinc-400">
                      <span>Proximidade:</span>
                      <span className="text-emerald-400 font-bold">{foundProperty.municipio}</span>
                    </div>
                  )}
                </div>

                {/* Satellite deforest alarm if active view is defor and land is embargado */}
                {gisLayer === "deforestation" && foundProperty && foundProperty.status_ambiental === "Embargado" && (
                  <div className="absolute top-4 right-4 z-10 bg-red-950 border border-red-800 text-red-400 animate-pulse text-[10px] uppercase font-mono py-1.5 px-3 rounded shadow font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce-slow" />
                    Foco Deter Detectado
                  </div>
                )}

                {/* Map element placeholder (Will mount Leaflet here) */}
                <div id="map-gis-container" className="w-full flex-1 z-0"></div>

                {/* Map Bottom HUD Warning Panel */}
                {searchError && (
                  <div className="absolute bottom-4 left-4 right-4 z-10 p-3 bg-red-950/95 border border-red-800 text-red-200 text-xs rounded-lg shadow-lg flex items-start gap-2 backdrop-blur">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-400">Limite de Cobertura Cartográfica</p>
                      <p className="text-zinc-300">{searchError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Data HUD - Metadata of property under verification */}
              <div className="md:col-span-5 p-4 md:p-6 overflow-y-auto space-y-6 bg-zinc-900/20 h-full">
                
                {foundProperty ? (
                  <div className="space-y-6">
                    
                    {/* Property header header and quick status */}
                    <div className="pb-4 border-b border-zinc-800 flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Imóvel Georreferenciado</span>
                        <h2 className="text-xl font-display font-bold text-white leading-tight">{foundProperty.nome}</h2>
                        <span className="text-xs text-zinc-400">{foundProperty.municipio} / AC • Código INCRA</span>
                      </div>
                      
                      {/* Enquadramento Legal badge lights */}
                      <div>
                        {foundProperty.status_ambiental === "Regular" && (
                          <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono rounded-full font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            REGULAR
                          </span>
                        )}
                        {foundProperty.status_ambiental === "Sob Análise" && (
                          <span className="px-2.5 py-1 bg-yellow-950 text-yellow-400 border border-yellow-800 text-xs font-mono rounded-full font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            ANÁLISE
                          </span>
                        )}
                        {foundProperty.status_ambiental === "Embargado" && (
                          <span className="px-2.5 py-1 bg-red-950 text-red-400 border border-red-800 text-xs font-mono rounded-full font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            EMBARGADO
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CORE REGISTRY CARD GRID (CAR, SIGEF etc.) */}
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* CAR numbers */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded p-3 col-span-2">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase mb-1">
                          <Hash className="w-3.5 h-3.5 text-emerald-400" />
                          Número do Recibo no CAR
                        </div>
                        <span className="font-mono text-xs font-bold text-white block select-all tracking-wider">{foundProperty.numero_car}</span>
                      </div>

                      {/* SIGEF INCRA code */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase mb-1">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          Código SIGEF / INCRA
                        </div>
                        <span className="font-mono text-xs font-bold text-white block select-all">{foundProperty.sigef_codigo}</span>
                      </div>

                      {/* Area hectares */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase mb-1">
                          <Compass className="w-3.5 h-3.5 text-emerald-400" />
                          Área Declarada (Área)
                        </div>
                        <span className="font-sans text-sm font-extrabold text-white block">{foundProperty.area_ha.toLocaleString("pt-BR")} <span className="text-xs text-zinc-400 font-normal">hectares (ha)</span></span>
                      </div>

                      {/* Proprietario */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded p-3 col-span-2">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase mb-1">
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                          Proprietário / Detentor Registrado
                        </div>
                        <span className="font-sans text-sm font-bold text-zinc-100 block">{foundProperty.proprietario}</span>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 border border-zinc-800 rounded">
                            CPF/CNPJ: {foundProperty.cpf_cnpj}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-500 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Base INCRA Certificada
                          </span>
                        </div>
                        <p className="mt-2 text-[9px] font-mono text-zinc-400 leading-normal border-t border-zinc-800/60 pt-1.5">
                          ✔ documento obtido através da base: <strong className="text-emerald-400 font-semibold uppercase">INCRA / Receita Federal Sinter</strong>
                        </p>
                      </div>
                    </div>

                    {/* Deforestation alert text infobox */}
                    {foundProperty.status_ambiental === "Embargado" && foundProperty.detalhes_deforestacao && (
                      <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold font-mono">
                          <AlertTriangle className="w-4 h-4 animate-pulse" />
                          ALERTA DE INFRAÇÃO DETECTADO (Art. 12 Código Florestal)
                        </div>
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                          {foundProperty.detalhes_deforestacao}
                        </p>
                      </div>
                    )}

                    {/* Observacoes gerais */}
                    <div className="space-y-1 bg-zinc-900/40 border border-zinc-800/60 p-3 rounded">
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-1 mb-1.5">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Parecer Preliminar de Monitoramento</span>
                        <span className="text-[9px] font-mono text-emerald-500 font-extrabold bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/40">SIGEF / INCRA</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{foundProperty.observacoes}</p>
                    </div>

                    {/* Verticos Tabela */}
                    {foundProperty.verset_limite && foundProperty.verset_limite.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block font-bold">Coordenadas Geográficas da Propriedade</span>
                        <div className="border border-zinc-800 rounded bg-zinc-950 overflow-hidden font-mono text-[10px]">
                          <table className="w-full text-left">
                            <thead className="bg-zinc-900 text-zinc-500 border-b border-zinc-800 uppercase text-[9px]">
                              <tr>
                                <th className="p-2">ID Marco</th>
                                <th className="p-2">Latitude (GMS / Dec)</th>
                                <th className="p-2">Longitude (GMS / Dec)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900 text-zinc-300">
                              {foundProperty.verset_limite.map((v, i) => (
                                <tr key={i} className="hover:bg-zinc-900/40 transition">
                                  <td className="p-2 font-bold text-emerald-400">{v.identificador}</td>
                                  <td className="p-2">
                                    <span className="block">{v.latitudeGMS}</span>
                                    <span className="text-[9px] text-zinc-500">{v.latitude.toFixed(6)}°</span>
                                  </td>
                                  <td className="p-2">
                                    <span className="block">{v.longitudeGMS}</span>
                                    <span className="text-[9px] text-zinc-500">{v.longitude.toFixed(6)}°</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Interactive Property Limits Mini-Map showing user point relative to property bounds */}
                        <PropertyMiniMap property={foundProperty} insertedLatLng={insertedLatLng} />
                      </div>
                    )}

                    {/* Quick call IA & print options */}
                    <div className="pt-2 flex gap-2">
                      <button 
                        onClick={handleConsultIAOnProperty}
                        className="flex-1 py-2.1 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 transition font-medium text-xs rounded-md text-white flex items-center justify-center gap-1.5 shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                        Compor Laudo no Gemini
                      </button>
                      
                      <button 
                        onClick={() => setActiveTab("report")}
                        className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 transition font-medium text-xs rounded-md text-zinc-300 flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Parecer Técnico
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Compass className="w-12 h-12 text-zinc-700 animate-spin-slow" />
                    <div>
                      <h3 className="font-display font-medium text-white">Nenhum Imóvel Selecionado</h3>
                      <p className="text-xs text-zinc-500 max-w-xs mt-1">
                        Insira as coordenadas GMS ou clique em uma das fazendas registradas à esquerda para carregar o histórico espacial neste painel.
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 2: AUDITORIA IA COMPACTA */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden h-full">
              
              {/* Chat Scroll container */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
                {conversation.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-3 max-w-3xl ${
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 border ${
                      msg.role === "user" 
                        ? "bg-zinc-800 border-zinc-700 text-zinc-200" 
                        : "bg-emerald-950/20 border-emerald-900/30 text-emerald-400"
                    }`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    
                    <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-zinc-900 border-zinc-800 text-zinc-200" 
                        : "bg-zinc-900/60 border-zinc-800/40 text-zinc-300"
                    }`}>
                      {msg.content.split("\n").map((line, lineIdx) => {
                        // Very basic markdown translation highlights
                        let renderedLine = line;
                        
                        // Bold tags
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        const boldMatches = [...renderedLine.matchAll(boldRegex)];
                        
                        let hasFormattings = false;
                        if (boldMatches.length > 0) {
                          hasFormattings = true;
                        }

                        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                          return (
                            <li key={lineIdx} className="ml-4 list-disc my-1">
                              <span dangerouslySetInnerHTML={{ __html: line.replace(/^[\s-*]+/, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                            </li>
                          );
                        }

                        if (line.trim().startsWith("### ")) {
                          return <h4 key={lineIdx} className="text-base font-bold text-emerald-400 mt-3 mb-1 font-display" dangerouslySetInnerHTML={{ __html: line.replace("### ", "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
                        }

                        if (line.trim().startsWith("## ")) {
                          return <h3 key={lineIdx} className="text-lg font-bold text-white border-b border-zinc-800/80 pb-1 mt-4 mb-2 font-display" dangerouslySetInnerHTML={{ __html: line.replace("## ", "").replace(/\*\frac{.*?}/g, "<strong>$1</strong>") }} />;
                        }

                        if (line.trim().startsWith("# ")) {
                          return <h2 key={lineIdx} className="text-xl font-bold text-emerald-300 mt-5 mb-3 font-display border-l-2 border-emerald-500 pl-2" dangerouslySetInnerHTML={{ __html: line.replace("# ", "") }} />;
                        }

                        return (
                          <p key={lineIdx} className="mb-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-start gap-4 mr-auto max-w-lg">
                    <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-950 text-emerald-500 animate-spin">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl text-zinc-400 text-xs font-mono flex items-center gap-2">
                      <span>Analisando poligonais, convertendo GMS e processando relatório técnico...</span>
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bot Chips triggers (IA guidance help clicks) */}
              <div className="border-t border-zinc-900/80 px-4 py-3 bg-zinc-900/20 flex gap-2 overflow-x-auto select-none no-print">
                <span className="text-[10px] font-mono text-zinc-500 uppercase self-center flex-shrink-0">Perguntar ao Gemini:</span>
                <button 
                  onClick={() => sendChatMessage("Tenho a coordenada 9°58'26.4\"S 67°48'36.0\"W da Fazenda Esperança. Quem é o dono dela e qual a situação ambiental no CAR?")}
                  className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-zinc-300 text-xs rounded-full transition font-mono whitespace-nowrap"
                >
                  Rastreas Esperança GMS
                </button>
                <button 
                  onClick={() => sendChatMessage("Qual a coordenada decimal e o titular do Sítio Novo Alvorecer cadastrado em Xapuri?")}
                  className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-zinc-300 text-xs rounded-full transition font-mono whitespace-nowrap"
                >
                  Auditar Sítio Novo Alvorecer
                </button>
                <button 
                  onClick={() => sendChatMessage("Explique quais as penalidades decorrentes do desmatamento ilegal em terras sob embargo no Acre de acordo com as diretrizes do IMAC.")}
                  className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-zinc-300 text-xs rounded-full transition font-mono whitespace-nowrap"
                >
                  Diretrizes de Embargo do IMAC
                </button>
              </div>

              {/* Chat Send Form */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex gap-2 items-center no-print">
                <input 
                  type="text" 
                  value={userChatInput}
                  onChange={(e) => setUserChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="Envie uma coordenada em GMS ou pergunte sobre a legislação florestal..."
                  className="bg-zinc-950 text-sm border border-zinc-800 rounded-lg flex-1 py-2.5 px-4 outline-none focus:border-emerald-500 text-zinc-100 placeholder-zinc-500"
                />
                <button 
                  onClick={() => sendChatMessage()}
                  disabled={chatLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition hover:scale-101 py-2.5 px-5 text-sm font-semibold rounded-lg text-white"
                >
                  Enviar
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: PARECER LAUDO TECNICO DOC */}
          {activeTab === "report" && (
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 flex flex-col items-center">
              
              {/* Document control toolbox */}
              <div className="w-full max-w-3xl mb-4 flex justify-between items-center no-print">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-mono uppercase text-zinc-400">Emissão de Laudo Técnico Ambiental</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Parecer
                  </button>
                </div>
              </div>

              {foundProperty ? (
                /* Print block paper format */
                <article className="w-full max-w-3xl bg-zinc-900/30 border border-zinc-800/80 p-8 md:p-12 text-zinc-300 font-sans leading-relaxed text-sm rounded-lg shadow-2xl relative space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                  
                  {/* Document Title header without regulatory organs as requested */}
                  <div className="border-b-2 border-emerald-800 pb-4 text-center">
                    <h1 className="text-lg font-display font-bold text-white uppercase tracking-wide">Relatório Técnico de Vistoria de Regularidade Fundiária</h1>
                  </div>

                  {/* Metadata general block */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-zinc-800 pb-3">
                    <div>
                      <span className="text-zinc-500 block uppercase font-semibold">TIPO DE SOLICITAÇÃO</span>
                      <span className="text-zinc-200">Fiscalização de Confluência Ambiental</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase font-semibold">DATA DA CONSULTA</span>
                      <span className="text-zinc-200">19 de Maio de 2026</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase font-semibold">REQUERENTE / DETENTOR</span>
                      <span className="text-zinc-200">{foundProperty.proprietario}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase font-semibold">CPF / CNPJ TITULAR</span>
                      <span className="text-zinc-200">{foundProperty.cpf_cnpj}</span>
                      <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                        Base de Origem: <strong className="text-emerald-500">INCRA / Receita Federal Sinter</strong>
                      </span>
                    </div>
                  </div>

                  {/* Property specifications */}
                  <div className="space-y-3">
                    <h3 className="font-display font-bold text-base text-emerald-400 uppercase border-l-2 border-emerald-500 pl-2">I. Caracterização Geográfica do Imóvel</h3>
                    <p>
                      Conforme consulta cartográfica espacial georreferenciada executada no centróide informado, foi localizado o imóvel rural denominado <strong>{foundProperty.nome}</strong>, localizado na circunscrição administrativa do município de <strong>{foundProperty.municipio} / AC</strong>.
                    </p>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded font-mono text-xs space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <strong className="text-zinc-400">Latitude Decimal:</strong> {foundProperty.centro_lat.toFixed(5)} S
                        </div>
                        <div>
                          <strong className="text-zinc-400">Longitude Decimal:</strong> {foundProperty.centro_lng.toFixed(5)} W
                        </div>
                        <div>
                          <strong className="text-zinc-400">Latitude GMS:</strong> {decimalParaGMS(foundProperty.centro_lat, true)}
                        </div>
                        <div>
                          <strong className="text-zinc-400">Longitude GMS:</strong> {decimalParaGMS(foundProperty.centro_lng, false)}
                        </div>
                      </div>
                      <div className="border-t border-zinc-800 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <strong className="text-zinc-400">Código SIGEF:</strong> {foundProperty.sigef_codigo}
                        </div>
                        <div>
                          <strong className="text-zinc-400">Área Georreferenciada:</strong> {foundProperty.area_ha} hectares
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <strong className="text-zinc-400">Cadastro Ambiental Rural (CAR):</strong> {foundProperty.numero_car}
                        </div>
                      </div>
                      
                      {foundProperty.verset_limite && foundProperty.verset_limite.length > 0 && (
                        <div className="border-t border-zinc-800 pt-2 space-y-1">
                          <strong className="text-zinc-400 block uppercase text-[10px] tracking-wider">Coordenadas Geográficas da Propriedade (Limites)</strong>
                          <div className="border border-zinc-800/80 rounded bg-zinc-950/60 overflow-hidden font-mono text-[10px]">
                            <table className="w-full text-left">
                              <thead className="bg-zinc-900/60 text-zinc-500 border-b border-zinc-850 uppercase text-[9px]">
                                <tr>
                                  <th className="p-1 px-2">Marco</th>
                                  <th className="p-1 px-2">Latitude (GMS / Dec)</th>
                                  <th className="p-1 px-2">Longitude (GMS / Dec)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                                {foundProperty.verset_limite.map((v, i) => (
                                  <tr key={i} className="hover:bg-zinc-900/20 transition">
                                    <td className="p-1 px-2 font-bold text-emerald-400">{v.identificador}</td>
                                    <td className="p-1 px-2">
                                      <span>{v.latitudeGMS}</span> <span className="text-zinc-500 text-[9px] font-normal ml-1">({v.latitude.toFixed(6)})</span>
                                    </td>
                                    <td className="p-1 px-2">
                                      <span>{v.longitudeGMS}</span> <span className="text-zinc-500 text-[9px] font-normal ml-1">({v.longitude.toFixed(6)})</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Environmental conformance checks and Law citations */}
                  <div className="space-y-3">
                    <h3 className="font-display font-bold text-base text-emerald-400 uppercase border-l-2 border-emerald-500 pl-2">II. Enquadramento e Adequabilidade Ambiental</h3>
                    <p>
                      A análise técnica de adempimento das regras do <strong>Código Florestal Brasileiro (Lei nº 12.651/2012)</strong> revelou as seguintes aferições analíticas de regularidade da terra:
                    </p>
                    <ul className="space-y-2 text-xs font-mono">
                      <li className="flex items-start gap-1.5 p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                        <span className="text-emerald-400">✔</span>
                        <div>
                          <strong>Reserva Legal (Art. 12, I, &quot;a&quot;):</strong> O imóvel apresenta percentual de reserva legal declarado de <strong>{foundProperty.legal_reserva_percent}%</strong> da área total. 
                          {foundProperty.legal_reserva_percent < 20 ? (
                            <span className="text-red-400 block font-bold mt-1">⚠️ ATENÇÃO: Percentual inferior ao limite federal obrigatório de 20% estabelecido para a Amazônia Legal.</span>
                          ) : (
                            <span className="text-emerald-500 block font-bold mt-1">✔ Conforme: Percentual atende aos parâmetros legais do bioma.</span>
                          )}
                        </div>
                      </li>

                      <li className="flex items-start gap-1.5 p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                        <span className="text-emerald-400">✔</span>
                        <div>
                          <strong>Áreas de Preservação Permanente (APP - Art. 4º):</strong> Mapeamento acusa <strong>{foundProperty.app_area_ha} hectares</strong> de APP protegida de matas ciliares nos corpos hídricos delimitados na poligonal. No momento da consulta não foram encontrados focos severos de degradação antrópica nestes limites.
                        </div>
                      </li>

                      <li className="flex items-start gap-1.5 p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                        <span className="text-emerald-400">✔</span>
                        <div>
                          <strong>Situação da Certificação Fundiária (SIGEF):</strong> Status fundiário encontra-se na condição de <strong>{foundProperty.situacao_certificacao}</strong> junto ao Acervo Fundiário do INCRA / SISA, garantindo procedência espacial e ausência de sobreposição substancial com Unidades de Conservação estaduais.
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Summary / Environmental penalty details if negative */}
                  <div className="space-y-3">
                    <h3 className="font-display font-bold text-base text-emerald-400 uppercase border-l-2 border-emerald-500 pl-2">III. Parecer Conclusivo da Fiscalização</h3>
                    
                    {foundProperty.status_ambiental === "Embargado" ? (
                      <div className="p-3 bg-red-950/20 border border-red-950 rounded text-red-150 text-xs space-y-1.5">
                        <p className="font-bold text-red-400 text-sm">⛔ CONSTATAÇÃO DE INFRAÇÃO E EMBARGO FORMAL (Area Embargada)</p>
                        <p className="text-zinc-200">
                          Foi identificado alerta de supressão de vegetação nativa ativa sem Autorização de Supressão de Vegetação (ASV) emitida pelo IMAC. Diante dos fatos, propõe-se o **Embargo Imediato** para uso e exploração agropecuária da área afetada, e lavratura de Auto de Infração conforme o Decreto Federal nº 6.514/2008.
                        </p>
                        {foundProperty.coordenada_embargo && (
                          <div className="bg-zinc-950/50 p-2 border border-red-900/40 rounded font-mono text-[10px] space-y-1">
                            <strong className="text-zinc-400 block">COORDENADA DA ÁREA EMBARGADA:</strong>
                            <span className="text-red-400 block font-bold select-all">
                              Lat: {foundProperty.coordenada_embargo.lat.toFixed(5)} S, Lng: {foundProperty.coordenada_embargo.lng.toFixed(5)} W
                            </span>
                            <span className="text-zinc-400 block">A extensão espacial do dano equivale a ~{foundProperty.coordenada_embargo.area_embargo_ha || 34} hectares mapeados por processamento digital de satélites.</span>
                          </div>
                        )}
                        <p className="font-mono text-[10px] text-zinc-400">Anomalia reportada: {foundProperty.detalhes_deforestacao}</p>
                      </div>
                    ) : foundProperty.status_ambiental === "Sob Análise" ? (
                      <div className="p-3 bg-yellow-950/20 border border-yellow-950 rounded text-yellow-400 text-xs space-y-1.5">
                        <p className="font-bold text-yellow-500 text-sm">⚠️ NECESSIDADE DE VISTORIA COMPLEMENTAR EM CAMPO</p>
                        <p className="text-zinc-200">
                          Detectadas inconformidades cadastrais marginais ou possíveis polígonos sobrepostos na Reserva Extrativista Chico Mendes. Recomenda-se o agendamento de auditoria fiscal in loco para homologação cadastral final do recibo do CAR.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-950 rounded text-emerald-150 text-xs space-y-1.5">
                        <p className="font-bold text-emerald-400 text-sm">✅ ADIMPLEMENTO E CONSIGNAL REGULAR</p>
                        <p className="text-zinc-200">
                          O empreendimento rural atende aos marcos jurídicos de conservação florestal correspondentes. O imóvel rural apresenta conformidade do CAR homologado e georreferenciamento de vértices ativo no SIGEF sem incoerências térmicas ou de desmate recente.
                        </p>
                      </div>
                    )}
                  </div>

                </article>
              ) : (
                <div className="p-12 text-center text-zinc-500">
                  <FileText className="w-16 h-16 mx-auto text-zinc-700 animate-pulse mb-3" />
                  <p>Ainda não há laudo técnico. Selecione uma propriedade georreferenciada no Painel Consolidado para compilar este parecer.</p>
                </div>
              )}
            </div>
          )}

        </main>

      </div>
      
      {/* 4. TECHNICAL FOOTER WARNING BANNER - NO PRINT */}
      <footer className="bg-zinc-950 border-t border-zinc-900 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-[11px] text-zinc-500 font-mono no-print gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-zinc-200 font-bold tracking-wider text-xs">Acre-Geo</span>
          <span className="hidden sm:inline text-zinc-800">|</span>
          <span>Geotecnologia Avançada para Fiscalização</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="flex items-center gap-1.5 bg-zinc-900/50 px-2.5 py-1 rounded border border-zinc-850 text-zinc-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            LGPD Auditoria
          </span>
          <span className="text-[10px] text-emerald-500 font-medium bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/40">MÁSCARA ATIVA</span>
        </div>
      </footer>

    </div>
  );
}
