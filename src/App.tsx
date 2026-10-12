/**
 * MetroX 3D — Advanced Smart Metro Reservation & Management System
 * Root Application Component
 */

import React, { useState, useEffect } from 'react';
import { Navbar, UserSession } from './components/Navbar.js';
import { HeroSection } from './components/HeroSection.js';
import { RoutePlanner, RouteOptionData } from './components/RoutePlanner.js';
import { MetroNetwork3D, NetworkStation, NetworkConnection } from './components/3d/MetroNetwork3D.js';
import { StationsDirectory } from './components/StationsDirectory.js';
import { PassengerDashboard } from './components/PassengerDashboard.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { TicketVerifier } from './components/TicketVerifier.js';
import { AuthModal } from './components/AuthModal.js';
import { BookingModal } from './components/BookingModal.js';
import { TicketData } from './components/TicketView.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [user, setUser] = useState<UserSession | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Network State
  const [stations, setStations] = useState<NetworkStation[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [highlight3DStationIds, setHighlight3DStationIds] = useState<number[]>([]);

  // Selected Booking Params (Default to Central Metro 4 and Airport Metro 16)
  const [selectedSourceId, setSelectedSourceId] = useState<number>(4);
  const [selectedDestId, setSelectedDestId] = useState<number>(16);
  const [selectedTravelDate, setSelectedTravelDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Verification token testing
  const [verifyToken, setVerifyToken] = useState<string>('');

  // 1. Fetch Session on Mount
  useEffect(() => {
    const token = localStorage.getItem('metrox_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('metrox_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('metrox_token');
        });
    }
  }, []);

  // 2. Fetch Network Topology
  useEffect(() => {
    fetch('/api/routes/network')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStations(data.data.stations || []);
          setConnections(data.data.connections || []);
        }
      })
      .catch((err) => console.error('Failed to load metro network', err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('metrox_token');
    setUser(null);
    setCurrentTab('home');
  };

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: UserSession) => {
    setUser(authenticatedUser);
  };

  // Quick route plan trigger from hero
  const handleQuickSearch = (sourceId: number, destId: number, date: string) => {
    setSelectedSourceId(sourceId);
    setSelectedDestId(destId);
    setSelectedTravelDate(date);
    setCurrentTab('routes');
  };

  // Launch booking modal with selected route
  const handleBookRoute = (sourceId: number, destId: number, date: string, _route: RouteOptionData) => {
    setSelectedSourceId(sourceId);
    setSelectedDestId(destId);
    setSelectedTravelDate(date);
    setBookingModalOpen(true);
  };

  // Handle station selection from 3D Network or directory
  const handleStationSelection = (station: NetworkStation, type: 'source' | 'destination') => {
    if (type === 'source') {
      setSelectedSourceId(station.station_id);
    } else {
      setSelectedDestId(station.station_id);
    }
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onOpenAuth={openAuth}
        onLogout={handleLogout}
        onBookTickets={() => setBookingModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {currentTab === 'home' && (
          <HeroSection
            stations={stations}
            onBookClick={() => setBookingModalOpen(true)}
            onExploreNetwork={() => setCurrentTab('network')}
            onQuickSearch={handleQuickSearch}
            onOpenAuth={() => openAuth('login')}
            isLoggedIn={Boolean(user)}
          />
        )}

        {currentTab === 'routes' && (
          <RoutePlanner
            stations={stations}
            initialSourceId={selectedSourceId}
            initialDestId={selectedDestId}
            onBookRoute={handleBookRoute}
            onHighlightStationsOn3D={(ids) => setHighlight3DStationIds(ids)}
          />
        )}

        {currentTab === 'network' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Interactive 3D Metro Network</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Spatial visualization of 41 Chennai Metro stations across Blue & Green lines with live interchange hubs.
                </p>
              </div>
              <button
                onClick={() => setBookingModalOpen(true)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
              >
                Book Selected Route
              </button>
            </div>

            <MetroNetwork3D
              stations={stations}
              connections={connections}
              highlightStationIds={highlight3DStationIds}
              selectedSourceId={selectedSourceId}
              selectedDestId={selectedDestId}
              onSelectStation={handleStationSelection}
            />
          </div>
        )}

        {currentTab === 'stations' && (
          <StationsDirectory
            stations={stations}
            onSelectStationToBook={(stId, role) => {
              if (role === 'source') setSelectedSourceId(stId);
              else setSelectedDestId(stId);
              setBookingModalOpen(true);
            }}
          />
        )}

        {currentTab === 'verify' && (
          <TicketVerifier initialToken={verifyToken} />
        )}

        {currentTab === 'bookings' && user && (
          <PassengerDashboard
            user={user}
            onBookNew={() => setBookingModalOpen(true)}
          />
        )}

        {currentTab === 'admin' && user?.role === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">MetroX 3D</span>
            <span className="text-slate-600">·</span>
            <span>Chennai Metro Rail Limited (CMRL) Reservation & Management System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>MySQL 8 InnoDB</span>
            <span>·</span>
            <span>Three.js WebGL</span>
            <span>·</span>
            <span>JWT & bcrypt Auth</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        stations={stations}
        initialSourceId={selectedSourceId}
        initialDestId={selectedDestId}
        initialDate={selectedTravelDate}
        currentUser={user}
        onUserLogin={(u) => setUser(u)}
        onNavigateToVerify={(token) => {
          setVerifyToken(token);
          setCurrentTab('verify');
        }}
        onBookingSuccess={(_ticket: TicketData) => {
          // If on passenger tab, refresh can occur
        }}
      />
    </div>
  );
}
