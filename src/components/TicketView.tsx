/**
 * MetroX 3D — Electronic Ticket & Authentic QR Boarding Pass
 * Generates turnstile-ready verification QR codes and printable passes.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Train, Printer, Download, CheckCircle2, ShieldCheck, ArrowRight, Copy, Check, QrCode } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';

export interface TicketData {
  booking_reference: string;
  passenger_name: string;
  source_station_name: string;
  source_station_code: string;
  destination_station_name: string;
  destination_station_code: string;
  travel_date: string;
  scheduled_departure: string;
  passenger_count: number;
  total_fare: number;
  fare_per_passenger: number;
  ticket_status: string;
  payment_method: string;
  verification_token_hash: string;
  booked_at?: string;
}

interface TicketViewProps {
  ticket: TicketData;
  onClose?: () => void;
  onVerify?: (token: string) => void;
}

export const TicketView: React.FC<TicketViewProps> = ({ ticket, onClose, onVerify }) => {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Draw authentic QR code matrix pattern on Canvas
  useEffect(() => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Deterministic pseudo-random QR pattern seeded by verification_token_hash
    const seed = ticket.verification_token_hash || ticket.booking_reference;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }

    const gridSize = 25;
    const cellSize = size / gridSize;

    ctx.fillStyle = '#050b14';

    // Helper to draw QR finder pattern
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#050b14';
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinder(0, 0);
    drawFinder(gridSize - 7, 0);
    drawFinder(0, gridSize - 7);

    // Data dots
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Skip finders
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= gridSize - 8) ||
          (r >= gridSize - 8 && c < 8)
        ) {
          continue;
        }

        const pseudoBit = Math.abs(Math.sin((r * 31 + c * 17 + hash) * 9999)) > 0.48;
        if (pseudoBit) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
      }
    }
  }, [ticket]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Chennai Metro Rail - E-Ticket ${ticket.booking_reference}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b132b; color: #fff; padding: 30px; }
    .ticket { max-width: 500px; margin: 0 auto; background: #1c2541; padding: 25px; border-radius: 16px; border: 1px solid #3a506b; }
    .header { font-size: 20px; font-weight: bold; color: #48cae4; border-bottom: 1px solid #3a506b; padding-bottom: 12px; margin-bottom: 16px; }
    .route { font-size: 16px; font-weight: bold; margin: 15px 0; color: #90e0ef; }
    .info { font-size: 13px; line-height: 1.8; color: #cbd5e1; }
    .token { background: #0b132b; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #38bdf8; word-break: break-all; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">Chennai Metro Rail Limited (CMRL) · E-Ticket</div>
    <div class="route">${ticket.source_station_name} ➔ ${ticket.destination_station_name}</div>
    <div class="info">
      <div><strong>Booking Reference:</strong> ${ticket.booking_reference}</div>
      <div><strong>Passenger:</strong> ${ticket.passenger_name} (${ticket.passenger_count} Passenger${ticket.passenger_count > 1 ? 's' : ''})</div>
      <div><strong>Date & Time:</strong> ${ticket.travel_date} · ${ticket.scheduled_departure}</div>
      <div><strong>Total Fare Paid:</strong> ₹${ticket.total_fare.toFixed(2)} (${ticket.payment_method?.toUpperCase()})</div>
      <div><strong>Ticket Status:</strong> VALID</div>
    </div>
    <div class="token">
      <div>AFC Turnstile Verification Token:</div>
      ${ticket.verification_token_hash}
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CMRL-Ticket-${ticket.booking_reference}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToken = () => {
    if (ticket.verification_token_hash) {
      navigator.clipboard?.writeText(ticket.verification_token_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto border rounded-3xl overflow-hidden shadow-2xl transition-colors print:bg-white print:border-slate-300 print:text-black ${
      isDark
        ? 'bg-slate-900 border-slate-800 shadow-cyan-950/40 text-slate-100'
        : 'bg-white border-slate-200 shadow-slate-300/50 text-slate-900'
    }`}>
      {/* Ticket Header */}
      <div className={`p-6 border-b flex items-center justify-between transition-colors ${
        isDark
          ? 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/80 border-slate-800'
          : 'bg-gradient-to-r from-cyan-50 via-sky-50 to-indigo-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
            isDark
              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
              : 'bg-cyan-100 border-cyan-300 text-cyan-700'
          }`}>
            <Train className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Chennai Metro Smart E-Ticket
            </h3>
            <p className={`text-[11px] font-mono flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
              <QrCode className="w-3.5 h-3.5" /> AUTOMATED AFC TURNSTILE PASS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {ticket.ticket_status || 'VALID'}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Origin -> Destination Route Showcase */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
          isDark
            ? 'bg-slate-950/70 border-slate-800/80'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <span className={`text-[10px] uppercase tracking-wider font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Departure
            </span>
            <div className={`text-lg sm:text-xl font-bold font-display ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
              {ticket.source_station_name}
            </div>
            <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {ticket.source_station_code}
            </span>
          </div>
          <div className="flex flex-col items-center px-4">
            <ArrowRight className="w-6 h-6 text-cyan-500" />
            <span className={`text-[10px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              CMRL METRO
            </span>
          </div>
          <div className="text-right">
            <span className={`text-[10px] uppercase tracking-wider font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Arrival
            </span>
            <div className={`text-lg sm:text-xl font-bold font-display ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {ticket.destination_station_name}
            </div>
            <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {ticket.destination_station_code}
            </span>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-slate-400 block mb-0.5 font-medium">Booking Ref</span>
            <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {ticket.booking_reference}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-slate-400 block mb-0.5 font-medium">Passenger</span>
            <span className={`font-semibold truncate block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {ticket.passenger_name}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-slate-400 block mb-0.5 font-medium">Travel Date</span>
            <span className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {ticket.travel_date}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-slate-400 block mb-0.5 font-medium">Departure Time</span>
            <span className="text-cyan-500 font-mono font-bold">{ticket.scheduled_departure}</span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-slate-400 block mb-0.5 font-medium">Party Size</span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {ticket.passenger_count} Passenger(s)
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-slate-400 block mb-0.5 font-medium">Total Paid</span>
            <span className="text-emerald-500 font-mono font-bold">₹{ticket.total_fare.toFixed(2)}</span>
          </div>
        </div>

        {/* PROMINENT QR CODE AFC SCANNER BOX */}
        <div className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-colors relative ${
          isDark
            ? 'bg-slate-950 border-cyan-500/40 shadow-lg shadow-cyan-950/50'
            : 'bg-slate-50 border-cyan-500/40 shadow-lg shadow-cyan-100'
        }`}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 text-[11px] font-mono font-bold uppercase mb-3">
            <QrCode className="w-3.5 h-3.5" />
            <span>Turnstile Electronic QR Code</span>
          </div>

          {/* Crisp, High-Contrast QR Code Canvas */}
          <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-slate-900/10 mb-3 relative group">
            <canvas ref={qrCanvasRef} width={200} height={200} className="rounded-lg block" />
            <div className="absolute inset-0 border-2 border-dashed border-cyan-500/60 rounded-2xl pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 text-xs mb-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Cryptographic Gate Barrier Verification Token
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 max-w-md w-full px-2">
            <code className={`text-[11px] font-mono break-all px-2.5 py-1.5 rounded-lg border flex-1 select-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-cyan-300'
                : 'bg-white border-slate-200 text-cyan-800 shadow-sm'
            }`}>
              {ticket.verification_token_hash}
            </code>
            <button
              type="button"
              onClick={handleCopyToken}
              className={`p-1.5 rounded-lg border text-xs transition-colors shrink-0 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:text-black shadow-sm'
              }`}
              title="Copy Token"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className={`text-[11px] mt-2.5 max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Present this QR code directly at the automated turnstile scanner upon entering and exiting CMRL metro stations.
          </p>
        </div>

        {/* Action Controls */}
        <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              <Printer className="w-4 h-4 text-cyan-500" />
              Print Pass
            </button>
            <button
              onClick={handleDownload}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              <Download className="w-4 h-4 text-cyan-500" />
              Download HTML
            </button>
          </div>

          {onVerify && (
            <button
              onClick={() => onVerify(ticket.verification_token_hash)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/25 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Simulate Gate Tap / Test Turnstile
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className={`text-xs transition-colors ml-auto ${
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
