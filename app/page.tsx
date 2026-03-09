'use client';

import { useState } from 'react';
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
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-900">
      <header className="mb-10">
        <h1 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">
          Volunteer Photo Submission
        </h1>
      </header>

      <main className="flex w-full flex-col items-center">
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
