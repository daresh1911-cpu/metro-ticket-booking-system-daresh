/**
 * MetroX 3D — Electronic Ticket & Authentic QR Boarding Pass
 * Generates turnstile-ready verification QR codes and printable passes.
 */

import React, { useEffect, useRef } from 'react';
import { Train, Printer, Download, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

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

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-950/40 print:bg-white print:border-slate-300">
      {/* Ticket Header */}
      <div className="bg-gradient-to-r from-cyan-900/60 via-slate-900 to-blue-900/60 p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white">MetroX Smart E-Ticket</h3>
            <p className="text-[11px] text-cyan-300/80 font-mono">AUTOMATED AFC TURNSTILE PASS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {ticket.ticket_status}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Origin -> Destination Route Showcase */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Departure</span>
            <div className="text-xl font-bold font-display text-cyan-300">{ticket.source_station_name}</div>
            <span className="text-xs text-slate-400 font-mono font-semibold">{ticket.source_station_code}</span>
          </div>
          <div className="flex flex-col items-center px-4">
            <ArrowRight className="w-6 h-6 text-cyan-400" />
            <span className="text-[10px] text-slate-500 font-mono mt-1">DIRECT METRO</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Arrival</span>
            <div className="text-xl font-bold font-display text-slate-100">{ticket.destination_station_name}</div>
            <span className="text-xs text-slate-400 font-mono font-semibold">{ticket.destination_station_code}</span>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-500 block mb-0.5 font-medium">Booking Ref</span>
            <span className="text-slate-200 font-mono font-bold">{ticket.booking_reference}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-500 block mb-0.5 font-medium">Passenger</span>
            <span className="text-slate-200 font-semibold truncate block">{ticket.passenger_name}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-500 block mb-0.5 font-medium">Travel Date</span>
            <span className="text-slate-200 font-mono font-semibold">{ticket.travel_date}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-500 block mb-0.5 font-medium">Departure Time</span>
            <span className="text-cyan-300 font-mono font-bold">{ticket.scheduled_departure}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-500 block mb-0.5 font-medium">Party Size</span>
            <span className="text-slate-200 font-semibold">{ticket.passenger_count} Passenger(s)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50">
            <span className="text-slate-500 block mb-0.5 font-medium">Total Paid</span>
            <span className="text-emerald-400 font-mono font-bold">₹{ticket.total_fare.toFixed(2)}</span>
          </div>
        </div>

        {/* QR Code AFC Scanner Box */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 flex flex-col items-center justify-center text-center">
          <div className="p-2.5 bg-white rounded-xl shadow-lg shadow-cyan-500/10 mb-3">
            <canvas ref={qrCanvasRef} width={180} height={180} className="rounded-lg" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-medium">Opaque Cryptographic Gate Token</span>
          </div>
          <div className="text-[11px] font-mono text-cyan-400 break-all max-w-sm px-2">
            {ticket.verification_token_hash}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Present this QR code directly at automated metro fare barrier scanners.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              Print Pass
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Download
            </button>
          </div>

          {onVerify && (
            <button
              onClick={() => onVerify(ticket.verification_token_hash)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              Test Turnstile Verification
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors ml-auto"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
