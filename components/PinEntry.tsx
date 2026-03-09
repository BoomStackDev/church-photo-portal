'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PinEntryProps {
  onSuccess: (pin: string) => void;
}

export default function PinEntry({ onSuccess }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!pin.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, volunteerName: '', caption: '', files: [] }),
      });
      if (res.status === 401) {
        setError('Incorrect PIN. Please try again.');
      } else {
        onSuccess(pin);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo header */}
      <div className="bg-slate-100 rounded-b-3xl px-6 pt-10 pb-8 flex flex-col items-center">
        <Image src="/tpc-logo.png" alt="TPC Logo" width={180} height={80} className="mb-4" priority />
        <h1 className="text-xl font-bold text-slate-700 text-center">Volunteer Photo & Video Submission</h1>
      </div>

      {/* PIN form */}
      <div className="flex-1 px-6 pt-10">
        <p className="text-slate-600 text-base mb-6 text-center">Enter the upload PIN to continue.</p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter PIN"
          className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 text-2xl text-center tracking-widest focus:outline-none focus:border-slate-400 mb-4"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading || !pin.trim()}
          className="w-full bg-slate-800 text-white text-lg font-semibold py-4 rounded-2xl disabled:opacity-40 active:bg-slate-700 transition-colors"
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>
        <a
          href="/admin"
          className="block w-full border-2 border-slate-200 text-slate-500 text-lg font-semibold py-4 rounded-2xl text-center active:bg-slate-50 transition-colors mt-1"
        >
          Admin
        </a>
      </div>
    </div>
  );
}
