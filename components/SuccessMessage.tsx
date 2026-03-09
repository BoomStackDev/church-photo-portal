interface SuccessMessageProps {
  uploadedCount: number;
  failedCount: number;
  onReset: () => void;
}

export default function SuccessMessage({ uploadedCount, failedCount, onReset }: SuccessMessageProps) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4 text-center">
      <h2 className="text-2xl font-semibold text-green-700 dark:text-green-400">
        Upload Complete!
      </h2>
      <p className="text-lg text-zinc-700 dark:text-zinc-300">
        {uploadedCount} {uploadedCount === 1 ? 'file' : 'files'} uploaded successfully.
      </p>
      {failedCount > 0 && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {failedCount} {failedCount === 1 ? 'file' : 'files'} failed to upload.
        </p>
      )}
      <button
        onClick={onReset}
        className="mt-4 rounded-lg bg-blue-600 px-6 py-4 text-lg font-medium text-white transition-colors hover:bg-blue-700"
      >
        Submit more photos
      </button>
    </div>
  );
}
