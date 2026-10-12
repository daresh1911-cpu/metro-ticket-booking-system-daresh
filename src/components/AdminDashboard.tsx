/**
 * MetroX 3D — Administrative Control Center & MySQL Architecture Inspector
 * Implements role-secured metrics, user governance, live SQL view/procedure audit, and revenue analytics.
 */

import React, { useState, useEffect } from 'react';
import { Shield, Users, Ticket, TrendingUp, RefreshCw, Database, Terminal, Search } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bookings' | 'database'>('overview');
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchBookingQuery, setSearchBookingQuery] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('metrox_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, usersRes, bookRes, dbRes] = await Promise.all([
        fetch('/api/admin/dashboard', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/bookings', { headers }),
        fetch('/api/admin/database-stats', { headers }),
      ]);

      const [dashData, usersData, bookData, dbData] = await Promise.all([
        dashRes.json(),
        usersRes.json(),
        bookRes.json(),
        dbRes.json(),
      ]);

      if (dashData.success) setDashboardData(dashData.data);
      if (usersData.success) setUsers(usersData.data);
      if (bookData.success) setBookings(bookData.data);
      if (dbData.success) setDbStats(dbData.data);
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const toggleUserStatus = async (userId: number, currentStatus: string) => {
    try {
      const token = localStorage.getItem('metrox_token');
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const metrics = dashboardData?.metrics;
  const charts = dashboardData?.charts;
  const popularStations = dashboardData?.popularStations || [];

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  const filteredBookings = bookings.filter(
    (b) =>
      b?.booking_reference?.toLowerCase().includes(searchBookingQuery.toLowerCase()) ||
      b?.passenger_name?.toLowerCase().includes(searchBookingQuery.toLowerCase()) ||
      b?.source_station_name?.toLowerCase().includes(searchBookingQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-display text-white">Administrator Command Console</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ROLE: ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live server-side MySQL queries, revenue analytics, and database schema governance
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Telemetry
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Analytics & Reports
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Passenger Registry ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'bookings' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'database' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          MySQL Database Schema & Stored Procs
        </button>
      </div>

      {/* TAB 1: OVERVIEW & REPORTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Registered Passengers</span>
              <span className="text-2xl font-bold font-mono text-white">{metrics?.totalPassengers || 0}</span>
              <div className="text-[11px] text-slate-500 mt-1">From users table</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total System Bookings</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">{metrics?.totalBookings || 0}</span>
              <div className="text-[11px] text-emerald-400 mt-1">{metrics?.confirmedBookings || 0} Active / Confirmed</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Gross Fare Revenue</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                ₹{(metrics?.grossRevenue || 0).toFixed(2)}
              </span>
              <div className="text-[11px] text-slate-500 mt-1">Aggregated via payments table</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Net Realized Revenue</span>
              <span className="text-2xl font-bold font-mono text-amber-300">
                ₹{(metrics?.netRevenue || 0).toFixed(2)}
              </span>
              <div className="text-[11px] text-rose-400 mt-1">-₹{(metrics?.totalRefunds || 0).toFixed(2)} refunded</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Revenue Summary (from sp_get_daily_revenue) */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Daily Fare Revenue Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">Generated from stored procedure sp_get_daily_revenue</p>
                </div>
              </div>

              <div className="space-y-3">
                {charts?.dailyRevenue?.map((d: any) => {
                  const maxRev = 200;
                  const pct = Math.min(100, Math.max(15, (d.gross_revenue / maxRev) * 100));
                  return (
                    <div key={d.revenue_date} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono text-slate-300">{d.revenue_date}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono">{d.total_transactions} txns</span>
                          <span className="text-emerald-400 font-mono font-bold">₹{d.gross_revenue.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Line Distribution & Station Popularity */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Top Passenger Hubs</h3>
                <p className="text-xs text-slate-400">Derived from view vw_station_popularity</p>
              </div>

              <div className="space-y-2.5">
                {popularStations.map((st: any, idx: number) => (
                  <div
                    key={st.station_id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-mono font-bold flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-200">{st.station_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{st.station_code}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-cyan-400">{st.total_traffic}</span>
                      <span className="text-[10px] text-slate-500 block">Trips</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Registered Passengers Directory</h3>
              <p className="text-xs text-slate-400">Manage user accounts and view booking activity</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 uppercase font-mono text-[10px] text-slate-400">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Bookings</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 font-mono text-slate-500">#{u.user_id}</td>
                    <td className="p-3 font-semibold text-white">{u.full_name}</td>
                    <td className="p-3 font-mono text-slate-400">{u.email}</td>
                    <td className="p-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{u.total_bookings}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.account_status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {u.account_status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleUserStatus(u.user_id, u.account_status)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                        >
                          {u.account_status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Global Booking Records</h3>
              <p className="text-xs text-slate-400">Complete audit trail of all transactions and tickets issued</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search reference, station, passenger..."
                value={searchBookingQuery}
                onChange={(e) => setSearchBookingQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 uppercase font-mono text-[10px] text-slate-400">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Origin → Destination</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Total Fare</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Verification Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBookings.map((b) => (
                  <tr key={b.booking_reference} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">{b.booking_reference}</td>
                    <td className="p-3 font-medium text-white">{b.passenger_name}</td>
                    <td className="p-3">
                      {b.source_station_name} → {b.destination_station_name}
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {b.travel_date} ({b.scheduled_departure})
                    </td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">₹{b.total_fare.toFixed(2)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          b.booking_status === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : b.booking_status === 'completed'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {b.booking_status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[10px] max-w-[140px] truncate">
                      {b.verification_token_hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MYSQL ARCHITECTURE INSPECTOR */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white">Relational Database Engine Topology</h3>
                <p className="text-xs text-slate-400">
                  Target Database: <span className="text-cyan-400 font-mono">metrox_reservation</span> (MySQL 8.0 DDL & Stored Logic)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Database Engine Status
                </div>
                <div className="text-slate-400">
                  Active Provider: <span className="text-emerald-400 font-medium">{dbStats?.engine || 'MySQL 8 (Active)'}</span>
                </div>
                <div className="text-slate-400">
                  Host: <span className="font-mono text-slate-200">{dbStats?.host || 'localhost:3306'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200">Stored Procedures (3 Active)</div>
                <ul className="text-slate-400 font-mono space-y-1 text-[11px]">
                  <li>• sp_calculate_fare</li>
                  <li>• sp_get_booking_details</li>
                  <li>• sp_get_daily_revenue</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200">Database Views (3 Active)</div>
                <ul className="text-slate-400 font-mono space-y-1 text-[11px]">
                  <li>• vw_booking_details</li>
                  <li>• vw_daily_revenue</li>
                  <li>• vw_station_popularity</li>
                </ul>
              </div>
            </div>

            {/* Tables schema inventory */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 font-mono">
                16 Normalized Database Tables (MySQL InnoDB)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {dbStats?.active_tables?.map((table: string) => (
                  <span
                    key={table}
                    className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs"
                  >
                    {table}
                  </span>
                ))}
              </div>
            </div>

            {/* Triggers explanation */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <h4 className="font-bold text-slate-200">MySQL Triggers & Audit Invariants</h4>
              <p className="text-slate-400 text-xs">
                • <strong className="text-cyan-400 font-mono">trg_after_booking_status_change</strong>: Intercepts updates to <code className="text-slate-300">bookings.booking_status</code> and commits an immutable entry into <code className="text-slate-300">booking_status_history</code>.
              </p>
              <p className="text-slate-400 text-xs">
                • <strong className="text-cyan-400 font-mono">trg_after_cancellation_audit</strong>: Triggers on cancellations to write structured audit event logs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
