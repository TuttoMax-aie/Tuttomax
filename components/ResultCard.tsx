
import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { GpxPoint, GpxStats } from '../App';

interface ResultCardProps {
  url: string;
  summary: string;
  points: GpxPoint[];
  fullTrack: {lat: number, lon: number}[];
  stats?: GpxStats;
  onRemovePoint: (index: number) => void;
}

const getLetter = (index: number): string => {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
};

export const ResultCard: React.FC<ResultCardProps> = ({ points, fullTrack, stats, onRemovePoint }) => {
  const [copied, setCopied] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const currentMapsUrl = useMemo(() => {
    if (points.length === 0) return "";
    const origin = `${points[0].lat},${points[0].lon}`;
    const destination = `${points[points.length - 1].lat},${points[points.length - 1].lon}`;
    const waypoints = points.slice(1, -1)
      .slice(0, 20) 
      .map(p => `${p.lat},${p.lon}`)
      .join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
  }, [points]);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, { 
        scrollWheelZoom: true,
        zoomControl: false,
        dragging: true,
        tap: true
      }).setView([0,0], 2);
      
      mapInstanceRef.current = map;
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && layerGroupRef.current) {
      const map = mapInstanceRef.current;
      const group = layerGroupRef.current;
      group.clearLayers();
      markersRef.current = {};

      const trackLatLngs = fullTrack.map(pt => [pt.lat, pt.lon] as [number, number]);
      if (trackLatLngs.length > 1) {
        L.polyline(trackLatLngs, { color: 'white', weight: 8, opacity: 0.3 }).addTo(group);
        L.polyline(trackLatLngs, { color: '#4285F4', weight: 5, opacity: 1, lineJoin: 'round' }).addTo(group);
      }

      points.forEach((p, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === points.length - 1;
        const letter = getLetter(idx);
        
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="
              background-color: ${isStart ? '#34A853' : (isEnd ? '#EA4335' : '#4285F4')};
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 11px;
              border: 2px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              transform: translate(-50%, -50%);
            ">
              ${letter}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [0, 0]
        });

        const marker = L.marker([p.lat, p.lon], { icon: customIcon })
          .addTo(group)
          .bindPopup(`
            <div style="font-family: sans-serif; padding: 5px;">
              <strong style="display:block; color: #4285F4; margin-bottom: 2px;">Punto ${letter}</strong>
              <span style="font-size: 12px; color: #333;">${p.name || 'Tappa senza nome'}</span>
            </div>
          `);
        
        markersRef.current[`point-${idx}`] = marker;
      });

      const boundsSource = trackLatLngs.length > 0 ? trackLatLngs : points.map(p => [p.lat, p.lon] as [number, number]);
      if (boundsSource.length > 0) {
        map.fitBounds(L.latLngBounds(boundsSource), { padding: [50, 50] });
      }
    }
  }, [points, fullTrack]);

  const handlePointClick = (idx: number) => {
    const p = points[idx];
    const map = mapInstanceRef.current;
    const marker = markersRef.current[`point-${idx}`];
    
    if (map && marker) {
      map.setView([p.lat, p.lon], 15, { animate: true, duration: 0.5 });
      marker.openPopup();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMapsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    const mailtoUrl = `mailto:?subject=Percorso GPX&body=${encodeURIComponent(currentMapsUrl)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="space-y-6 android-slide-up">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Distanza</p>
            <p className="text-xl font-black">{stats?.distance.toFixed(1)} km</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-[2rem] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tempo</p>
            <p className="text-xl font-black">{stats?.estimatedTime}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={handleCopy} className={`flex flex-col items-center justify-center gap-2 py-5 rounded-[2rem] border transition-all active:scale-95 ${copied ? 'bg-green-600 border-green-500' : 'bg-slate-900 border-white/10'}`}>
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter text-white">{copied ? 'COPIATO' : 'COPIA URL'}</span>
        </button>
        <button onClick={handleSend} className="flex flex-col items-center justify-center gap-2 py-5 bg-slate-900 border border-white/10 rounded-[2rem] active:scale-95 transition-all">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter text-white">INVIA</span>
        </button>
        <button onClick={() => window.open(currentMapsUrl, '_blank')} className="flex flex-col items-center justify-center gap-2 py-5 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          <span className="text-[9px] font-black text-white uppercase tracking-tighter">MAPS</span>
        </button>
      </div>

      <div className="h-[350px] rounded-[3rem] overflow-hidden border border-white/20 shadow-2xl relative z-0">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      <div className="bg-slate-900/40 rounded-[2.5rem] border-2 border-white/20 overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-white/10 flex justify-between items-center bg-slate-950/70">
          <h3 className="text-sm font-black text-blue-400 italic uppercase tracking-wider">Tappe del viaggio</h3>
          <span className="bg-blue-600 text-[10px] px-3 py-1 rounded-full font-black text-white">{points.length} PUNTI</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
          {points.map((p, idx) => (
            <div 
              key={`${idx}-${p.lat}`} 
              onClick={() => handlePointClick(idx)}
              className="group flex items-center p-5 gap-4 border-b border-white/10 last:border-0 hover:bg-white/10 active:bg-blue-500/20 transition-all cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black text-white border border-white/20 transition-transform group-active:scale-90 ${idx === 0 ? 'bg-green-500' : (idx === points.length - 1 ? 'bg-red-500' : 'bg-blue-600')}`}>
                {getLetter(idx)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate uppercase tracking-tight text-slate-100 group-hover:text-blue-400 transition-colors">
                    {p.name || `Tappa ${getLetter(idx)}`}
                  </p>
                </div>
                <p className="text-[9px] text-slate-500 font-mono tracking-widest">{p.lat.toFixed(5)}, {p.lon.toFixed(5)}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePoint(idx);
                }} 
                className="p-3 text-slate-600 hover:text-red-500 active:scale-75 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
