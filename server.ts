import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample jobs fallback if data file does not exist
const SEED_JOBS = [
  {
    id: 'job-1001',
    serialNumber: 'JOB-1001',
    title: 'Commercial Glazing - Example Specification',
    client: 'Interglass Architectural',
    notes: 'Specification with multiple glass sizes: 1628x1060, 767x1092, 760x1060, 1720x2090',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'optimized',
    pieces: [
      { id: 'p-1', label: 'Curtain Wall Lower 1628x1060', width: 1628, height: 1060, qty: 12, allowRotation: true, color: '#1e3a8a' },
      { id: 'p-2', label: 'Transom Fixed 767x1092', width: 767, height: 1092, qty: 18, allowRotation: true, color: '#047857' },
      { id: 'p-3', label: 'Storefront Side 760x1060', width: 760, height: 1060, qty: 8, allowRotation: true, color: '#b45309' },
      { id: 'p-4', label: 'Entrance Header 1720x2090', width: 1720, height: 2090, qty: 3, allowRotation: true, color: '#6d28d9' }
    ],
    stockInventory: [
      { id: 's-1', name: 'Jumbo 3210x2250', width: 3210, height: 2250, qty: 9999, cost: 180, enabled: false },
      { id: 's-2', name: 'Split Jumbo 3210x2000', width: 3210, height: 2000, qty: 9999, cost: 160, enabled: false },
      { id: 's-3', name: 'Standard 2440x1830', width: 2440, height: 1830, qty: 9999, cost: 110, enabled: false },
      { id: 's-4', name: 'Medium 2140x1600', width: 2140, height: 1600, qty: 9999, cost: 85, enabled: false },
      { id: 's-5', name: 'Custom Small 2000x1500', width: 2000, height: 1500, qty: 9999, cost: 75, enabled: false }
    ],
    settings: {
      kerf: 0,
      trimMargin: 0,
      allowRotationGlobal: true,
      strategy: 'auto-best',
      minReusableWidth: 400,
      minReusableHeight: 400,
    },
    result: null,
    locked: false,
    createdBy: 'User 1 (Admin)',
  },
  {
    id: 'job-1002',
    serialNumber: 'JOB-1002',
    title: 'Residential Balcony & Windows Batch',
    client: 'Skyline Contractors',
    notes: 'Mixed panels for high-rise residential building',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'draft',
    pieces: [
      { id: 'p-201', label: 'Balustrade Glass 1800x950', width: 1800, height: 950, qty: 4, allowRotation: true, color: '#0f3460' },
      { id: 'p-202', label: 'Window Fixed 1250x1400', width: 1250, height: 1400, qty: 6, allowRotation: true, color: '#164e63' },
      { id: 'p-203', label: 'Top Transom 650x1250', width: 650, height: 1250, qty: 4, allowRotation: true, color: '#1e3a8a' }
    ],
    stockInventory: [
      { id: 's-1', name: 'Jumbo 3210x2250', width: 3210, height: 2250, qty: 9999, cost: 180, enabled: false },
      { id: 's-2', name: 'Split Jumbo 3210x2000', width: 3210, height: 2000, qty: 9999, cost: 160, enabled: false },
      { id: 's-3', name: 'Standard 2440x1830', width: 2440, height: 1830, qty: 9999, cost: 110, enabled: false }
    ],
    settings: {
      kerf: 0,
      trimMargin: 0,
      allowRotationGlobal: true,
      strategy: 'auto-best',
      minReusableWidth: 400,
      minReusableHeight: 400,
    },
    result: null,
    locked: false,
    createdBy: 'User 2 (Planner)',
  }
];

function readJobsFromFile(): any[] {
  try {
    if (!fs.existsSync(JOBS_FILE)) {
      fs.writeFileSync(JOBS_FILE, JSON.stringify(SEED_JOBS, null, 2), 'utf-8');
      return SEED_JOBS;
    }
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_JOBS;
  } catch (err) {
    console.error('Error reading jobs file:', err);
    return SEED_JOBS;
  }
}

