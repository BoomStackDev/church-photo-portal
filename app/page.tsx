'use client';

import { useState } from 'react';
import Image from 'next/image';
import PinEntry from '@/components/PinEntry';
import UploadForm from '@/components/UploadForm';
import SuccessMessage from '@/components/SuccessMessage';
import ErrorMessage from '@/components/ErrorMessage';

type View = 'pin' | 'upload' | 'success' | 'error';

interface UploadResultState {
  uploadedFiles: string[];
  failedFiles: string[];
}

export default function Home() {
  const [view, setView] = useState<View>('pin');
  const [pin, setPin] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResultState | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  function handlePinSuccess(verifiedPin: string) {
    setPin(verifiedPin);
    setView('upload');
  }

  function handleUploadSuccess(result: UploadResultState) {
    setUploadResult(result);
    setView('success');
  }

  function handleUploadError(message: string) {
    setErrorMessage(message);
    setView('error');
  }

  function handleReset() {
    setUploadResult(null);
    setErrorMessage('');
    setView('upload');
  }

  function handleRetry() {
    setErrorMessage('');
    setView('upload');
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-12 dark:bg-zinc-900">
      <header className="mx-auto mb-10 flex w-full max-w-lg flex-col items-center gap-4 rounded-xl bg-slate-100 p-6">
        <Image
          src="/tpc-logo.png"
          alt="Turning Point Church"
          width={180}
          height={80}
          style={{ objectFit: 'contain' }}
          priority
        />
        <h1 className="text-center text-2xl font-bold text-slate-700 dark:text-white">
          Volunteer Photo & Video Submission
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-col items-center">
        {view === 'pin' && <PinEntry onSuccess={handlePinSuccess} />}
        {view === 'upload' && (
          <UploadForm
            pin={pin}
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
          />
        )}
        {view === 'success' && uploadResult && (
          <SuccessMessage
            uploadedCount={uploadResult.uploadedFiles.length}
            failedCount={uploadResult.failedFiles.length}
            onReset={handleReset}
          />
        )}
        {view === 'error' && (
          <ErrorMessage message={errorMessage} onRetry={handleRetry} />
        )}
      </main>
    </div>
  );
}
