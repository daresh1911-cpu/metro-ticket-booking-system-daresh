/**
 * MetroX 3D — Futuristic Navigation Bar
 * Follows the 3-zone Top Bar Contract: Brand -> Nav Links -> Primary Action
 */

import React, { useState } from 'react';
import { Train, User, Shield, LogOut, Ticket, Compass, MapPin, Menu, X } from 'lucide-react';

export interface UserSession {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role: 'passenger' | 'admin';
}

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserSession | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onBookTickets?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenAuth,
  onLogout,
  onBookTickets,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#050b14]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-[#050b14] rounded-[10px] flex items-center justify-center">
              <Train className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-1">
              Metro<span className="text-cyan-400">X</span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
                3D
              </span>
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => handleTabClick('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentTab === 'home' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleTabClick('routes')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 ${
              currentTab === 'routes' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-400" /> Route Planner
          </button>
          <button
            onClick={() => handleTabClick('network')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentTab === 'network' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            3D Network
          </button>
          <button
            onClick={() => handleTabClick('stations')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 ${
              currentTab === 'stations' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" /> Stations (41)
          </button>
          <button
            onClick={() => handleTabClick('verify')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 ${
              currentTab === 'verify' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            <Ticket className="w-4 h-4 text-amber-400" /> QR Gate Verify
          </button>

          {user && (
            <button
              onClick={() => handleTabClick('bookings')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
                currentTab === 'bookings' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              My Bookings
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => handleTabClick('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1 ${
                currentTab === 'admin' ? 'text-amber-400 font-semibold' : 'text-amber-400/80'
              }`}
            >
              <Shield className="w-4 h-4" /> Admin DB
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action / Auth */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Direct Book Tickets Button */}
          <button
            onClick={() => {
              if (onBookTickets) onBookTickets();
              else handleTabClick('routes');
            }}
            className="px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-md shadow-cyan-400/25 transition-all whitespace-nowrap active:scale-[0.98] flex items-center gap-1.5"
          >
            <Ticket className="w-3.5 h-3.5 text-slate-950" />
            <span>Book Tickets</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabClick('bookings')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-slate-200 hover:border-cyan-500/50 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium truncate max-w-[110px]">{user.full_name}</span>
                {user.role === 'admin' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono">
                    ADMIN
                  </span>
                )}
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors whitespace-nowrap"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-[#050b14]/98 px-4 pt-3 pb-5 space-y-2 text-sm font-medium shadow-2xl">
          <button
            onClick={() => handleTabClick('home')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentTab === 'home' ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleTabClick('routes')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              currentTab === 'routes' ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-400" /> Route Planner
          </button>
          <button
            onClick={() => handleTabClick('network')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentTab === 'network' ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            3D Network
          </button>
          <button
            onClick={() => handleTabClick('stations')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              currentTab === 'stations' ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" /> Stations (41 Stations)
          </button>
          <button
            onClick={() => handleTabClick('verify')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              currentTab === 'verify' ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4 text-amber-400" /> QR Gate Verify
          </button>

          {user && (
            <button
              onClick={() => handleTabClick('bookings')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentTab === 'bookings' ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              My Bookings
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => handleTabClick('admin')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                currentTab === 'admin' ? 'bg-amber-950/80 text-amber-300 font-bold' : 'text-amber-400/80 hover:bg-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" /> Admin Portal & DB Inspector
            </button>
          )}
        </div>
      )}
    </header>
  );
};
