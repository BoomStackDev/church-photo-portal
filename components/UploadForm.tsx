'use client';

import { useState, useRef } from 'react';
import type { UploadResult, FileMetadata, UploadSessionResponse } from '../types';

interface UploadFormProps {
  pin: string;
  onSuccess: (result: UploadResult) => void;
  onError: (message: string) => void;
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heic-sequence', 'video/mp4', 'video/quicktime'];

interface FileProgress {
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export default function UploadForm({ pin, onSuccess, onError }: UploadFormProps) {
  const [volunteerName, setVolunteerName] = useState('');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter((f) => ALLOWED_TYPES.includes(f.type));
    const invalid = selected.filter((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid.length > 0) {
      setValidationError(`${invalid.length} file(s) skipped — only photos and videos are allowed.`);
    } else {
      setValidationError('');
    }
    setFiles((prev) => [...prev, ...valid]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadFileInChunks(file: File, uploadUrl: string, fileIndex: number): Promise<void> {
    let start = 0;
    while (start < file.size) {
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
          'Content-Length': String(end - start),
        },
        body: chunk,
      });
      if (!response.ok && response.status !== 202) {
        throw new Error(`Upload failed for ${file.name}`);
      }
      start = end;
      const progress = Math.round((end / file.size) * 100);
      setFileProgress((prev) =>
        prev.map((fp, i) => (i === fileIndex ? { ...fp, progress, status: 'uploading' } : fp))
      );
    }
    setFileProgress((prev) =>
      prev.map((fp, i) => (i === fileIndex ? { ...fp, progress: 100, status: 'done' } : fp))
    );
  }

  async function handleSubmit() {
    setValidationError('');
    if (!volunteerName.trim()) { setValidationError('Please enter your name.'); return; }
    if (!caption.trim()) { setValidationError('Please enter a caption.'); return; }
    if (files.length === 0) { setValidationError('Please select at least one photo or video.'); return; }

    setUploading(true);
    setFileProgress(files.map((f) => ({ name: f.name, progress: 0, status: 'pending' })));

    try {
      const fileMeta: FileMetadata[] = files.map((f) => ({ name: f.name, mimeType: f.type, size: f.size }));
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, volunteerName, caption, files: fileMeta }),
      });

      if (res.status === 401) { onError('Incorrect PIN.'); return; }
      if (!res.ok) { const d = await res.json(); onError(d.error ?? 'Upload failed.'); return; }

      const data: UploadSessionResponse = await res.json();
      if (!data.success || !data.sessions) { onError('Could not start upload. Please try again.'); return; }

      const uploadedFiles: string[] = [];
      const failedFiles: string[] = [];

      await Promise.all(
        data.sessions.map(async (session, i) => {
          try {
            await uploadFileInChunks(files[i], session.uploadUrl, i);
            uploadedFiles.push(session.filename);
          } catch {
            failedFiles.push(files[i].name);
            setFileProgress((prev) =>
              prev.map((fp, idx) => (idx === i ? { ...fp, status: 'error' } : fp))
            );
          }
        })
      );

      onSuccess({ success: failedFiles.length === 0, uploadedFiles, failedFiles });
    } catch {
      onError('Something went wrong. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo header */}
      <div className="bg-slate-800 rounded-b-3xl px-6 pt-10 pb-8 flex flex-col items-center">
        <img src="/tpc-logo.png" alt="TPC Logo" className="h-16 w-auto mb-4" />
        <h1 className="text-xl font-bold text-white text-center">Volunteer Photo & Video Submission</h1>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 pb-10 space-y-5">

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
          <input
            type="text"
            value={volunteerName}
            onChange={(e) => setVolunteerName(e.target.value)}
            placeholder="e.g. Jane Smith"
            autoComplete="name"
            className="w-full border-2 border-slate-300 rounded-2xl px-5 py-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What is happening in these photos?"
            rows={3}
            className="w-full border-2 border-slate-300 rounded-2xl px-5 py-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 resize-none"
          />
        </div>

        {/* File picker */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Photos & Videos</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-400 rounded-2xl py-6 flex flex-col items-center gap-2 active:bg-slate-50 transition-colors"
          >
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m-4 4h8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-slate-600 text-sm font-medium">Tap to add photos or videos</span>
            <span className="text-slate-500 text-xs">JPG, PNG, HEIC, MP4, MOV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.heic,.png,.mp4,.mov"
            capture={undefined}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Selected files list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, i) => {
              const fp = fileProgress[i];
              return (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    {fp && fp.status === 'uploading' && (
                      <div className="mt-1.5 w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${fp.progress}%` }} />
                      </div>
                    )}
                    {fp && fp.status === 'done' && <p className="text-xs text-green-600 mt-1">Uploaded</p>}
                    {fp && fp.status === 'error' && <p className="text-xs text-red-500 mt-1">Failed</p>}
                  </div>
                  {!uploading && (
                    <button onClick={() => removeFile(i)} className="text-slate-400 text-xl leading-none flex-shrink-0">×</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <p className="text-red-500 text-sm text-center">{validationError}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full bg-slate-800 text-white text-lg font-semibold py-4 rounded-2xl disabled:opacity-40 active:bg-slate-700 transition-colors"
        >
          {uploading ? 'Uploading...' : `Submit ${files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : ''}`}
        </button>
      </div>
    </div>
  );
}
