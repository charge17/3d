'use client';

import { useState } from 'react';

// ============================================================
// Types
// ============================================================
export interface GalleryItem {
  id: string;
  prompt: string;
  fileId: string;
  thumbnailUrl: string;
  downloadUrl: string;
  createdAt: string;
  status: 'done' | 'error';
}

interface GalleryProps {
  items: GalleryItem[];
  onSelect: (item: GalleryItem) => void;
  onDelete: (id: string) => void;
  selectedId?: string;
}

// ============================================================
// Component
// ============================================================
export default function Gallery({
  items,
  onSelect,
  onDelete,
  selectedId,
}: GalleryProps) {
  const [expanded, setExpanded] = useState(true);

  if (items.length === 0) {
    return (
      <div className="glass p-6 text-center">
        <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📦</div>
        <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">
          No Models Yet
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Generated 3D models will appear here.
          <br />
          Type a prompt above and hit Generate!
        </p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer border-b border-[var(--border)]"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-semibold flex items-center gap-2">
          <span>🖼️</span>
          Gallery
          <span className="text-xs bg-[var(--accent)]/20 text-[var(--accent-glow)] px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </h3>
        <span
          className="text-[var(--text-secondary)] transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </div>

      {/* Grid */}
      {expanded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
            padding: '16px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="glass cursor-pointer transition-all hover:scale-[1.02] relative group"
              style={{
                border:
                  selectedId === item.id
                    ? '2px solid var(--accent)'
                    : '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                animation: 'slide-up 0.4s ease-out',
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  height: '140px',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.prompt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ fontSize: '36px', opacity: 0.4 }}>⬡</div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '8px 10px' }}>
                <p
                  className="text-xs text-[var(--text-secondary)] line-clamp-2"
                  style={{
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {item.prompt}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1 opacity-60">
                  {formatDate(item.createdAt)}
                </p>
              </div>

              {/* Overlay actions */}
              <div
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                style={{ borderRadius: '12px' }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-glow)] transition"
                >
                  View
                </button>
                <a
                  href={item.downloadUrl}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/20 text-white hover:bg-white/30 transition"
                >
                  Download
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="px-2 py-1.5 text-xs rounded-lg bg-red-500/30 text-red-300 hover:bg-red-500/50 transition"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}
