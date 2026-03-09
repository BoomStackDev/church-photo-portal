'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface OneDriveFile {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  file?: { mimeType: string };
  '@microsoft.graph.downloadUrl'?: string;
}

interface GroupedFiles {
  [date: string]: OneDriveFile[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<OneDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<OneDriveFile | null>(null);

  // Select mode state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Move dialog state
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveFolder, setMoveFolder] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState('');

  useEffect(() => {
    if (session?.accessToken) {
      fetchFiles();
    }
  }, [session]);

  async function fetchFiles() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/files');
      if (!res.ok) throw new Error('Failed to load files');
      const data = await res.json();
      setFiles(data.files ?? []);
    } catch {
      setError('Could not load files. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function groupByDate(fileList: OneDriveFile[]): GroupedFiles {
    return fileList.reduce((groups: GroupedFiles, file) => {
      const date = new Date(file.lastModifiedDateTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(file);
      return groups;
    }, {});
  }

  function isImage(file: OneDriveFile) {
    return file.file?.mimeType?.startsWith('image/') ?? false;
  }

  function isVideo(file: OneDriveFile) {
    return file.file?.mimeType?.startsWith('video/') ?? false;
  }

  function toggleSelect(fileId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function handleFileTap(file: OneDriveFile) {
    if (selectMode) {
      toggleSelect(file.id);
    } else {
      setLightbox(file);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/auth/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: Array.from(selectedIds) }),
      });
      const data: { success: boolean; error?: string } = await res.json();
      if (!data.success) {
        setDeleteError(data.error ?? 'Delete failed.');
        return;
      }
      setFiles((prev) => prev.filter((f) => !selectedIds.has(f.id)));
      setShowDeleteDialog(false);
      exitSelectMode();
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleMove() {
    if (!moveFolder.trim()) {
      setMoveError('Please enter a folder name.');
      return;
    }
    setMoveLoading(true);
    setMoveError('');
    try {
      const res = await fetch('/api/auth/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: Array.from(selectedIds),
          destinationFolder: moveFolder.trim(),
        }),
      });
      const data: { success: boolean; error?: string } = await res.json();
      if (!data.success) {
        setMoveError(data.error ?? 'Move failed.');
        return;
      }
      setFiles((prev) => prev.filter((f) => !selectedIds.has(f.id)));
      setShowMoveDialog(false);
      setMoveFolder('');
      exitSelectMode();
    } catch {
      setMoveError('Network error. Please try again.');
    } finally {
      setMoveLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <Image src="/tpc-logo.png" alt="TPC Logo" width={160} height={72} className="mx-auto mb-8" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Admin Gallery</h1>
          <p className="text-slate-500 mb-8">Sign in with your tpob.org account to view submissions.</p>
          <button
            onClick={() => signIn('azure-ad')}
            className="w-full bg-slate-800 text-white text-lg font-semibold py-4 rounded-2xl active:bg-slate-700 transition-colors"
          >
            Sign in with Microsoft
          </button>
        </div>
      </div>
    );
  }

  const grouped = groupByDate(files);
  const dates = Object.keys(grouped);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/tpc-logo.png" alt="TPC Logo" width={80} height={36} />
          <span className="text-slate-700 font-semibold text-sm">Admin Gallery</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            className="text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg active:bg-slate-50"
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
          <button
            onClick={() => signOut()}
            className="text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg active:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto pb-24">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-400">Loading submissions...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={fetchFiles} className="text-red-700 font-semibold text-sm mt-2 underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No submissions yet.</p>
          </div>
        )}

        {dates.map((date) => (
          <div key={date} className="mb-8">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{date}</h2>
            <div className="grid grid-cols-2 gap-3">
              {grouped[date].map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleFileTap(file)}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 cursor-pointer active:scale-95 transition-transform"
                >
                  {isImage(file) && file['@microsoft.graph.downloadUrl'] && (
                    <img
                      src={file['@microsoft.graph.downloadUrl']}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {isVideo(file) && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                      <svg className="w-10 h-10 text-white mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span className="text-white text-xs px-2 truncate w-full text-center">{file.name}</span>
                    </div>
                  )}
                  {!isImage(file) && !isVideo(file) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-slate-400 text-xs text-center px-2">{file.name}</span>
                    </div>
                  )}

                  {/* Selection overlay */}
                  {selectMode && (
                    <div className="absolute top-2 right-2">
                      {selectedIds.has(file.id) ? (
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-white border-opacity-60 bg-black bg-opacity-20" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200 px-4 py-3 pb-safe flex items-center justify-between"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <span className="text-sm font-medium text-slate-600">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMoveError(''); setMoveFolder(''); setShowMoveDialog(true); }}
              className="text-sm font-semibold text-slate-700 border border-slate-200 px-4 py-2 rounded-lg active:bg-slate-50"
            >
              Move
            </button>
            <button
              onClick={() => { setDeleteError(''); setShowDeleteDialog(true); }}
              className="text-sm font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-lg active:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Delete {selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''}?
            </h3>
            <p className="text-slate-500 text-sm mb-4">This cannot be undone.</p>
            {deleteError && (
              <p className="text-red-500 text-sm mb-4">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteLoading}
                className="flex-1 text-sm font-semibold text-slate-600 border border-slate-200 py-3 rounded-xl active:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 text-sm font-semibold text-white bg-red-600 py-3 rounded-xl active:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Move {selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''}
            </h3>
            <p className="text-slate-500 text-xs mb-4">
              Files will be moved to a subfolder inside Church Photo Submissions
            </p>
            <input
              type="text"
              value={moveFolder}
              onChange={(e) => setMoveFolder(e.target.value)}
              placeholder="Folder name"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-slate-400 mb-3"
              autoFocus
            />
            {moveError && (
              <p className="text-red-500 text-sm mb-3">{moveError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMoveDialog(false)}
                disabled={moveLoading}
                className="flex-1 text-sm font-semibold text-slate-600 border border-slate-200 py-3 rounded-xl active:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMove}
                disabled={moveLoading}
                className="flex-1 text-sm font-semibold text-white bg-slate-800 py-3 rounded-xl active:bg-slate-700 disabled:opacity-50"
              >
                {moveLoading ? 'Moving...' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col"
          onClick={() => setLightbox(null)}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-white text-sm truncate flex-1 mr-4">{lightbox.name}</p>
            <div className="flex items-center gap-3">
              {lightbox['@microsoft.graph.downloadUrl'] && (
                <a
                  href={lightbox['@microsoft.graph.downloadUrl']}
                  download={lightbox.name}
                  onClick={(e) => e.stopPropagation()}
                  className="text-white text-sm border border-white border-opacity-30 px-3 py-1.5 rounded-lg"
                >
                  Download
                </a>
              )}
              <button className="text-white text-2xl leading-none">×</button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {isImage(lightbox) && lightbox['@microsoft.graph.downloadUrl'] && (
              <img
                src={lightbox['@microsoft.graph.downloadUrl']}
                alt={lightbox.name}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            )}
            {isVideo(lightbox) && lightbox['@microsoft.graph.downloadUrl'] && (
              <video
                src={lightbox['@microsoft.graph.downloadUrl']}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
