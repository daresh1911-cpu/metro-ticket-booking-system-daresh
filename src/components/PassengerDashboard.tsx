/**
 * MetroX 3D — Passenger Dashboard
 * Displays personalized metrics, journey cards, electronic ticket views, and cancellation/refund processing.
 */

import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, AlertTriangle, ArrowRight, CheckCircle2, XCircle, QrCode } from 'lucide-react';
import { TicketData, TicketView } from './TicketView.js';
import { UserSession } from './Navbar.js';
import { useTheme } from '../context/ThemeContext.js';

interface PassengerDashboardProps {
  user: UserSession;
  onBookNew: () => void;
  onNavigateToVerify?: (token: string) => void;
}

export const PassengerDashboard: React.FC<PassengerDashboardProps> = ({ user, onBookNew, onNavigateToVerify }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Cancellation modal state
  const [cancelBookingRef, setCancelBookingRef] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Personal schedule change');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('metrox_token');
      if (!token) return;

      const res = await fetch('/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching bookings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelBookingRef) return;
    setCancelLoading(true);
    setCancelFeedback(null);

    try {
      const token = localStorage.getItem('metrox_token');
      const res = await fetch(`/api/bookings/${cancelBookingRef}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancellation_reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cancellation failed');
      }

      setCancelFeedback(data.message);
      // Refresh list
      await fetchBookings();
      setTimeout(() => {
        setCancelBookingRef(null);
        setCancelFeedback(null);
      }, 2500);
    } catch (err: any) {
      setCancelFeedback(err.message || 'Failed to cancel journey');
    } finally {
      setCancelLoading(false);
    }
  };

  // Metrics
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b?.booking_status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b?.booking_status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b?.booking_status === 'cancelled').length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Profile Greeting */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border rounded-2xl shadow-xl transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}>
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Welcome back, {user.full_name}
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Account: <span className="text-cyan-500 font-mono font-bold">{user.email}</span> · Smart Transit Commuter
          </p>
        </div>
        <button
          onClick={onBookNew}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          Book New Ticket <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Bookings</span>
          <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCount}</span>
        </div>
        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className="text-xs text-emerald-500 font-semibold block mb-1">Upcoming Active</span>
          <span className="text-2xl font-bold font-mono text-emerald-500">{confirmedCount}</span>
        </div>
        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Completed</span>
          <span className={`text-2xl font-bold font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{completedCount}</span>
        </div>
        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className="text-xs text-rose-500 font-semibold block mb-1">Cancelled</span>
          <span className="text-2xl font-bold font-mono text-rose-500">{cancelledCount}</span>
        </div>
      </div>

      {/* Bookings List */}
      <div className={`border rounded-2xl p-6 shadow-xl space-y-4 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}>
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Your Metro Bookings & E-Tickets
          </h3>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Authenticated via Secure Server Session
          </span>
        </div>

        {loading ? (
          <div className={`py-12 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading your transit tickets...
          </div>
        ) : bookings.length === 0 ? (
          <div className={`py-12 text-center text-xs space-y-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <p>No travel bookings found on your account.</p>
            <button
              onClick={onBookNew}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
            >
              Plan Your First Journey
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const isConfirmed = b.booking_status === 'confirmed';
              return (
                <div
                  key={b.booking_reference}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDark
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-500">
                        {b.booking_reference}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          b.booking_status === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : b.booking_status === 'completed'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}
                      >
                        {b.booking_status}
                      </span>
                    </div>

                    <div className={`text-sm font-bold flex items-center gap-2 ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      <span>{b.source_station_name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.destination_station_name}</span>
                    </div>

                    <div className={`flex flex-wrap items-center gap-3 text-xs pt-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {b.travel_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {b.scheduled_departure}
                      </span>
                      <span>· {b.passenger_count} Passenger(s)</span>
                      <span className="text-emerald-500 font-mono font-semibold">
                        · Total ₹{b.total_fare.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Direct Quick Show QR Code Button */}
                    <button
                      onClick={() => setSelectedTicket(b)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Direct Electronic Turnstile QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Show QR
                    </button>

                    <button
                      onClick={() => setSelectedTicket(b)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                          : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <Ticket className="w-3.5 h-3.5 text-cyan-500" />
                      View Pass
                    </button>

                    {isConfirmed && (
                      <button
                        onClick={() => {
                          setCancelBookingRef(b.booking_reference);
                          setCancelFeedback(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          isDark
                            ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/80 text-rose-300'
                            : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                        }`}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Policy Modal */}
      {cancelBookingRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`relative w-full max-w-md border rounded-2xl p-6 shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Cancel Metro Journey
              </h3>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                Demonstration Cancellation Policy:
              </div>
              <ul className={`list-disc list-inside space-y-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li>&gt; 60 mins before departure: 100% refund of eligible fare</li>
                <li>Between 15 and 60 mins: 50% refund</li>
                <li>&lt; 15 mins before departure: Non-refundable</li>
              </ul>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className={`w-full p-2 border rounded-lg text-xs focus:outline-none focus:border-cyan-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="Personal schedule change">Personal schedule change</option>
                <option value="Alternative route taken">Alternative route taken</option>
                <option value="Weather / Personal contingency">Weather / Personal contingency</option>
              </select>
            </div>

            {cancelFeedback && (
              <div className={`p-3 rounded-lg border text-xs ${
                isDark ? 'bg-slate-950 border-cyan-800 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
              }`}>
                {cancelFeedback}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelBookingRef(null)}
                disabled={cancelLoading}
                className={`w-1/2 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm"
              >
                {cancelLoading ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="my-8 w-full max-w-xl">
            <TicketView
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
              onVerify={(token) => {
                setSelectedTicket(null);
                onNavigateToVerify?.(token);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
