import React, { useState } from 'react';
import { Save, Download, X, Check, FolderPlus } from 'lucide-react';
import { CableRun, NetworkNode, Structure } from '../types/network';
import { downloadFile } from '../utils/exportUtils';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectName: string;
  structures: Structure[];
  nodes: NetworkNode[];
  cables: CableRun[];
  onSaveSuccess: (newName: string) => void;
}

export const SaveProjectModal: React.FC<SaveProjectModalProps> = ({
  isOpen,
  onClose,
  currentProjectName,
  structures,
  nodes,
  cables,
  onSaveSuccess,
}) => {
  const [nameInput, setNameInput] = useState(
    currentProjectName.trim() && currentProjectName !== 'Untitled Network Project'
      ? currentProjectName
      : ''
  );
  const [downloadBackup, setDownloadBackup] = useState(true);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = nameInput.trim() || 'Untitled Network Project';

    // Export .json file if checked
    if (downloadBackup) {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        projectName: finalName,
        structures,
        nodes,
        cables,
      };
      downloadFile(
        `TEPBIZ_${finalName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(exportData, null, 2),
        'application/json'
      );
    }

    onSaveSuccess(finalName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950 border border-sky-800/60 text-sky-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Save Network Project</h2>
              <p className="text-[11px] text-slate-400">Label your project to store it securely</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Project Name / Title:
            </label>
            <input
              type="text"
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Barangay Hall & Plaza Public WiFi"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 placeholder-slate-500"
            />
            <span className="text-[10px] text-slate-400 block">
              Saved projects are accessible anytime in your <strong>Projects Manager</strong> tab.
            </span>
          </div>

          {/* Project Summary Pill */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Current Elements:</span>
            <div className="flex items-center gap-2 font-mono text-[10px] text-sky-400">
              <span>{nodes.length} Nodes</span>
              <span>·</span>
              <span>{cables.length} Cables</span>
              <span>·</span>
              <span>{structures.length} Zones</span>
            </div>
          </div>

          {/* Option: Also download JSON file */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-colors">
            <input
              type="checkbox"
              checked={downloadBackup}
              onChange={(e) => setDownloadBackup(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 bg-slate-900"
            />
            <div className="text-xs">
              <span className="font-medium text-slate-200 block">Download <code>.json</code> Project File</span>
              <span className="text-[11px] text-slate-400">
                Exports a portable <code>.json</code> file that can be re-imported into this web-app anytime.
              </span>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
