// ============================================================
// Hunyuan3D v4 — API Client Library
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://your-colab.trycloudflare.com';

export interface GenerateResponse {
  job_id: string;
  status: string;
  queue_position: number;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  file_id?: string;
  prompt_original?: string;
  prompt_enhanced?: string;
  file_size_bytes?: number;
  thumb_available?: boolean;
  progress?: number;
  error?: string;
  created_at?: string;
  completed_at?: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  queue_size: number;
  completed_jobs: number;
}

export async function generate3D(prompt: string): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/status/${jobId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function pollJob(
  jobId: string,
  onUpdate: (status: JobStatus) => void,
  intervalMs = 3000,
  timeoutMs = 300_000 // 5 min
): Promise<JobStatus> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getJobStatus(jobId);
        onUpdate(status);

        if (status.status === 'done') {
          resolve(status);
          return;
        }
        if (status.status === 'error') {
          reject(new Error(status.error || 'Generation failed'));
          return;
        }
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Timeout — job took too long'));
          return;
        }
        setTimeout(poll, intervalMs);
      } catch (e) {
        reject(e);
      }
    };
    poll();
  });
}

export function downloadUrl(fileId: string): string {
  return `${API_BASE}/download/${fileId}`;
}

export function thumbnailUrl(fileId: string): string {
  return `${API_BASE}/thumbnail/${fileId}`;
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
