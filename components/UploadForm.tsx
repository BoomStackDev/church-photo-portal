'use client';

import { useState, useRef } from 'react';

interface UploadFormProps {
  pin: string;
  onSuccess: (result: { uploadedFiles: string[]; failedFiles: string[] }) => void;
  onError: (message: string) => void;
}

export default function UploadForm({ pin, onSuccess, onError }: UploadFormProps) {
  const [volunteerName, setVolunteerName] = useState('');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (volunteerName.trim() === '' || caption.trim() === '') {
      onError('Name and caption are required.');
      return;
    }

    if (!files || files.length === 0) {
      onError('Please select at least one file.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('pin', pin);
      formData.append('volunteerName', volunteerName);
      formData.append('caption', caption);

      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result: { success: boolean; uploadedFiles: string[]; failedFiles: string[]; error?: string } =
        await response.json();

      if (!result.success && result.error) {
        onError(result.error);
      } else {
        onSuccess({ uploadedFiles: result.uploadedFiles, failedFiles: result.failedFiles });
      }
    } catch {
      onError('Upload failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="volunteerName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Your Name
        </label>
        <input
          id="volunteerName"
          type="text"
          value={volunteerName}
          onChange={(e) => setVolunteerName(e.target.value)}
          placeholder="Enter your name"
          className="rounded-lg border border-zinc-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="caption" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Caption
        </label>
        <input
          id="caption"
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Describe the photo or event"
          className="rounded-lg border border-zinc-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="files" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Photos & Videos
        </label>
        <input
          id="files"
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setFiles(e.target.files)}
          className="rounded-lg border border-zinc-300 px-4 py-3 text-base file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:file:bg-zinc-700 dark:file:text-zinc-200"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-blue-600 px-6 py-4 text-lg font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Uploading your photos...' : 'Upload'}
      </button>
    </form>
  );
}
