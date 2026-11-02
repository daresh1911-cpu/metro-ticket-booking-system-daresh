/**
 * MetroX 3D — Futuristic Navigation Bar
 * Follows the 3-zone Top Bar Contract: Brand -> Nav Links -> Primary Action
 */

import React, { useState } from 'react';
import { Train, User, Shield, LogOut, Ticket, Compass, MapPin, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';

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
  stationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenAuth,
  onLogout,
  onBookTickets,
  stationsCount = 50,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleTabClick = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-50 w-full backdrop-blur-md transition-colors ${
      isDark
        ? 'bg-[#050b14]/90 border-b border-slate-800/80 text-slate-100'
        : 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
              isDark ? 'bg-[#050b14]' : 'bg-white'
            }`}>
              <Train className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <span className={`text-lg font-bold font-display tracking-tight flex items-center gap-1 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Metro<span className="text-cyan-500">X</span>
              <span className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded font-mono border ${
                isDark
                  ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60'
                  : 'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}>
                3D
              </span>
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className={`hidden md:flex items-center gap-6 text-sm font-medium ${
          isDark ? 'text-slate-300' : 'text-slate-600'
        }`}>
          <button
            onClick={() => handleTabClick('home')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              isDark ? 'hover:text-white' : 'hover:text-slate-900'
            } ${currentTab === 'home' ? (isDark ? 'text-cyan-400 font-semibold' : 'text-cyan-600 font-bold') : ''}`}
          >
            Home
          </button>
          <button
            onClick={() => handleTabClick('routes')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isDark ? 'hover:text-white' : 'hover:text-slate-900'
            } ${currentTab === 'routes' ? (isDark ? 'text-cyan-400 font-semibold' : 'text-cyan-600 font-bold') : ''}`}
          >
            <Compass className="w-4 h-4 text-cyan-500" /> Route Planner
          </button>
          <button
            onClick={() => handleTabClick('network')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              isDark ? 'hover:text-white' : 'hover:text-slate-900'
            } ${currentTab === 'network' ? (isDark ? 'text-cyan-400 font-semibold' : 'text-cyan-600 font-bold') : ''}`}
          >
            3D Network
          </button>
          <button
            onClick={() => handleTabClick('stations')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isDark ? 'hover:text-white' : 'hover:text-slate-900'
            } ${currentTab === 'stations' ? (isDark ? 'text-cyan-400 font-semibold' : 'text-cyan-600 font-bold') : ''}`}
          >
            <MapPin className="w-4 h-4 text-emerald-500" /> Stations ({stationsCount})
          </button>
          <button
            onClick={() => handleTabClick('verify')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isDark ? 'hover:text-white' : 'hover:text-slate-900'
            } ${currentTab === 'verify' ? (isDark ? 'text-cyan-400 font-semibold' : 'text-cyan-600 font-bold') : ''}`}
          >
            <Ticket className="w-4 h-4 text-amber-500" /> QR Gate Verify
          </button>

          {user && (
            <button
              onClick={() => handleTabClick('bookings')}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                isDark ? 'hover:text-white' : 'hover:text-slate-900'
              } ${currentTab === 'bookings' ? (isDark ? 'text-cyan-400 font-semibold' : 'text-cyan-600 font-bold') : ''}`}
            >
              My Bookings
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => handleTabClick('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                isDark ? 'text-amber-400 hover:text-white' : 'text-amber-700 hover:text-amber-900'
              } ${currentTab === 'admin' ? 'font-bold' : ''}`}
            >
              <Shield className="w-4 h-4" /> Admin DB
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action / Theme / Auth */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all border ${
              isDark
                ? 'bg-slate-900 border-slate-700/80 text-amber-300 hover:bg-slate-800 hover:text-amber-200 hover:border-amber-400/40 shadow-sm'
                : 'bg-slate-100 border-slate-200 text-indigo-700 hover:bg-slate-200 hover:text-indigo-900 shadow-sm'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
            )}
          </button>

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
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                  isDark
                    ? 'bg-slate-900 border-slate-700/70 text-slate-200 hover:border-cyan-500/50'
                    : 'bg-slate-100 border-slate-200 text-slate-800 hover:border-cyan-500'
                }`}
              >
                <User className="w-3.5 h-3.5 text-cyan-500" />
                <span className="font-medium truncate max-w-[110px]">{user.full_name}</span>
                {user.role === 'admin' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1 py-0.2 rounded font-mono">
                    ADMIN
                  </span>
                )}
              </button>
              <button
                onClick={onLogout}
                className={`p-2 rounded-xl transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
                    : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                }`}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                isDark
                  ? 'text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border-slate-700'
                  : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
              }`}
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-xl transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t px-4 pt-3 pb-5 space-y-2 text-sm font-medium shadow-2xl transition-colors ${
          isDark
            ? 'border-slate-800/80 bg-[#050b14]/98 text-slate-100'
            : 'border-slate-200 bg-white/98 text-slate-900'
        }`}>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/50">
            <span className="text-xs font-semibold text-slate-400">Appearance Mode</span>
            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-amber-300'
                  : 'bg-slate-100 border-slate-300 text-indigo-700'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
            </button>
          </div>

          <button
            onClick={() => handleTabClick('home')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentTab === 'home'
                ? (isDark ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'bg-cyan-50 text-cyan-700 font-bold')
                : (isDark ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100')
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleTabClick('routes')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              currentTab === 'routes'
                ? (isDark ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'bg-cyan-50 text-cyan-700 font-bold')
                : (isDark ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100')
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-500" /> Route Planner
          </button>
          <button
            onClick={() => handleTabClick('network')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentTab === 'network'
                ? (isDark ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'bg-cyan-50 text-cyan-700 font-bold')
                : (isDark ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100')
            }`}
          >
            3D Network
          </button>
          <button
            onClick={() => handleTabClick('stations')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              currentTab === 'stations'
                ? (isDark ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'bg-cyan-50 text-cyan-700 font-bold')
                : (isDark ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100')
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-500" /> Stations ({stationsCount} Stations)
          </button>
          <button
            onClick={() => handleTabClick('verify')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              currentTab === 'verify'
                ? (isDark ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'bg-cyan-50 text-cyan-700 font-bold')
                : (isDark ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100')
            }`}
          >
            <Ticket className="w-4 h-4 text-amber-500" /> QR Gate Verify
          </button>

          {user && (
            <button
              onClick={() => handleTabClick('bookings')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentTab === 'bookings'
                  ? (isDark ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'bg-cyan-50 text-cyan-700 font-bold')
                  : (isDark ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100')
              }`}
            >
              My Bookings
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => handleTabClick('admin')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                currentTab === 'admin'
                  ? (isDark ? 'bg-amber-950/80 text-amber-300 font-bold' : 'bg-amber-50 text-amber-800 font-bold')
                  : (isDark ? 'text-amber-400 hover:bg-slate-900' : 'text-amber-700 hover:bg-slate-100')
              }`}
            >
              <Shield className="w-4 h-4 text-amber-500" /> Admin Portal & DB Inspector
            </button>
          )}
        </div>
      )}
    </header>
  );
};
