/**
 * MetroX 3D — Advanced Metro Route Planner
 * Searchable station selector, graph-based route comparisons, interchange alerts, and direct booking integration.
 */

import React, { useState, useEffect } from 'react';
import { Compass, Clock, MapPin, Shuffle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { NetworkStation } from './3d/MetroNetwork3D.js';

export interface RouteOptionData {
  routeId: string;
  routeName: string;
  optimizationType: 'fastest' | 'least_transfers' | 'fewest_stops';
  sourceStation: NetworkStation;
  destinationStation: NetworkStation;
  totalStops: number;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  transferCount: number;
  interchangeStations: NetworkStation[];
  linesUsed: Array<{ line_id: number; line_name: string; line_color: string; line_code: string }>;
  pathStations: NetworkStation[];
  farePerPassenger: number;
  totalFare: number;
  passengerCount: number;
}

interface RoutePlannerProps {
  stations: NetworkStation[];
  onBookRoute: (sourceId: number, destId: number, date: string, route: RouteOptionData) => void;
  onHighlightStationsOn3D?: (stationIds: number[]) => void;
  initialSourceId?: number;
  initialDestId?: number;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  stations,
  onBookRoute,
  onHighlightStationsOn3D,
  initialSourceId,
  initialDestId,
}) => {
  const [sourceId, setSourceId] = useState<number>(initialSourceId || 4);
  const [destId, setDestId] = useState<number>(initialDestId || 16);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [routes, setRoutes] = useState<RouteOptionData[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSourceId) setSourceId(initialSourceId);
    if (initialDestId) setDestId(initialDestId);
  }, [initialSourceId, initialDestId]);

  const handleSwapStations = () => {
    const temp = sourceId;
    setSourceId(destId);
    setDestId(temp);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (sourceId === destId) {
      setError('Origin and destination stations must be distinct');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/routes/search?from=${sourceId}&to=${destId}&passengers=${passengerCount}&date=${travelDate}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to calculate routes');
      }

      setRoutes(data.routes || []);
      if (data.routes?.length > 0) {
        setSelectedRouteId(data.routes[0].routeId);
        onHighlightStationsOn3D?.(data.routes[0].pathStations.map((s: NetworkStation) => s.station_id));
      }
    } catch (err: any) {
      setError(err.message || 'Route planning error');
    } finally {
      setLoading(false);
    }
  };

  // Run initial search
  useEffect(() => {
    if (stations.length > 0 && sourceId && destId && sourceId !== destId) {
      handleSearch();
    }
  }, [stations]);

  const selectRoute = (route: RouteOptionData) => {
    setSelectedRouteId(route.routeId);
    onHighlightStationsOn3D?.(route.pathStations.map((s) => s.station_id));
  };

  const activeRoute = routes.find((r) => r.routeId === selectedRouteId) || routes[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Route Selector Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold font-display text-white">Intelligent Route Planner</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            Dijkstra & BFS Graph Engine
          </span>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            {/* Source */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Origin Station</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-400" />
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(parseInt(e.target.value, 10))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {stations.map((st) => (
                    <option key={st.station_id} value={st.station_id}>
                      {st.station_name} ({st.station_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center md:pb-1">
              <button
                type="button"
                onClick={handleSwapStations}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Swap Stations"
              >
                <Shuffle className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* Destination */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Destination Station</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-rose-400" />
                <select
                  value={destId}
                  onChange={(e) => setDestId(parseInt(e.target.value, 10))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {stations.map((st) => (
                    <option key={st.station_id} value={st.station_id}>
                      {st.station_name} ({st.station_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Travel Date</label>
              <input
                type="date"
                value={travelDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Passenger Count</label>
              <select
                value={passengerCount}
                onChange={(e) => setPassengerCount(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} Passenger{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5"
            >
              {loading ? 'Finding Optimal Paths...' : 'Search Metro Routes'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Route Options Comparison Cards */}
      {routes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-white">Recommended Route Options</h3>
            <span className="text-xs text-slate-400">Click a route to inspect stops & highlight on 3D map</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routes.map((r) => {
              const isSelected = r.routeId === activeRoute?.routeId;
              return (
                <div
                  key={r.routeId}
                  onClick={() => selectRoute(r)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono ${
                        r.optimizationType === 'fastest'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : r.optimizationType === 'least_transfers'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {r.optimizationType.replace('_', ' ')}
                    </span>
                    <span className="text-base font-bold font-mono text-cyan-300">
                      ₹{r.totalFare.toFixed(2)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mb-2 truncate">{r.routeName}</h4>

                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
                    <div>
                      <span className="block text-[11px] text-slate-500">Duration</span>
                      <span className="font-semibold text-slate-200">{r.totalDurationMinutes} min</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">Stops</span>
                      <span className="font-semibold text-slate-200">{r.totalStops}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">Transfers</span>
                      <span className="font-semibold text-slate-200">{r.transferCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {r.linesUsed.map((l) => (
                        <span
                          key={l.line_id}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: l.line_color }}
                          title={l.line_name}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookRoute(sourceId, destId, travelDate, r);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Book Journey
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Route Step-by-Step Breakdown */}
          {activeRoute && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-white">Journey Stop-by-Stop Breakdown</h4>
                  <p className="text-xs text-slate-400">
                    {activeRoute.pathStations.length} station checkpoints · {activeRoute.totalDistanceKm} km total corridor
                  </p>
                </div>
                <button
                  onClick={() => onBookRoute(sourceId, destId, travelDate, activeRoute)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  Book This Journey (₹{activeRoute.totalFare.toFixed(2)}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Station sequence pills */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-500/30">
                {activeRoute.pathStations.map((st, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === activeRoute.pathStations.length - 1;
                  const isInterchange = activeRoute.interchangeStations.some(
                    (ic) => ic.station_id === st.station_id
                  );

                  return (
                    <div key={st.station_id} className="relative flex items-start gap-3">
                      <div
                        className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 ${
                          isFirst
                            ? 'bg-emerald-400 border-emerald-500 ring-4 ring-emerald-500/20'
                            : isLast
                            ? 'bg-rose-400 border-rose-500 ring-4 ring-rose-500/20'
                            : isInterchange
                            ? 'bg-cyan-400 border-cyan-500 ring-4 ring-cyan-500/20'
                            : 'bg-slate-600 border-slate-800'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">{st.station_name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{st.station_code}</span>
                          {isInterchange && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                              TRANSFER STATION
                            </span>
                          )}
                        </div>
                        {isInterchange && (
                          <p className="text-[11px] text-amber-300 mt-0.5">
                            Switch metro lines here (estimated transfer walk: 4 min)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
