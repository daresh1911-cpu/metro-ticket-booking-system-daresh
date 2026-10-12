/**
 * MetroX 3D — Stations Directory & Network Guide
 * Complete interactive guide for all 41 Chennai Metro Rail stations.
 */

import React, { useState } from 'react';
import { MapPin, Search, ArrowRight, Train, CheckCircle } from 'lucide-react';
import { NetworkStation } from './3d/MetroNetwork3D.js';

interface StationsDirectoryProps {
  stations: NetworkStation[];
  onSelectStationToBook: (stationId: number, role: 'source' | 'destination') => void;
}

export const StationsDirectory: React.FC<StationsDirectoryProps> = ({
  stations,
  onSelectStationToBook,
}) => {
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState<'all' | 'L1' | 'L2' | 'interchange'>('all');

  const filteredStations = stations.filter((st) => {
    const matchesSearch =
      st.station_name.toLowerCase().includes(search.toLowerCase()) ||
      st.station_code.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterLine === 'interchange') return st.is_interchange;
    if (filterLine === 'L1') {
      return st.lines?.some((l) => l.line_code === 'L1');
    }
    if (filterLine === 'L2') {
      return st.lines?.some((l) => l.line_code === 'L2');
    }
    return true;
  });

  const blueLineCount = stations.filter((s) => s.lines?.some((l) => l.line_code === 'L1')).length;
  const greenLineCount = stations.filter((s) => s.lines?.some((l) => l.line_code === 'L2')).length;
  const interchangeCount = stations.filter((s) => s.is_interchange).length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold font-display text-white">
              Chennai Metro Stations Directory
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Explore {stations.length} operational stations across Chennai Metro Rail Limited (CMRL) Blue & Green corridors
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setFilterLine('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterLine === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Stations ({stations.length})
          </button>
          <button
            onClick={() => setFilterLine('L1')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterLine === 'L1'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blue Line ({blueLineCount || 26})
          </button>
          <button
            onClick={() => setFilterLine('L2')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterLine === 'L2'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Green Line ({greenLineCount || 17})
          </button>
          <button
            onClick={() => setFilterLine('interchange')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterLine === 'interchange'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Interchanges ({interchangeCount || 2})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search Chennai metro station by name or code (e.g. Central MAS, Airport MAA, CMBT, Guindy, Vadapalani, Egmore)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Grid of Station Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map((st) => (
          <div
            key={st.station_id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  {st.station_code}
                </span>
                {st.is_interchange ? (
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Interchange Hub
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Operational
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mb-2 leading-snug">{st.station_name}</h3>

              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {st.lines?.map((line) => (
                  <span
                    key={line.line_id}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md text-white font-mono"
                    style={{ backgroundColor: line.line_color }}
                  >
                    {line.line_code} · {line.line_name.includes('Blue') ? 'Blue Line' : 'Green Line'}
                  </span>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                <div>Coords: {st.latitude.toFixed(4)}°N, {st.longitude.toFixed(4)}°E</div>
                <div>City: <span className="text-slate-300 font-semibold">Chennai, Tamil Nadu</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onSelectStationToBook(st.station_id, 'source')}
                className="py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 active:scale-[0.98] border border-emerald-800 text-emerald-300 font-semibold text-xs text-center transition-all flex items-center justify-center gap-1"
              >
                <span>From Here</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectStationToBook(st.station_id, 'destination')}
                className="py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/90 active:scale-[0.98] border border-cyan-800 text-cyan-300 font-semibold text-xs text-center transition-all flex items-center justify-center gap-1"
              >
                <span>To Here</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
