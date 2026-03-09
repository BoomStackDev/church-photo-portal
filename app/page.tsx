'use client';

import { useState } from 'react';
import PinEntry from '../components/PinEntry';
import UploadForm from '../components/UploadForm';
import SuccessMessage from '../components/SuccessMessage';
import ErrorMessage from '../components/ErrorMessage';
import type { UploadResult } from '../types';

type View = 'pin' | 'upload' | 'success' | 'error';

export default function Home() {
  const [view, setView] = useState<View>('pin');
  const [pin, setPin] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  function handlePinSuccess(enteredPin: string) {
    setPin(enteredPin);
    setView('upload');
  }

  function handleUploadSuccess(result: UploadResult) {
    setUploadResult(result);
    setView('success');
  }

  function handleError(message: string) {
    setErrorMessage(message);
    setView('error');
  }

  function handleReset() {
    setView('upload');
    setUploadResult(null);
    setErrorMessage('');
  }

  return (
    <>
      {view === 'pin' && <PinEntry onSuccess={handlePinSuccess} />}
      {view === 'upload' && <UploadForm pin={pin} onSuccess={handleUploadSuccess} onError={handleError} />}
      {view === 'success' && (
        <SuccessMessage
          uploadedCount={uploadResult?.uploadedFiles.length ?? 0}
          failedCount={uploadResult?.failedFiles.length ?? 0}
          onReset={handleReset}
        />
      )}
      {view === 'error' && <ErrorMessage message={errorMessage} onRetry={handleReset} />}
    </>
  );
}
