interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4 text-center">
      <h2 className="text-2xl font-semibold text-red-700 dark:text-red-400">
        Something went wrong
      </h2>
      <p className="text-lg text-zinc-700 dark:text-zinc-300">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg bg-blue-600 px-6 py-4 text-lg font-medium text-white transition-colors hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
