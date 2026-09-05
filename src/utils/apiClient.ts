import { Job } from '../types';

export interface ServerInfo {
  serverHost: string;
  port: number;
  localIps: string[];
  primaryUrl: string;
  allUrls: string[];
  dataPath: string;
  storageType: string;
}

const STORAGE_KEY = 'glass_optimizer_jobs_v2';

export async function fetchServerInfo(): Promise<ServerInfo | null> {
  try {
    const res = await fetch('/api/server-info');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function fetchJobsFromServer(fallbackJobs: Job[]): Promise<{ jobs: Job[]; online: boolean }> {
  try {
    const res = await fetch('/api/jobs');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Update local backup
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
          // ignore quota error
        }
        return { jobs: data, online: true };
      }
    }
  } catch (err) {
    console.warn('Cannot reach central company server, using local cache:', err);
  }

  // Fallback to local storage or defaults if server is initializing
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { jobs: parsed, online: false };
      }
    }
  } catch (err) {
    // ignore
  }

  return { jobs: fallbackJobs, online: false };
}

export async function saveJobToServer(job: Job): Promise<{ success: boolean; job: Job; error?: string }> {
  try {
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });

    if (res.ok) {
      const saved = await res.json();
      return { success: true, job: saved };
    }

    if (res.status === 404) {
      // Create if it doesn't exist on server yet
      const createRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      if (createRes.ok) {
        const created = await createRes.json();
        return { success: true, job: created };
      }
    }

    if (res.status === 423) {
      const err = await res.json();
      return { success: false, job, error: err.error || 'Job is locked against editing.' };
    }
  } catch (err: any) {
    console.warn('Server sync error on save:', err);
  }

  return { success: false, job };
}

export async function toggleJobLockOnServer(
  jobId: string,
  locked: boolean,
  user: string
): Promise<{ success: boolean; job?: Job; error?: string }> {
  try {
    const res = await fetch(`/api/jobs/${jobId}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locked, user }),
    });

    if (res.ok) {
      const updated = await res.json();
      return { success: true, job: updated };
    }

    const err = await res.json();
    return { success: false, error: err.error || 'Failed to update lock status.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server connection failed.' };
  }
}
