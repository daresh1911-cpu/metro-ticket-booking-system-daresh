/**
 * MetroX 3D — Futuristic Hero Section
 * Large Hero section with Three.js 3D Train scene, quick search booking widget, and feature spotlights.
 */

import React, { useState } from 'react';
import { HeroMetroScene } from './3d/HeroMetroScene.js';
import { NetworkStation } from './3d/MetroNetwork3D.js';
import { Compass, ArrowRight, ShieldCheck, Zap, Cpu, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  stations: NetworkStation[];
  onBookClick: () => void;
  onExploreNetwork: () => void;
  onQuickSearch: (sourceId: number, destId: number, date: string) => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  stations,
  onBookClick,
  onExploreNetwork,
  onQuickSearch,
  onOpenAuth,
  isLoggedIn,
}) => {
  const [quickSource, setQuickSource] = useState<number>(4); // Puratchi Thalaivar Dr. M.G.R Central
  const [quickDest, setQuickDest] = useState<number>(16); // Chennai International Airport
  const [quickDate, setQuickDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reducedMotion, setReducedMotion] = useState(false);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch(quickSource, quickDest, quickDate);
  };

  return (
    <div className="space-y-12">
      {/* Hero Header & 3D Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Typography & CTAs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CHENNAI METRO (CMRL) SMART 3D TRANSIT</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight leading-tight">
            Chennai Metro.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
              Smart 3D Booking.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Book smart QR tickets, calculate authoritative fares, and navigate all 41 Chennai Metro stations across Blue and Green Lines with real-time 3D pathfinding.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onBookClick}
              className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-400/25 flex items-center gap-2"
            >
              Book Your Journey <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreNetwork}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              Explore Metro Network
            </button>
            {!isLoggedIn && (
              <button
                onClick={onOpenAuth}
                className="px-4 py-3 text-slate-400 hover:text-white font-medium text-sm transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Quick Search Widget */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Quick Express Journey Planner</span>
            </div>

            <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={quickSource}
                onChange={(e) => setQuickSource(parseInt(e.target.value, 10))}
                className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {stations.map((s) => (
                  <option key={s.station_id} value={s.station_id}>
                    From: {s.station_name}
                  </option>
                ))}
              </select>

              <select
                value={quickDest}
                onChange={(e) => setQuickDest(parseInt(e.target.value, 10))}
                className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {stations.map((s) => (
                  <option key={s.station_id} value={s.station_id}>
                    To: {s.station_name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Find Routes
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Three.js 3D Train Visualizer Canvas */}
        <div className="lg:col-span-6 relative">
          <HeroMetroScene reducedMotion={reducedMotion} />
          <div className="absolute bottom-3 right-3 z-10">
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              {reducedMotion ? 'Enable 3D Motion' : 'Reduced Motion'}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Graph-Based Route Optimization</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dijkstra and BFS algorithms calculate fastest travel times, minimum interchanges, and fewest stops across 3 connected lines.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Server-Side Fare Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Authoritative backend fare calculation supporting stop-based and distance-based pricing models with MySQL transaction integrity.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Cryptographic QR E-Tickets</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Opaque gate verification tokens ready for automated AFC barrier turnstiles, PDF export, and cancellation refunds.
          </p>
        </div>
      </div>
    </div>
  );
};
