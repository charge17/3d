'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ModelViewer from '@/components/ModelViewer';
import Gallery, { type GalleryItem } from '@/components/Gallery';
import {
  generate3D,
  downloadUrl,
  thumbnailUrl,
} from '@/lib/api';

// ============================================================
// Constants
// ============================================================
const PROMPT_EXAMPLES = [
  'A futuristic cyberpunk helmet with glowing neon visor',
  'Ancient stone golem with moss and rune carvings',
  'Elegant elven sword with gold filigree and gemstones',
  'Sci-fi drone with rotating thrusters and antenna',
  'Cartoon dinosaur character, chibi style, cute',
  'Medieval castle tower with battlements and flag',
  'Sports car, aerodynamic, sleek lines, low poly',
  'Magic crystal floating above a pedestal',
];

// ============================================================
// Main Page
// ============================================================
export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [queuePos, setQueuePos] = useState(0);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // Load gallery from localStorage
  // ============================================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hunyuan3d_gallery');
      if (saved) {
        setGalleryItems(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save gallery
  const saveGallery = useCallback((items: GalleryItem[]) => {
    localStorage.setItem('hunyuan3d_gallery', JSON.stringify(items));
  }, []);

  // ============================================================
  // Handle generation
  // ============================================================
  const handleGenerate = useCallback(async () => {
    const p = prompt.trim();
    if (!p) return;

    setStatus('pending');
    setErrorMsg('');
    setCurrentFileId(null);
    setQueuePos(0);

    try {
      const res = await generate3D(p);
      setJobId(res.job_id);
      setQueuePos(res.queue_position);
      setStatus('processing');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Failed to submit job');
    }
  }, [prompt]);

  // ============================================================
  // Poll job status
  // ============================================================
  useEffect(() => {
    if (!jobId || status !== 'processing') return;

    let cancelled = false;

    const poll = async () => {
      try {
        const { getJobStatus } = await import('@/lib/api');
        const s = await getJobStatus(jobId);
        if (cancelled) return;

        setQueuePos(Math.max(0, (s as any).queue_position ?? 0));

        if (s.status === 'done' && s.file_id) {
          setStatus('done');
          setCurrentFileId(s.file_id);

          // Add to gallery
          const newItem: GalleryItem = {
            id: s.job_id,
            prompt: s.prompt_original || prompt,
            fileId: s.file_id,
            thumbnailUrl: thumbnailUrl(s.file_id),
            downloadUrl: downloadUrl(s.file_id),
            createdAt: s.completed_at || new Date().toISOString(),
            status: 'done',
          };

          setGalleryItems((prev) => {
            const exists = prev.find((item) => item.id === newItem.id);
            if (exists) return prev;
            const updated = [newItem, ...prev].slice(0, 50); // keep last 50
            saveGallery(updated);
            return updated;
          });

          setSelectedGalleryId(newItem.id);
        } else if (s.status === 'error') {
          setStatus('error');
          setErrorMsg(s.error || 'Generation failed');
        } else {
          // Still processing — retry
          if (!cancelled) setTimeout(poll, 3000);
        }
      } catch (e: any) {
        if (!cancelled) {
          // Retry on network error
          setTimeout(poll, 5000);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [jobId, status]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleSelectGallery = useCallback((item: GalleryItem) => {
    setCurrentFileId(item.fileId);
    setSelectedGalleryId(item.id);
    setStatus('done');
    setPrompt(item.prompt);
  }, []);

  const handleDeleteGallery = useCallback(
    (id: string) => {
      setGalleryItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveGallery(updated);
        return updated;
      });
      if (selectedGalleryId === id) {
        setSelectedGalleryId(null);
        setCurrentFileId(null);
        setStatus('idle');
      }
    },
    [selectedGalleryId, saveGallery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && status !== 'processing' && status !== 'pending') {
        handleGenerate();
      }
    },
    [handleGenerate, status]
  );

  // ============================================================
  // Render
  // ============================================================
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-10">
        <h1
          className="text-4xl md:text-5xl font-bold mb-3"
          style={{ letterSpacing: '-0.02em' }}
        >
          <span className="gradient-text">Hunyuan3D</span>
          <span className="text-white"> v4 </span>
          <span className="text-[var(--accent-glow)]">ULTRA PRO</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg">
          AI-Powered 3D Mesh Generation · PBR Textures · Game-Ready Assets
        </p>
      </header>

      {/* Main Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}
      >
        {/* Input Card */}
        <div className="glass p-6">
          {/* Input row */}
          <div className="flex gap-3 mb-4">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your 3D model... (e.g., 'a dragon statue')"
              className="flex-1 px-4 py-3 rounded-xl text-base outline-none transition-all"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              disabled={status === 'processing' || status === 'pending'}
            />

            <button
              onClick={handleGenerate}
              disabled={
                !prompt.trim() || status === 'processing' || status === 'pending'
              }
              className="btn-glow px-6 py-3 rounded-xl font-semibold text-white text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                background:
                  status === 'processing' || status === 'pending'
                    ? 'var(--border)'
                    : 'var(--accent)',
                border: 'none',
                cursor:
                  status === 'processing' || status === 'pending'
                    ? 'not-allowed'
                    : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {status === 'processing' || status === 'pending' ? (
                <span className="flex items-center gap-2">
                  <span className="status-dot-processing">⬡</span>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>✨</span> Generate
                </span>
              )}
            </button>
          </div>

          {/* Prompt length */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-secondary)]">
              {prompt.length} characters
            </span>

            {/* Status badge */}
            {status !== 'idle' && (
              <StatusBadge
                status={status}
                queuePos={queuePos}
                errorMsg={errorMsg}
                jobId={jobId}
                fileId={currentFileId}
                prompt={prompt}
              />
            )}
          </div>

          {/* Prompt examples */}
          {status === 'idle' && (
            <div className="mt-4">
              <p className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                Try these examples:
              </p>
              <div className="flex flex-wrap gap-2">
                {PROMPT_EXAMPLES.slice(0, 6).map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(ex)}
                    className="px-3 py-1.5 text-xs rounded-lg transition-all hover:scale-[1.02]"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3D Viewer */}
        <ModelViewer
          modelUrl={currentFileId ? downloadUrl(currentFileId) : null}
          height="500px"
        />

        {/* Download button (when done) */}
        {status === 'done' && currentFileId && (
          <div className="flex justify-center gap-3 animate-slide-up">
            <a
              href={downloadUrl(currentFileId)}
              download
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'var(--success)' }}
            >
              📥 Download GLB
            </a>
            <button
              onClick={() => {
                setStatus('idle');
                setPrompt('');
                setCurrentFileId(null);
                setJobId(null);
                setSelectedGalleryId(null);
                inputRef.current?.focus();
              }}
              className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              🔄 New Generation
            </button>
          </div>
        )}

        {/* Gallery */}
        <Gallery
          items={galleryItems}
          onSelect={handleSelectGallery}
          onDelete={handleDeleteGallery}
          selectedId={selectedGalleryId ?? undefined}
        />
      </div>
    </main>
  );
}

