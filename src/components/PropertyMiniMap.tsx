import React, { useEffect, useRef } from "react";
import { ImovelAcre } from "../db/imoveis";

interface PropertyMiniMapProps {
  property: ImovelAcre;
  insertedLatLng: { lat: number; lng: number };
}

export const PropertyMiniMap: React.FC<PropertyMiniMapProps> = ({ property, insertedLatLng }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([property.centro_lat, property.centro_lng], 13);

      L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}").addTo(initMap);
      
      L.control.zoom({ position: "bottomright" }).addTo(initMap);
      mapInstanceRef.current = initMap;
    }

    const map = mapInstanceRef.current;

    // Clear previous layers
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    const bounds: any[] = [];

    // 1. Draw property polygon limits
    if (property.verset_limite && property.verset_limite.length > 0) {
      const polygonCoords = property.verset_limite.map(v => {
        const point = [v.latitude, v.longitude];
        bounds.push(point);
        return point;
      });

      polygonLayerRef.current = L.polygon(polygonCoords, {
        color: "#10b981", // emerald
        fillColor: "#10b981",
        fillOpacity: 0.15,
        weight: 2
      }).addTo(map);

      polygonLayerRef.current.bindPopup(`<div class="text-[10px] text-zinc-950 p-1 font-mono">
        <strong class="font-bold block">${property.nome}</strong>
        Área: ${property.area_ha} ha
      </div>`);
    }

    // 2. Plot user inserted coordinate
    const userPos: [number, number] = [insertedLatLng.lat, insertedLatLng.lng];
    bounds.push(userPos);

    const userPulseIcon = L.divIcon({
      className: 'mini-map-pulse-marker',
      html: `<div class="relative flex items-center justify-center">
               <div class="absolute w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow"></div>
               <div class="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-500 opacity-75"></div>
             </div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    userMarkerRef.current = L.marker(userPos, { icon: userPulseIcon })
      .addTo(map)
      .bindPopup(`<div class="text-[10px] text-zinc-950 p-1 font-mono">
        <strong>Seu Ponto de Consulta</strong><br/>
        Lat: ${insertedLatLng.lat.toFixed(5)}<br/>
        Lng: ${insertedLatLng.lng.toFixed(5)}
      </div>`);

    // 3. Zoom map to fit both the property boundary and user coordinate
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [15, 15], maxZoom: 15 });
    } else {
      map.setView(userPos, 14);
    }

    // Force layout update after a tiny delay to ensure proper dimensions
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

  }, [property, insertedLatLng]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-2 mt-3 p-3 bg-zinc-900 border border-zinc-850 rounded-lg no-print">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
          Relação de Localização (Seu Ponto vs. Limites)
        </span>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/45 border border-emerald-900/40 px-2 py-0.5 rounded font-bold">
          SATELLITE HYBRID
        </span>
      </div>
      
      <div 
        ref={mapContainerRef} 
        className="w-full h-[180px] rounded border border-zinc-800 bg-zinc-950 overflow-hidden relative z-0"
      />
      
      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500 block"></span>
          Limites da Área (SIGEF/CAR)
        </span>
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 block animate-pulse"></span>
          Coordenada Consultada
        </span>
      </div>
    </div>
  );
};
