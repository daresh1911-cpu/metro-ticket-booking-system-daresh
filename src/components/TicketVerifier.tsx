/**
 * MetroX 3D — AFC Turnstile Ticket Gate Verification Simulator
 * Tests real-time server-side ticket verification tokens.
 */

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, ArrowRight, Scan, Search } from 'lucide-react';

interface TicketVerifierProps {
  initialToken?: string;
}

export const TicketVerifier: React.FC<TicketVerifierProps> = ({ initialToken = '' }) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim(), reference: tokenInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok && !data.data) {
        setError(data.error || data.message || 'Verification failed');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Network error verifying ticket');
    } finally {
      setLoading(false);
    }
  };

  const useSampleToken = (sample: string) => {
    setTokenInput(sample);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-mono mb-3">
          <Scan className="w-3.5 h-3.5" />
          <span>REAL-TIME DATABASE VERIFICATION ENDPOINT</span>
        </div>
        <h2 className="text-2xl font-bold font-display text-white">AFC Turnstile Ticket Scanner</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Simulates smart metro barrier validation. The turnstile sends the opaque QR token to the backend,
          which queries the database to verify ticket authenticity and prevent duplicate entry.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Enter Verification Token or Booking Reference
            </label>
            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. v_tok_94812_8a7df8a6 or MX-2026-94812"
                className="w-full pl-4 pr-12 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? 'Verifying...' : 'Validate'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span>Test Samples:</span>
            <button
              type="button"
              onClick={() => useSampleToken('v_tok_94812_8a7df8a6')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono transition-colors"
            >
              Valid Seed Token (MX-2026-94812)
            </button>
            <button
              type="button"
              onClick={() => useSampleToken('v_tok_77291_77b310aa')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 font-mono transition-colors"
            >
              Cancelled Token (MX-2026-77291)
            </button>
            <button
              type="button"
              onClick={() => useSampleToken('v_tok_invalid_fake_hash')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
            >
              Invalid / Forged Token
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-5 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-3">
            <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <div>
              <div className="font-bold">Turnstile Access Denied</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {result && (
          <div
            className={`mt-5 p-5 rounded-2xl border transition-all ${
              result.valid
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-rose-950/30 border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400" />
                )}
                <div>
                  <h4 className="text-base font-bold text-white">
                    {result.valid ? 'GATE ENTRY GRANTED' : 'GATE ACCESS DENIED'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {result.valid
                      ? 'Ticket authenticated in database. Flap barriers unlocked.'
                      : `Ticket status is '${result.ticket_status}'. Passage refused.`}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                  result.valid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {result.ticket_status || 'INVALID'}
              </span>
            </div>

            {result.passenger_name && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Passenger</span>
                  <span className="text-slate-200 font-semibold">{result.passenger_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Journey</span>
                  <span className="text-slate-200 font-semibold">
                    {result.source_station} → {result.destination_station}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Travel Date</span>
                  <span className="text-slate-200 font-mono">{result.travel_date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Reference</span>
                  <span className="text-cyan-400 font-mono font-bold">{result.booking_reference}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Passengers</span>
                  <span className="text-slate-200">{result.passengers} Passenger(s)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Verified At</span>
                  <span className="text-slate-300 font-mono text-[11px] truncate block">
                    {new Date(result.verified_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
