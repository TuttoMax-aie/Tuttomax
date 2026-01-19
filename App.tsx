
import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { ResultCard } from './components/ResultCard';

export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number | null;
  name: string | null;
  description: string | null;
  type?: 'ViaPoint' | 'ShapingPoint';
}

export interface GpxStats {
  distance: number;
  estimatedTime: string;
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpxData, setGpxData] = useState<{ displayPoints: GpxPoint[]; fullTrack: {lat: number, lon: number}[] } | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const derivedResult = useMemo(() => {
    if (!gpxData) return null;
    const { displayPoints, fullTrack } = gpxData;
    
    let totalDist = 0;
    const distSource = fullTrack.length > 0 ? fullTrack : displayPoints;
    for (let i = 1; i < distSource.length; i++) {
      totalDist += calculateDistance(distSource[i-1].lat, distSource[i-1].lon, distSource[i].lat, distSource[i].lon);
    }
    
    const totalMinutes = (totalDist / 50) * 60;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    
    return { 
      stats: { distance: totalDist, estimatedTime: `${h}h ${m}m` }, 
      displayPoints, 
      fullTrack 
    };
  }, [gpxData]);

  const handleRemovePoint = (index: number) => {
    if (!gpxData) return;
    const newPoints = [...gpxData.displayPoints];
    newPoints.splice(index, 1);
    setGpxData({ ...gpxData, displayPoints: newPoints });
  };

  const parseGpxText = (text: string) => {
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(text, "text/xml");
    
    if (gpxDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Il file non è un file GPX valido.");
    }

    const trkptNodes = Array.from(gpxDoc.querySelectorAll("trkpt"));
    const fullTrack = trkptNodes.map(pt => ({
      lat: parseFloat(pt.getAttribute("lat") || "0"),
      lon: parseFloat(pt.getAttribute("lon") || "0")
    }));

    // Cerca Waypoints o punti rotta
    const pointNodes = Array.from(gpxDoc.querySelectorAll("wpt, rtept"));
    
    let displayPoints: GpxPoint[] = [];

    if (pointNodes.length > 0) {
      displayPoints = pointNodes.map(node => ({
        lat: parseFloat(node.getAttribute("lat") || "0"),
        lon: parseFloat(node.getAttribute("lon") || "0"),
        ele: null,
        name: node.querySelector("name")?.textContent?.trim() || "Tappa",
        description: null
      }));
    } else if (fullTrack.length > 0) {
      // Prendi campioni ogni 5km circa o almeno inizio e fine
      displayPoints = [
        { ...fullTrack[0], ele: null, name: "Partenza", description: null },
        { ...fullTrack[fullTrack.length - 1], ele: null, name: "Arrivo", description: null }
      ];
    }

    if (displayPoints.length === 0) {
      throw new Error("Nessun punto geografico trovato nel file.");
    }

    return { displayPoints, fullTrack };
  };

  const processGpxFile = async (file: File) => {
    setLoading(true); 
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseGpxText(text);
      setGpxData(parsed);
    } catch (err: any) { 
      setError(err.message || "Errore nella lettura del file."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] font-sans safe-area-inset relative">
      <Header />
      
      {gpxData && (
        <button 
          onClick={() => setGpxData(null)} 
          className="fixed top-3 right-4 w-10 h-10 bg-slate-800 text-white rounded-xl shadow-lg flex items-center justify-center border border-white/10 active:scale-90 transition-all z-[60]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      )}

      <main className="flex-grow p-4 max-w-2xl mx-auto w-full pb-10">
        {!gpxData && !loading && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <FileUploader onFileSelect={processGpxFile} isLoading={loading} />
          </div>
        )}
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
            <p className="text-blue-500 font-black uppercase text-xs tracking-[0.3em]">Analisi File...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2.5rem] text-red-400 text-center font-bold text-[10px] uppercase tracking-widest mb-4">
            {error}
          </div>
        )}
        
        {gpxData && derivedResult && (
          <ResultCard 
            url="" 
            stats={derivedResult.stats} 
            points={gpxData.displayPoints} 
            fullTrack={gpxData.fullTrack} 
            onRemovePoint={handleRemovePoint} 
            summary="" 
          />
        )}
      </main>
    </div>
  );
};

export default App;
