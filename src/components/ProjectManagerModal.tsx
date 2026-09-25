import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  FolderOpen,
  Trash2,
  Plus,
  Clock,
  Building2,
  Server,
  Download,
  Upload,
  CheckCircle2,
  FilePlus,
} from 'lucide-react';
import { CableRun, NetworkNode, Structure } from '../types/network';

export interface SavedProject {
  id: string;
  name: string;
  updatedAt: string;
  structures: Structure[];
  nodes: NetworkNode[];
  cables: CableRun[];
}

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStructures: Structure[];
  currentNodes: NetworkNode[];
  currentCables: CableRun[];
  currentProjectName: string;
  setCurrentProjectName: (name: string) => void;
  onLoadProject: (project: SavedProject) => void;
  onNewCleanProject: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const STORAGE_KEY = 'TEPBIZ_SAVED_PROJECTS_V1';
const LEGACY_STORAGE_KEY = 'DICT_WIFI_SAVED_PROJECTS_V1';

export function getSavedProjectsFromStorage(): SavedProject[] {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load projects from storage', e);
    return [];
  }
}

export function saveProjectsToStorage(projects: SavedProject[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to storage', e);
  }
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentStructures,
  currentNodes,
  currentCables,
  currentProjectName,
  setCurrentProjectName,
  onLoadProject,
  onNewCleanProject,
  onExportJson,
  onImportJson,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [saveName, setSaveName] = useState(currentProjectName || 'Barangay Free WiFi Site');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProjects(getSavedProjectsFromStorage());
      setSaveName(currentProjectName || 'Barangay Free WiFi Site');
    }
  }, [isOpen, currentProjectName]);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    const trimmed = saveName.trim() || 'Untitled TEPBIZ Project';
    const now = new Date().toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const existingIndex = projects.findIndex((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    let updated: SavedProject[];

    if (existingIndex >= 0) {
      updated = [...projects];
      updated[existingIndex] = {
        ...updated[existingIndex],
        updatedAt: now,
        structures: currentStructures,
        nodes: currentNodes,
        cables: currentCables,
      };
    } else {
      const newProj: SavedProject = {
        id: `proj-${Date.now()}`,
        name: trimmed,
        updatedAt: now,
        structures: currentStructures,
        nodes: currentNodes,
        cables: currentCables,
      };
      updated = [newProj, ...projects];
    }

    setProjects(updated);
    saveProjectsToStorage(updated);
    setCurrentProjectName(trimmed);
    setSaveSuccessMsg(`Project "${trimmed}" saved successfully!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const filtered = projects.filter((p) => p.id !== id);
      setProjects(filtered);
      saveProjectsToStorage(filtered);
    }
  };

  const handleLoad = (p: SavedProject) => {
    onLoadProject(p);
    setCurrentProjectName(p.name);
    onClose();
  };

  const handleStartNew = () => {
    onNewCleanProject();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-600/40 text-sky-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Project Manager · Save &amp; Continue
              </h2>
              <p className="text-[11px] text-slate-400">
                Save network layouts to browser storage or start a fresh clean canvas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs text-slate-200">
          {/* Quick Actions Row: New Clean Project & JSON backup */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={handleStartNew}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/60 hover:bg-slate-800/60 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 text-sky-400 font-semibold mb-1">
                <FilePlus className="w-4 h-4" />
                <span>New Clean Canvas</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Wipe canvas clean with empty slate ready for custom design.
              </p>
            </button>

            <button
              onClick={onExportJson}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800/60 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <Download className="w-4 h-4" />
                <span>Download JSON</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Export current layout file to share with colleagues.
              </p>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-800/60 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 text-purple-400 font-semibold mb-1">
                <Upload className="w-4 h-4" />
                <span>Upload JSON</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Import an existing project JSON from your computer.
              </p>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                onImportJson(e);
                onClose();
              }}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Save Current Working Design */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Save Current Canvas as Project</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {currentNodes.length} devices · {currentCables.length} cable runs · {currentStructures.length} structures
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Project Name (e.g. Brgy. Sto. Domingo Free Wi-Fi)"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCurrent();
                }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleSaveCurrent}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Project</span>
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="flex items-center gap-2 text-emerald-400 text-[11px] bg-emerald-950/50 border border-emerald-800/60 p-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Saved Projects List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Saved Projects in Browser ({projects.length})
              </span>
              <span className="text-[10px] text-slate-400">
                Stored in browser local storage
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/60 text-slate-400">
                <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-slate-400">No saved projects yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Type a name above and click &quot;Save Project&quot; to keep your work and continue anytime!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                        <span>{p.name}</span>
                        {p.name === currentProjectName && (
                          <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.2 rounded font-mono">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{p.updatedAt}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{p.structures.length} structures</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Server className="w-3 h-3" />
                          <span>{p.nodes.length} equipment</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLoad(p)}
                        className="px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-800/80 transition-colors text-xs font-medium"
                      >
                        Load &amp; Continue
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete saved project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span>TEPBIZ™ · Network Engineering &amp; Simulation Workspace</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
