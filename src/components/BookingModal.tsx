/**
 * MetroX 3D — Multi-Step Ticket Booking & Payment Flow
 * Strict server-side fare calculation, transaction consistency, and seamless checkout.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building,
  AlertCircle,
  User,
  Sparkles,
  CheckCircle2,
  Lock,
  Calendar,
  Clock,
  Shuffle,
  ShieldCheck,
  QrCode,
  Check
} from 'lucide-react';
import { NetworkStation } from './3d/MetroNetwork3D.js';
import { TicketData, TicketView } from './TicketView.js';
import { UserSession } from './Navbar.js';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: NetworkStation[];
  initialSourceId?: number;
  initialDestId?: number;
  initialDate?: string;
  currentUser?: UserSession | null;
  onBookingSuccess?: (ticket: TicketData) => void;
  onUserLogin?: (user: UserSession) => void;
  onNavigateToVerify?: (token: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  stations,
  initialSourceId,
  initialDestId,
  initialDate,
  currentUser,
  onBookingSuccess,
  onUserLogin,
  onNavigateToVerify,
}) => {
  // 1: Configure Journey, 2: Payment & Passenger Info, 3: Confirmed Boarding Pass
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sourceId, setSourceId] = useState<number>(initialSourceId || 4); // Default to Central Metro
  const [destId, setDestId] = useState<number>(initialDestId || 16); // Default to Airport Metro
  const [travelDate, setTravelDate] = useState(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [scheduleId, setScheduleId] = useState<number>(2);
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [pricingMethod, setPricingMethod] = useState<'stop_based' | 'distance_based'>('stop_based');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'net_banking'>('upi');

  // Passenger details
  const [passengerName, setPassengerName] = useState(currentUser?.full_name || 'Aarav Sharma');
  const [passengerEmail, setPassengerEmail] = useState(
    currentUser?.email || 'passenger@metrox.internal'
  );
  const [passengerPhone, setPassengerPhone] = useState(
    currentUser?.phone || '+91 91234 56789'
  );

  // Simulated Payment Inputs
  const [upiId, setUpiId] = useState('aarav@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('742');
  const [selectedBank, setSelectedBank] = useState('State Bank of India');

  // Server-computed fare state
  const [fareData, setFareData] = useState<{
    fare_per_passenger: number;
    total_fare: number;
    stops: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState('Connecting to Payment Gateway...');
  const [error, setError] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<TicketData | null>(null);

  // Reset and synchronize when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setLoading(false);
      setPaymentProcessing(false);
      setConfirmedTicket(null);

      // Preselect default stations if none or same
      if (initialSourceId && initialDestId && initialSourceId !== initialDestId) {
        setSourceId(initialSourceId);
        setDestId(initialDestId);
      } else if (stations.length >= 2) {
        // Puratchi Thalaivar Dr. M.G.R Central (MAS) and Chennai Airport (MAA)
        const central = stations.find((s) => s.station_code === 'MAS') || stations[3] || stations[0];
        const airport = stations.find((s) => s.station_code === 'MAA') || stations[15] || stations[1];
        setSourceId(central.station_id);
        setDestId(airport.station_id);
      }

      if (initialDate) setTravelDate(initialDate);

      if (currentUser) {
        setPassengerName(currentUser.full_name);
        setPassengerEmail(currentUser.email);
        setPassengerPhone(currentUser.phone);
      } else {
        setPassengerName('Aarav Sharma');
        setPassengerEmail('passenger@metrox.internal');
        setPassengerPhone('+91 91234 56789');
      }
    }
  }, [isOpen, initialSourceId, initialDestId, initialDate, currentUser, stations]);

  // Recalculate authoritative server fare whenever endpoints or passenger count changes
  useEffect(() => {
    if (sourceId && destId && sourceId !== destId) {
      fetchFare();
    }
  }, [sourceId, destId, passengerCount, pricingMethod]);

  const fetchFare = async () => {
    try {
      const res = await fetch('/api/fares/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          destination_id: destId,
          passenger_count: passengerCount,
          pricing_method: pricingMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFareData(data.data);
      }
    } catch (e) {
      console.error('Failed to compute fare', e);
    }
  };

  if (!isOpen) return null;

  const handleSwapStations = () => {
    const temp = sourceId;
    setSourceId(destId);
    setDestId(temp);
  };

  const handleProceedToPaymentStep = () => {
    setError(null);
    if (sourceId === destId) {
      setError('Origin and destination stations cannot be identical.');
      return;
    }
    setStep(2);
  };

  const prefillDemoPassenger = () => {
    setPassengerName('Aarav Sharma');
    setPassengerEmail('passenger@metrox.internal');
    setPassengerPhone('+91 91234 56789');
  };

  const handleConfirmAndPay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Validate passenger fields
    if (!passengerName.trim()) {
      setError('Please provide passenger full name');
      return;
    }
    if (!passengerEmail.trim() || !passengerEmail.includes('@')) {
      setError('Please provide a valid commuter email address');
      return;
    }

    setLoading(true);
    setPaymentProcessing(true);
    setPaymentStepText('Connecting to Secure Payment Gateway...');

    try {
      // Simulate authentic payment authorization milestones
      await new Promise((r) => setTimeout(r, 600));
      setPaymentStepText(
        paymentMethod === 'upi'
          ? 'Authorizing ₹' + (fareData?.total_fare || 35).toFixed(2) + ' via NPCI UPI...'
          : paymentMethod === 'card'
          ? 'Verifying Card Security & 3D Secure OTP...'
          : 'Connecting to Bank Net Banking Gateway...'
      );
      await new Promise((r) => setTimeout(r, 700));
      setPaymentStepText('Payment Approved! Generating E-Ticket & QR Token...');
      await new Promise((r) => setTimeout(r, 400));

      const token = localStorage.getItem('metrox_token');
      const idempotencyKey = `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_station_id: sourceId,
          destination_station_id: destId,
          schedule_id: scheduleId,
          travel_date: travelDate,
          passenger_count: passengerCount,
          pricing_method: pricingMethod,
          payment_method: paymentMethod,
          idempotency_key: idempotencyKey,
          passenger_name: passengerName.trim(),
          passenger_email: passengerEmail.trim(),
          passenger_phone: passengerPhone.trim() || '+91 91234 56789',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Booking transaction failed');
      }

      // If user session token returned, save and authenticate user seamlessly
      if (data.token) {
        localStorage.setItem('metrox_token', data.token);
      }
      if (data.user) {
        onUserLogin?.(data.user);
      }

      setConfirmedTicket(data.data);
      setStep(3);
      onBookingSuccess?.(data.data);
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed. Please try again.');
      setStep(2);
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  const sourceStation = stations.find((s) => s.station_id === sourceId);
  const destStation = stations.find((s) => s.station_id === destId);
  const totalAmount = fareData?.total_fare || (passengerCount * 25);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={paymentProcessing}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors p-1 rounded-lg hover:bg-slate-800"
          aria-label="Close booking modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1 & 2: Booking Form */}
        {step < 3 ? (
          <div>
            {/* Step Indicator Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                <span className={step === 1 ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                  1. Journey & Passengers
                </span>
                <span className={step === 2 ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                  2. Payment & Confirmation
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 2) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Route, Date, Passengers & Policy */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold font-display text-white">
                    Select Chennai Metro Journey
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                    CMRL Network
                  </span>
                </div>

                {/* Stations Selection with Swap */}
                <div className="grid grid-cols-1 sm:grid-cols-9 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Origin Station
                    </label>
                    <select
                      value={sourceId}
                      onChange={(e) => setSourceId(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      {stations.map((s) => (
                        <option key={s.station_id} value={s.station_id}>
                          {s.station_name} ({s.station_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1 flex justify-center pt-5 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleSwapStations}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                      title="Swap Origin and Destination"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Destination Station
                    </label>
                    <select
                      value={destId}
                      onChange={(e) => setDestId(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      {stations.map((s) => (
                        <option key={s.station_id} value={s.station_id}>
                          {s.station_name} ({s.station_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Travel Date & Cadence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Travel Date
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Departure Cadence
                    </label>
                    <select
                      value={scheduleId}
                      onChange={(e) => setScheduleId(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value={1}>05:30 AM (Early Express)</option>
                      <option value={2}>07:15 AM (Peak Morning Rapid)</option>
                      <option value={3}>08:45 AM (Standard Transit)</option>
                      <option value={5}>06:00 PM (Evening Commute)</option>
                      <option value={8}>08:15 PM (Night Transit)</option>
                    </select>
                  </div>
                </div>

                {/* Passenger Count Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Passenger Count
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setPassengerCount(count)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          passengerCount === count
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {count} {count === 1 ? 'Pass' : 'Pass.'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fare Model Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fare Calculation Policy
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPricingMethod('stop_based')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                        pricingMethod === 'stop_based'
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>Stop-Based Model</span>
                        {pricingMethod === 'stop_based' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">₹10 base + ₹5 per 2 stops</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMethod('distance_based')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                        pricingMethod === 'distance_based'
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>Distance-Based</span>
                        {pricingMethod === 'distance_based' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">₹10 base + ₹3.00/km</div>
                    </button>
                  </div>
                </div>

                {/* Live Fare Breakdown Card */}
                {fareData && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Transit Stops:</span>{' '}
                      <span className="text-slate-200 font-semibold">{fareData.stops} Stations</span>
                      <span className="text-slate-500 block text-[11px]">
                        ₹{fareData.fare_per_passenger.toFixed(2)} × {passengerCount} passenger{passengerCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] block">Authoritative Total Fare:</span>
                      <span className="text-cyan-400 font-bold font-mono text-base">
                        ₹{fareData.total_fare.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Primary Action Button: Proceed to Payment */}
                <button
                  type="button"
                  onClick={handleProceedToPaymentStep}
                  className="w-full mt-2 py-3 bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
                >
                  <span>Proceed to Payment (₹{totalAmount.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Passenger Details & Interactive Payment Gateway */}
            {step === 2 && (
              <form onSubmit={handleConfirmAndPay} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold font-display text-white">
                    Checkout & Payment Gateway
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    256-BIT SSL SECURE
                  </span>
                </div>

                {/* Journey Summary Badge */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[11px] text-slate-400">Selected Route:</div>
                    <div className="font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <span>{sourceStation?.station_name || 'Origin'}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span>{destStation?.station_name || 'Destination'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {travelDate} · {passengerCount} Passenger{passengerCount > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-mono text-slate-500">Amount Due</div>
                    <div className="text-lg font-bold font-mono text-cyan-400">
                      ₹{totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Commuter Information */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      Commuter Information
                    </span>
                    <button
                      type="button"
                      onClick={prefillDemoPassenger}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Prefill Commuter
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        placeholder="Aarav Sharma"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={passengerEmail}
                        onChange={(e) => setPassengerEmail(e.target.value)}
                        placeholder="passenger@metrox.internal"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Mobile Number</label>
                    <input
                      type="text"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      placeholder="+91 91234 56789"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Select Payment Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl border text-center text-xs transition-colors flex flex-col items-center gap-1 ${
                        paymentMethod === 'upi'
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold">UPI / QR</span>
                      <span className="text-[10px] text-slate-500">GPay, PhonePe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-center text-xs transition-colors flex flex-col items-center gap-1 ${
                        paymentMethod === 'card'
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold">Debit/Card</span>
                      <span className="text-[10px] text-slate-500">RuPay, Visa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('net_banking')}
                      className={`p-2.5 rounded-xl border text-center text-xs transition-colors flex flex-col items-center gap-1 ${
                        paymentMethod === 'net_banking'
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Building className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold">Net Banking</span>
                      <span className="text-[10px] text-slate-500">SBI, HDFC</span>
                    </button>
                  </div>
                </div>

                {/* Method Specific Interactive Inputs */}
                {paymentMethod === 'upi' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <label className="block text-[11px] text-slate-400">Virtual Payment Address (VPA / UPI ID)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <span className="px-2 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg text-[10px] font-mono flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> QR Ready
                      </span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          maxLength={3}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'net_banking' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <label className="block text-[11px] text-slate-400">Select Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Indian Bank">Indian Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                    </select>
                  </div>
                )}

                {/* Back and Confirm Payment Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pay ₹{totalAmount.toFixed(2)} & Issue Ticket</span>
                  </button>
                </div>
              </form>
            )}

            {/* Simulated Payment Gateway Progress Overlay */}
            {paymentProcessing && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
                <div className="w-14 h-14 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white font-display">
                    Processing Payment Transaction
                  </h4>
                  <p className="text-xs text-cyan-300 font-mono">{paymentStepText}</p>
                </div>
                <div className="text-[11px] text-slate-500 max-w-xs">
                  Communicating securely with the Chennai Metro Reservation Engine & Bank Gateway.
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STEP 3: Confirmed Boarding Pass View */
          <div>
            {confirmedTicket && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-sm text-white">Payment Confirmed & Ticket Issued</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                    STATUS: VALID
                  </span>
                </div>

                <TicketView
                  ticket={confirmedTicket}
                  onClose={onClose}
                  onVerify={(token) => {
                    onClose();
                    onNavigateToVerify?.(token);
                  }}
                />

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setConfirmedTicket(null);
                    }}
                    className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                  >
                    Book Another Journey
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