// ============================================================
// Status Badge Component
// ============================================================
function StatusBadge({
  status,
  queuePos,
  errorMsg,
  jobId,
  fileId,
  prompt,
}: {
  status: string;
  queuePos: number;
  errorMsg: string;
  jobId: string | null;
  fileId: string | null;
  prompt: string;
}) {
  const config: Record<string, { color: string; icon: string; text: string }> =
    {
      pending: { color: '#f59e0b', icon: '⏳', text: 'Waiting in queue...' },
      processing: {
        color: '#3366ff',
        icon: '⚙️',
        text: 'Generating 3D mesh...',
      },
      done: { color: '#22c55e', icon: '✅', text: 'Complete!' },
      error: { color: '#ef4444', icon: '❌', text: 'Error' },
    };

  const cfg = config[status] || config.pending;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span
        className="flex items-center gap-1.5 px-3 py-1 rounded-full"
        style={{
          background: `${cfg.color}20`,
          color: cfg.color,
          border: `1px solid ${cfg.color}40`,
        }}
      >
        {status === 'processing' ? (
          <span className="status-dot-processing">{cfg.icon}</span>
        ) : (
          <span>{cfg.icon}</span>
        )}
        {cfg.text}
        {queuePos > 0 && status === 'processing' && (
          <span style={{ opacity: 0.7 }}>(#{queuePos} in queue)</span>
        )}
      </span>

      {jobId && (
        <span
          className="px-2 py-0.5 rounded font-mono text-[10px]"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
          }}
        >
          ID: {jobId}
        </span>
      )}

      {status === 'error' && errorMsg && (
        <span className="text-[var(--error)]">{errorMsg}</span>
      )}
    </div>
  );
}