function writeJobsToFile(jobs: any[]): boolean {
  try {
    const tempFile = `${JOBS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(jobs, null, 2), 'utf-8');
    fs.renameSync(tempFile, JOBS_FILE);
    return true;
  } catch (err) {
    console.error('Error writing jobs file:', err);
    return false;
  }
}

// Helper to get local network IP addresses for multi-PC company LAN setup
function getLocalNetworkIps(): string[] {
  const nets = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(nets)) {
    const iface = nets[name];
    if (iface) {
      for (const net of iface) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
  }
  return ips.length > 0 ? ips : ['127.0.0.1'];
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Server Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'multi-pc-server',
    serverTime: new Date().toISOString(),
  });
});

// Server LAN connection details for connecting PCs
app.get('/api/server-info', (req, res) => {
  const ips = getLocalNetworkIps();
  res.json({
    serverHost: os.hostname(),
    port: PORT,
    localIps: ips,
    primaryUrl: `http://${ips[0] || 'localhost'}:${PORT}`,
    allUrls: ips.map((ip) => `http://${ip}:${PORT}`),
    dataPath: JOBS_FILE,
    storageType: 'Centralized Server JSON Database',
  });
});

// Get all jobs (used by all connected PCs)
app.get('/api/jobs', (req, res) => {
  const jobs = readJobsFromFile();
  res.json(jobs);
});

// Create new job on server
app.post('/api/jobs', (req, res) => {
  try {
    const newJob = req.body;
    if (!newJob || !newJob.id) {
      res.status(400).json({ error: 'Invalid job data' });
      return;
    }

    const jobs = readJobsFromFile();
    // Prepend new job
    const updated = [newJob, ...jobs.filter((j: any) => j.id !== newJob.id)];
    writeJobsToFile(updated);

    res.status(201).json(newJob);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save job' });
  }
});

// Update existing job on server
app.put('/api/jobs/:id', (req, res) => {
  try {
    const jobId = req.params.id;
    const incomingJob = req.body;
    const jobs = readJobsFromFile();
    const index = jobs.findIndex((j: any) => j.id === jobId);

    if (index === -1) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const existingJob = jobs[index];

    // Check lock status: If job is locked and request tries to modify content without unlocking
    if (existingJob.locked && !req.body.isUnlocking && incomingJob.locked !== false) {
      // Allow if only metadata like status is updating, but prevent editing if strictly locked
      if (
        JSON.stringify(existingJob.pieces) !== JSON.stringify(incomingJob.pieces) ||
        JSON.stringify(existingJob.stockInventory) !== JSON.stringify(incomingJob.stockInventory)
      ) {
        res.status(423).json({
          error: `Job is locked by ${existingJob.lockedBy || 'another user'} on ${existingJob.lockedAt ? new Date(existingJob.lockedAt).toLocaleDateString() : 'earlier'}. Unlock the job before modifying.`,
        });
        return;
      }
    }

    jobs[index] = {
      ...existingJob,
      ...incomingJob,
      updatedAt: new Date().toISOString(),
    };

    writeJobsToFile(jobs);
    res.json(jobs[index]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update job' });
  }
});

// Lock / Unlock a job
app.post('/api/jobs/:id/lock', (req, res) => {
  try {
    const jobId = req.params.id;
    const { locked, user } = req.body;
    const jobs = readJobsFromFile();
    const index = jobs.findIndex((j: any) => j.id === jobId);

    if (index === -1) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    jobs[index] = {
      ...jobs[index],
      locked: Boolean(locked),
      lockedBy: locked ? (user || 'User') : undefined,
      lockedAt: locked ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    writeJobsToFile(jobs);
    res.json(jobs[index]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle job lock' });
  }
});

// DELETE IS PERMANENTLY DISABLED
// "Dont let anybody delete the jobs. Job once created will be there and can be edited."
app.delete('/api/jobs/:id', (req, res) => {
  res.status(403).json({
    error: 'Job deletion is permanently disabled. Jobs once created are preserved for auditing and re-cutting.',
  });
});

// ----------------------------------------------------
// SERVER START & VITE MIDDLEWARE
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalNetworkIps();
    console.log(`====================================================`);
    console.log(`2D Glass Optimizer Server Started on Port ${PORT}`);
    console.log(`Local machine URL: http://localhost:${PORT}`);
    ips.forEach((ip) => {
      console.log(`LAN Network URL (for PC 1, 2, 3, 4): http://${ip}:${PORT}`);
    });
    console.log(`Data stored at: ${JOBS_FILE}`);
    console.log(`Job deletion is DISABLED. Multi-user and job locking active.`);
    console.log(`====================================================`);
  });
}

startServer();
