import React, { useState, useEffect } from 'react';
import { FilePlus, Save, Trash2, X, AlertCircle } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectName: string;
  nodeCount: number;
  cableCount: number;
  structureCount: number;
  onSaveAndCreateNew: (saveAsName: string) => void;
  onDiscardAndCreateNew: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  currentProjectName,
  nodeCount,
  cableCount,
  structureCount,
  onSaveAndCreateNew,
  onDiscardAndCreateNew,
}) => {
  const [projectNameInput, setProjectNameInput] = useState(
    currentProjectName.trim() && !currentProjectName.toLowerCase().includes('untitled')
      ? currentProjectName
      : 'My TEPBIZ Network Project'
  );

  useEffect(() => {
    if (isOpen) {
      setProjectNameInput(
        currentProjectName.trim() && !currentProjectName.toLowerCase().includes('untitled')
          ? currentProjectName
          : 'My TEPBIZ Network Project'
      );
    }
  }, [isOpen, currentProjectName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950 border border-sky-800/60 text-sky-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Create New Project</h2>
              <p className="text-[11px] text-slate-400">Save current design before starting a new canvas?</p>
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
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <p className="font-semibold text-amber-300">Existing canvas elements detected</p>
              <p className="text-[11px] mt-0.5 text-amber-200/80">
                You have <strong>{nodeCount} equipment</strong>, <strong>{cableCount} cables</strong>, and{' '}
                <strong>{structureCount} structure zones</strong> on your current canvas. Would you like to save this project before clearing to a new clean canvas?
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Save Project As (Project Name):
            </label>
            <input
              type="text"
              autoFocus
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              placeholder="e.g. Barangay Hall & Plaza Network"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <span className="text-[10px] text-slate-400">
              Choosing <strong>YES</strong> saves your work to your saved projects and lets you export a <code>.json</code> file anytime.
            </span>
          </div>
        </div>

        {/* Action Buttons: Yes, No, Cancel */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-2">
          {/* YES: Save & Start Clean */}
          <button
            onClick={() => {
              const name = projectNameInput.trim() || 'Untitled TEPBIZ Project';
              onSaveAndCreateNew(name);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>YES – Save Project &amp; Start Clean Canvas</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* NO: Discard & Start Clean */}
            <button
              onClick={onDiscardAndCreateNew}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-700/60 border border-slate-700/60 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Don't save and open a clean empty canvas"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>NO – Don't Save (Start Clean)</span>
            </button>

            {/* CANCEL */}
            <button
              onClick={onClose}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
