'use client';

import { useState } from 'react';

interface PinEntryProps {
  onSuccess: (pin: string) => void;
}

export default function PinEntry({ onSuccess }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('pin', pin);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 401) {
        setError('Invalid PIN');
        setLoading(false);
        return;
      }

      // A 400 means PIN was valid but files are missing — that's expected
      onSuccess(pin);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label htmlFor="pin" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Enter PIN to continue
      </label>
      <input
        id="pin"
        type="password"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter PIN"
        className="rounded-lg border border-zinc-300 px-4 py-3 text-center text-lg tracking-widest focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        disabled={loading}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || pin.length === 0}
        className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Submit'}
      </button>
    </form>
  );
}
