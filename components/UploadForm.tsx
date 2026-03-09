'use client';

import { useState, useRef } from 'react';
import type { UploadSession, UploadSessionResponse } from '@/types';

interface UploadFormProps {
  pin: string;
  onSuccess: (result: { uploadedFiles: string[]; failedFiles: string[] }) => void;
  onError: (message: string) => void;
}

interface FileProgress {
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

async function uploadFileInChunks(
  file: File,
  session: UploadSession,
  onProgress: (percent: number) => void
): Promise<void> {
  const totalSize = file.size;
  let offset = 0;

  while (offset < totalSize) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const chunkSize = chunk.size;
    const contentRange = `bytes ${offset}-${offset + chunkSize - 1}/${totalSize}`;

    const response = await fetch(session.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': chunkSize.toString(),
        'Content-Range': contentRange,
      },
      body: chunk,
    });

    if (!response.ok && response.status !== 202) {
      const error = await response.text();
      throw new Error(`Chunk upload failed: ${error}`);
    }

    offset += chunkSize;
    const percent = Math.round((offset / totalSize) * 100);
    onProgress(Math.min(percent, 100));
  }
}

export default function UploadForm({ pin, onSuccess, onError }: UploadFormProps) {
  const [volunteerName, setVolunteerName] = useState('');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateProgress(index: number, progress: number, status: FileProgress['status']) {
    setFileProgress(prev =>
      prev.map((f, i) => (i === index ? { ...f, progress, status } : f))
    );
  }

  async function handleSubmit() {
    if (!volunteerName.trim() || !caption.trim()) {
      onError('Please enter your name and a caption.');
      return;
    }
    if (!files || files.length === 0) {
      onError('Please select at least one file.');
      return;
    }

    setLoading(true);

    const fileArray = Array.from(files);
    setFileProgress(
      fileArray.map(f => ({ name: f.name, progress: 0, status: 'pending' }))
    );

    // Step 1 — get upload session URLs from Vercel
    let sessions: UploadSession[];
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          volunteerName,
          caption,
          files: fileArray.map(f => ({
            name: f.name,
            mimeType: f.type,
            size: f.size,
          })),
        }),
      });

      const data: UploadSessionResponse = await res.json();

      if (!data.success || !data.sessions) {
        onError(data.error ?? 'Failed to prepare upload. Please try again.');
        setLoading(false);
        return;
      }

      sessions = data.sessions;
    } catch {
      onError('Network error. Please check your connection and try again.');
      setLoading(false);
      return;
    }

    // Step 2 — upload each file directly to OneDrive in chunks
    const uploadedFiles: string[] = [];
    const failedFiles: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const session = sessions[i];

      updateProgress(i, 0, 'uploading');

      try {
        await uploadFileInChunks(file, session, (percent) => {
          updateProgress(i, percent, 'uploading');
        });
        updateProgress(i, 100, 'done');
        uploadedFiles.push(session.filename);
      } catch {
        updateProgress(i, 0, 'error');
        failedFiles.push(file.name);
      }
    }

    setLoading(false);

    if (uploadedFiles.length > 0) {
      onSuccess({ uploadedFiles, failedFiles });
    } else {
      onError('All files failed to upload. Please try again.');
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700">Your Name</label>
        <input
          type="text"
          value={volunteerName}
          onChange={e => setVolunteerName(e.target.value)}
          placeholder="Enter your name"
          disabled={loading}
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700">Caption</label>
        <input
          type="text"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Describe what's in the photo or video"
          disabled={loading}
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700">Photos & Videos (.jpg, .heic, .png, .mp4, .mov)</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.heic,.png,.mp4,.mov"
          onChange={e => setFiles(e.target.files)}
          disabled={loading}
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base disabled:opacity-50"
        />
      </div>

      {fileProgress.length > 0 && (
        <div className="flex flex-col gap-3">
          {fileProgress.map((f, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="truncate text-zinc-600">{f.name}</span>
                <span className="ml-2 shrink-0 text-zinc-500">
                  {f.status === 'done' ? '✓ Done' : f.status === 'error' ? '✗ Failed' : `${f.progress}%`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-200">
                <div
                  className={`h-2 rounded-full transition-all ${
                    f.status === 'error' ? 'bg-red-500' : f.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${f.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !files || files.length === 0}
        className="w-full rounded-lg bg-blue-600 px-4 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Submit Photos & Videos'}
      </button>
    </div>
  );
}
