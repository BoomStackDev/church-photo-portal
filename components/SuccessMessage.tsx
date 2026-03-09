'use client';

interface SuccessMessageProps {
  uploadedCount: number;
  failedCount: number;
  onReset: () => void;
}

export default function SuccessMessage({ uploadedCount, failedCount, onReset }: SuccessMessageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank you!</h2>
        <p className="text-slate-500 mb-2">
          {uploadedCount} file{uploadedCount !== 1 ? 's' : ''} submitted successfully.
        </p>
        {failedCount > 0 && (
          <p className="text-red-500 text-sm mb-4">{failedCount} file{failedCount !== 1 ? 's' : ''} failed to upload.</p>
        )}
        <button
          onClick={onReset}
          className="w-full mt-6 bg-slate-800 text-white text-lg font-semibold py-4 rounded-2xl active:bg-slate-700 transition-colors"
        >
          Submit More Photos
        </button>
      </div>
    </div>
  );
}
