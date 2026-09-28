import React, { useState } from 'react';
import {
  Play,
  Hammer,
  FileSpreadsheet,
  Network,
  FileText,
  Sparkles,
  Layers,
  ChevronDown,
  Building2,
  Plus,
  Save,
  Sun,
  Moon,
  FolderOpen,
  Check,
  FilePlus,
  Download,
  Upload,
} from 'lucide-react';
import { ValidationSummary } from '../types/network';
import { PRESET_TOPOLOGIES, PresetTopology } from '../constants/presets';

interface TopBarProps {
  mode: 'design' | 'simulate';
  setMode: (mode: 'design' | 'simulate') => void;
  summary: ValidationSummary;
  canvasTheme: 'dark' | 'light';
  onToggleCanvasTheme: () => void;
  onLoadPreset: (preset: PresetTopology) => void;
  onAddStructure: (type: string, label: string) => void;
  onOpenBom: () => void;
  onOpenIpPlan: () => void;
  onOpenSiteSurvey: () => void;
  onOpenAiAssistant: () => void;
  onOpenProjectManager: () => void;
  onNewProjectClean: () => void;
  onSaveProjectQuick: () => void;
  projectName: string;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  setMode,
  summary,
  canvasTheme,
  onToggleCanvasTheme,
  onLoadPreset,
  onAddStructure,
  onOpenBom,
  onOpenIpPlan,
  onOpenSiteSurvey,
  onOpenAiAssistant,
  onOpenProjectManager,
  onNewProjectClean,
  onSaveProjectQuick,
  projectName,
  onExportJson,
  onImportJson,
}) => {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [structureMenuOpen, setStructureMenuOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSaveClick = () => {
    onSaveProjectQuick();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between z-30 shrink-0 select-none relative">
      {/* Zone 1: Wordmark / Brand & Project Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-600/40 flex items-center justify-center text-sky-400 font-bold text-xs tracking-wider shadow-inner">
          TEP
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-slate-100">
              TEPBIZ™ Network
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Mode Toggle & Central Controls */}
      <div className="flex items-center gap-3">
        {/* Design / Simulate Segmented Control */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg shadow-inner">
          <button
            onClick={() => setMode('design')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'design'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Design Mode</span>
          </button>
          <button
            onClick={() => setMode('simulate')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'simulate'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Mode</span>
          </button>
        </div>

        {/* Live Simulation Indicator Pill */}
        {mode === 'simulate' && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">System Status:</span>
            {summary.redCount > 0 ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {summary.redCount} Fault{summary.redCount > 1 ? 's' : ''} Detected
              </span>
            ) : summary.yellowCount > 0 ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Degraded / Warning
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                All Links Nominal
              </span>
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Actions, Structure Creator, Save, Projects & Themes */}
      <div className="flex items-center gap-2">
        {/* + Add Structure / Building Button */}
        <div className="relative">
          <button
            onClick={() => {
              setStructureMenuOpen(!structureMenuOpen);
              setPresetsOpen(false);
              setExportOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-100 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-600/50 rounded-lg transition-colors shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>+ Add Structure</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {structureMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-[100] animate-in fade-in duration-100">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Create Site Building / Zone
              </div>
              <div className="space-y-1 mt-1">
                {[
                  { type: 'barangay_hall', label: 'Barangay Hall', desc: 'Administrative office' },
                  { type: 'covered_court', label: 'Covered Basketball Court', desc: 'Evacuation & public assembly' },
                  { type: 'health_center', label: 'Rural Health Unit (RHU)', desc: 'Community clinic' },
                  { type: 'school', label: 'Public School Building', desc: 'Classrooms & computer lab' },
                  { type: 'plaza', label: 'Town Plaza / Park', desc: 'Open grounds & park' },
                  { type: 'library', label: 'Public Library / Tech4ED', desc: 'Digital community center' },
                  { type: 'generic', label: 'Custom Building Block', desc: 'Generic facility block' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      onAddStructure(item.type, item.label);
                      setStructureMenuOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-200 group-hover:text-sky-300">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Templates Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setPresetsOpen(!presetsOpen);
              setStructureMenuOpen(false);
              setExportOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Templates</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {presetsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-[100] animate-in fade-in duration-100">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Network Architecture Templates
              </div>
              <div className="space-y-1 mt-1">
                {PRESET_TOPOLOGIES.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onLoadPreset(preset);
                      setPresetsOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-200 group-hover:text-sky-400">
                        {preset.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Save Project Button */}
        <button
          onClick={handleSaveClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            saveSuccess
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
              : 'text-slate-300 bg-slate-900 hover:bg-slate-800 border-slate-800'
          }`}
          title="Save project state to browser storage (continue anytime)"
        >
          {saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span>Save</span>
            </>
          )}
        </button>

        {/* Project Manager / Continue Modal Trigger */}
        <button
          onClick={onOpenProjectManager}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          title="Manage saved projects, continue work, or start fresh clean canvas"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>Projects</span>
        </button>

        {/* Export Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setExportOpen(!exportOpen);
              setPresetsOpen(false);
              setStructureMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-[100] animate-in fade-in duration-100">
              <button
                onClick={() => {
                  onOpenSiteSurvey();
                  setExportOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Site Survey Reference</div>
                  <div className="text-[10px] text-slate-400">Printable deployment sheet</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenBom();
                  setExportOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Bill of Materials (BOM)</div>
                  <div className="text-[10px] text-slate-400">Equipment list &amp; PHP costs</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenIpPlan();
                  setExportOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Network className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">IP Addressing Plan</div>
                  <div className="text-[10px] text-slate-400">Subnet &amp; gateway assignments</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  onExportJson();
                  setExportOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-emerald-300">Download Project File (.json)</div>
                  <div className="text-[10px] text-slate-400">Export file readable by this app</div>
                </div>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setExportOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-purple-300">Import Project File (.json)</div>
                  <div className="text-[10px] text-slate-400">Load layout from computer</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Direct Import (.json) Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import saved project (.json file) from your computer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-purple-400" />
          <span>Import (.json)</span>
        </button>

        {/* Hidden file input for project loading */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportJson}
          accept=".json"
          className="hidden"
        />

        {/* White / Dark Canvas Theme Toggle */}
        <button
          onClick={onToggleCanvasTheme}
          title={`Switch to ${canvasTheme === 'dark' ? 'White Canvas (Light Paper)' : 'Dark Canvas (NOC Blueprint)'}`}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {canvasTheme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-sky-400" />
          )}
        </button>

        {/* + New Project (Clean Canvas) */}
        <button
          onClick={onNewProjectClean}
          title="New Project (Clean Canvas)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
        >
          <FilePlus className="w-3.5 h-3.5 text-slate-400" />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
};
