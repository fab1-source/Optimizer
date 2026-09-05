import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Folder, FileCode, ExternalLink, Download } from 'lucide-react';

interface DownloadCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadCodeModal: React.FC<DownloadCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'aistudio' | 'python' | 'terminal'>('aistudio');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const PYTHON_MAIN_PY = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rectpack import newPacker
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="2D Glass Stock Optimizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Item(BaseModel):
    width: int
    height: int
    qty: int
    label: str = ""

class OptimizeRequest(BaseModel):
    sheets: List[Item]
    glass_sizes: List[Item]
    allow_rotation: bool = True

@app.post("/optimize")
async def optimize(data: OptimizeRequest):
    packer = newPacker(rotation=data.allow_rotation)

    # Add Stock Sheets
    for sheet in data.sheets:
        for _ in range(sheet.qty):
            packer.add_bin(sheet.width, sheet.height)

    # Add Glass Pieces
    for i, glass in enumerate(data.glass_sizes):
        for q in range(glass.qty):
            packer.add_rect(glass.width, glass.height, rid=f"{glass.label or f'Item-{i}'}")

    packer.pack()

    results = []
    for i, bin_item in enumerate(packer):
        rects = []
        for rect in bin_item:
            rects.append({
                "x": rect.x,
                "y": rect.y,
                "w": rect.width,
                "h": rect.height,
                "label": str(rect.rid),
                "dimensions": f"{rect.width}x{rect.height}"
            })
        results.append({
            "sheet_index": i + 1,
            "width": bin_item.width,
            "height": bin_item.height,
            "used_rects": rects
        })

    return {"status": "success", "sheets": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
`;

  const REQUIREMENTS_TXT = `fastapi>=0.100.0
uvicorn>=0.22.0
rectpack>=0.2.2
python-dotenv>=1.0.0
pydantic>=2.0.0
`;

  const BACKEND_ENV = `PORT=8000
HOST=0.0.0.0
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-[#141820] border border-[#2d3748] rounded shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden text-[#e2e8f0] font-mono">
        {/* Header */}
        <div className="p-3 border-b border-[#2d3748] flex items-center justify-between bg-[#0f1115]">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>How to Download & Run on Your PC</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1a202c] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-3 border-b border-[#2d3748] flex gap-3 bg-[#0f1115] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('aistudio')}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'aistudio'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Export Full App (ZIP)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('python')}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'python'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Python Backend Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'terminal'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Terminal Setup Commands
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 flex-1 overflow-y-auto space-y-3 text-xs bg-[#0f1115]">
          {activeTab === 'aistudio' && (
            <div className="space-y-3 text-slate-300">
              <div className="p-2.5 bg-[#181124] border border-purple-900/60 rounded">
                <h4 className="font-bold text-purple-300 text-xs mb-1 uppercase tracking-wider">
                  Fastest Way: Export full application to local machine
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Download the entire working codebase directly from the Google AI Studio interface:
                </p>
              </div>

              <ol className="list-decimal list-inside space-y-2 text-slate-200 text-xs">
                <li className="p-2 bg-[#141820] rounded border border-[#2d3748]">
                  <span className="font-bold text-white">Open the AI Studio App Menu</span>: Look at the top right of your Google AI Studio screen next to the Share and Deploy buttons.
                </li>
                <li className="p-2 bg-[#141820] rounded border border-[#2d3748]">
                  <span className="font-bold text-white">Click "Export to ZIP" or "Export to GitHub"</span>: This packages all source code, React components, Tailwind styling, and package configs into a single download.
                </li>
                <li className="p-2 bg-[#141820] rounded border border-[#2d3748]">
                  <span className="font-bold text-white">Unzip on your PC</span>: Open a terminal in the unzipped folder and run:
                  <pre className="mt-1.5 p-2 bg-[#0f1115] font-mono text-emerald-300 rounded border border-[#2d3748] text-[10px]">
                    npm install{'\n'}
                    npm run dev
                  </pre>
                  It will launch immediately at <code className="text-blue-400">http://localhost:3000</code>.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-3">
              <div className="text-slate-300 text-[11px]">
                Here is the standalone Python FastAPI backend using <code className="text-purple-300 font-mono">rectpack</code>:
              </div>

              {/* main.py */}
              <div className="border border-[#2d3748] rounded overflow-hidden">
                <div className="p-1.5 bg-[#1a202c] flex items-center justify-between border-b border-[#2d3748]">
                  <span className="font-mono text-slate-300 text-[10px] font-bold flex items-center gap-1.5 uppercase">
                    <FileCode className="w-3 h-3 text-blue-400" />
                    backend/main.py
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(PYTHON_MAIN_PY, 'main.py')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0f1115] hover:bg-[#141820] border border-[#2d3748] text-slate-300 transition text-[10px] uppercase font-bold"
                  >
                    {copiedKey === 'main.py' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'main.py' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2.5 bg-[#141820] font-mono text-[10px] text-slate-200 overflow-x-auto max-h-56">
                  {PYTHON_MAIN_PY}
                </pre>
              </div>

              {/* requirements.txt */}
              <div className="border border-[#2d3748] rounded overflow-hidden">
                <div className="p-1.5 bg-[#1a202c] flex items-center justify-between border-b border-[#2d3748]">
                  <span className="font-mono text-slate-300 text-[10px] font-bold flex items-center gap-1.5 uppercase">
                    <FileCode className="w-3 h-3 text-emerald-400" />
                    backend/requirements.txt
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(REQUIREMENTS_TXT, 'req.txt')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0f1115] hover:bg-[#141820] border border-[#2d3748] text-slate-300 transition text-[10px] uppercase font-bold"
                  >
                    {copiedKey === 'req.txt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'req.txt' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2.5 bg-[#141820] font-mono text-[10px] text-slate-200 overflow-x-auto">
                  {REQUIREMENTS_TXT}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-3 text-slate-300 text-xs">
              <p className="text-[11px] text-slate-400">Step-by-step commands to run locally on your computer:</p>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                    1
                  </span>
                  <span>Set up & run the Python backend</span>
                </div>
                <pre className="p-2 bg-[#141820] border border-[#2d3748] font-mono text-[10px] text-emerald-400 rounded">
                  mkdir glass-optimizer && cd glass-optimizer{'\n'}
                  mkdir backend && cd backend{'\n'}
                  # Paste main.py and requirements.txt here{'\n'}
                  pip install -r requirements.txt{'\n'}
                  python main.py
                </pre>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                    2
                  </span>
                  <span>Set up & run the React frontend</span>
                </div>
                <pre className="p-2 bg-[#141820] border border-[#2d3748] font-mono text-[10px] text-cyan-400 rounded">
                  cd ../{'\n'}
                  npx create-react-app frontend{'\n'}
                  cd frontend{'\n'}
                  npm install axios lucide-react{'\n'}
                  npm start
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#0f1115] border-t border-[#2d3748] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#1e2533] hover:bg-[#283244] border border-[#2d3748] text-slate-200 text-xs font-bold uppercase rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
