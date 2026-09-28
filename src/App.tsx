import React, { useState, useMemo, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { EquipmentLibrary } from './components/EquipmentLibrary';
import { NetworkCanvas } from './components/NetworkCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { AiAssistantPanel } from './components/AiAssistantPanel';
import { SiteSurveyModal } from './components/SiteSurveyModal';
import { BomModal } from './components/BomModal';
import { IpPlanModal } from './components/IpPlanModal';
import { ProjectManagerModal, SavedProject, saveProjectsToStorage, getSavedProjectsFromStorage } from './components/ProjectManagerModal';
import { NewProjectModal } from './components/NewProjectModal';
import { SaveProjectModal } from './components/SaveProjectModal';

import { CableRun, CableType, EquipmentType, NetworkNode, Structure } from './types/network';
import { PRESET_TOPOLOGIES, PresetTopology } from './constants/presets';
import { EQUIPMENT_CATALOG } from './constants/equipmentDefinitions';
import { validateNetwork } from './utils/validationEngine';
import { downloadFile } from './utils/exportUtils';
import { findRecommendedFix, ProjectedFix } from './utils/autoFixEngine';
import { Sparkles, SlidersHorizontal } from 'lucide-react';

const AUTO_SAVE_KEY = 'TEPBIZ_NETWORK_SESSION_DRAFT';

export default function App() {
  const defaultPreset = PRESET_TOPOLOGIES[0];

  // Try restoring from auto-saved session draft if available
  const [structures, setStructures] = useState<Structure[]>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.structures) return parsed.structures;
      }
    } catch {}
    return defaultPreset.structures;
  });

  const [nodes, setNodes] = useState<NetworkNode[]>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes) return parsed.nodes;
      }
    } catch {}
    return defaultPreset.nodes;
  });

  const [cables, setCables] = useState<CableRun[]>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cables) return (parsed.cables as CableRun[]).filter((c) => c.type !== 'grounding');
      }
    } catch {}
    return defaultPreset.cables.filter((c) => c.type !== 'grounding');
  });

  const [projectName, setProjectName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.projectName) return parsed.projectName;
      }
    } catch {}
    return 'TEPBIZ Enterprise Network';
  });

  // Canvas Theme: 'dark' (NOC Blueprint) or 'light' (White Canvas)
  const [canvasTheme, setCanvasTheme] = useState<'dark' | 'light'>('dark');

  // Mode: Design or Simulate
  const [mode, setMode] = useState<'design' | 'simulate'>('design');

  // Selection states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);

  // Right sidebar tab state: 'inspector' | 'assistant'
  const [rightTab, setRightTab] = useState<'inspector' | 'assistant'>('inspector');

  // Interactive Auto-Fix Projected Line state
  const [projectedFix, setProjectedFix] = useState<ProjectedFix | null>(null);

  // Modals
  const [isSiteSurveyOpen, setIsSiteSurveyOpen] = useState(false);
  const [isBomOpen, setIsBomOpen] = useState(false);
  const [isIpPlanOpen, setIsIpPlanOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSaveProjectModalOpen, setIsSaveProjectModalOpen] = useState(false);

  // Track if current project has been named/saved at least once
  const [hasBeenSavedOnce, setHasBeenSavedOnce] = useState<boolean>(() => {
    try {
      const saved = getSavedProjectsFromStorage();
      return saved.some((p) => p.name.trim().toLowerCase() === projectName.trim().toLowerCase());
    } catch {
      return false;
    }
  });

  // Auto-save current working draft to localStorage so user can continue seamlessly
  useEffect(() => {
    try {
      localStorage.setItem(
        AUTO_SAVE_KEY,
        JSON.stringify({
          projectName,
          structures,
          nodes,
          cables,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {}
  }, [projectName, structures, nodes, cables]);

  // Run validation engine
  const { validatedNodes, validatedCables, summary } = useMemo(() => {
    return validateNetwork(nodes, cables);
  }, [nodes, cables]);

  // Use validated nodes & cables in simulate mode, raw in design mode
  const activeNodes = mode === 'simulate' ? validatedNodes : nodes;
  const activeCables = mode === 'simulate' ? validatedCables : cables;

  const selectedNode = activeNodes.find((n) => n.id === selectedNodeId) || null;
  const selectedCable = activeCables.find((c) => c.id === selectedCableId) || null;

  // Toggle mode & clear projected recommendation line upon simulating
  const handleSetMode = (newMode: 'design' | 'simulate') => {
    setMode(newMode);
    if (newMode === 'simulate') {
      // Projected line vanishes when simulation begins
      setProjectedFix(null);

      // If IP configuration errors exist, bring AI Specialist tab into focus as requested!
      const hasIpFaults = summary.faults.some(
        (f) =>
          f.fault.code === 'IP_SUBNET_MISMATCH' ||
          f.fault.code === 'IP_SYNTAX_INVALID' ||
          f.fault.code === 'IP_DUPLICATE' ||
          f.fault.code === 'GATEWAY_NOT_FOUND' ||
          f.fault.code === 'DHCP_NO_SERVER'
      );
      if (hasIpFaults) {
        setRightTab('assistant');
      }
    }
  };

  // Add Equipment Node from library
  const handleAddEquipment = (type: EquipmentType) => {
    const spec = EQUIPMENT_CATALOG[type];
    const newNodeId = `${type}-${Date.now().toString().slice(-4)}`;

    const newNode: NetworkNode = {
      id: newNodeId,
      type,
      label: spec.name,
      position: { x: 300 + Math.random() * 80, y: 180 + Math.random() * 80 },
      power: { ...spec.defaultPower },
      network: spec.hasNetworkConfig
        ? {
            ip: `192.168.1.${15 + (nodes.length % 50)}`,
            subnet: '255.255.255.0',
            gateway: '192.168.1.1',
            isDhcp: type === 'client_device',
          }
        : undefined,
      status: 'green',
      faults: [],
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNodeId);
    setSelectedCableId(null);
    setRightTab('inspector');
  };

  // Duplicate Node
  const handleDuplicateNode = (nodeId: string) => {
    const existing = nodes.find((n) => n.id === nodeId);
    if (!existing) return;

    const dupId = `${existing.type}-${Date.now().toString().slice(-4)}`;
    const duplicatedNode: NetworkNode = {
      ...existing,
      id: dupId,
      label: `${existing.label} (Copy)`,
      position: { x: existing.position.x + 30, y: existing.position.y + 30 },
      network: existing.network
        ? {
            ...existing.network,
            ip: `192.168.1.${Math.floor(Math.random() * 80) + 100}`,
          }
        : undefined,
      status: 'green',
      faults: [],
    };

    setNodes((prev) => [...prev, duplicatedNode]);
    setSelectedNodeId(dupId);
    setSelectedCableId(null);
  };

  // Add Structure Block
  const handleAddStructure = (type: string, label: string) => {
    const newStructure: Structure = {
      id: `bldg-${Date.now().toString().slice(-4)}`,
      label,
      type: type as any,
      x: 100 + Math.random() * 60,
      y: 80 + Math.random() * 60,
      width: 360,
      height: 420,
    };
    setStructures((prev) => [...prev, newStructure]);
  };

  // Update Node position (FIXED LENGTH: DOES NOT INCREASE CABLE LENGTH ON DRAG!)
  // PREVENT COVERING THE STRUCTURE TITLE AREA ROW:
  // If an equipment box is moved into a structure, it slides down into the canvas area below the title row!
  const handleUpdateNodePosition = (id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          // Find if node position falls within any structure
          const insideStructure = structures.find(
            (s) =>
              x + 95 >= s.x &&
              x + 95 <= s.x + s.width &&
              y + 20 >= s.y &&
              y <= s.y + s.height
          );

          let adjustedY = y;
          if (insideStructure) {
            // The glowing title row occupies [insideStructure.y, insideStructure.y + 44].
            // If the box overlaps this title row, slide it down to the equipment area!
            if (adjustedY < insideStructure.y + 44) {
              adjustedY = insideStructure.y + 48;
            }
          }

          return {
            ...n,
            position: { x, y: adjustedY },
            structureId: insideStructure ? insideStructure.id : null,
          };
        }
        return n;
      })
    );
  };

  // Update Node properties
  const handleUpdateNode = (id: string, updates: Partial<NetworkNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  // Delete Node
  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setCables((prev) => prev.filter((c) => c.fromNodeId !== id && c.toNodeId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (projectedFix?.targetNodeId === id) setProjectedFix(null);
  };

  // Update Structure (moving a structure also moves the equipment inside it)
  const handleUpdateStructure = (id: string, updates: Partial<Structure>) => {
    const existing = structures.find((s) => s.id === id);
    if (!existing) return;

    const dx = updates.x !== undefined ? updates.x - existing.x : 0;
    const dy = updates.y !== undefined ? updates.y - existing.y : 0;

    setStructures((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));

    if (dx !== 0 || dy !== 0) {
      setNodes((prev) =>
        prev.map((n) => {
          const isInside =
            n.structureId === id ||
            (n.position.x + 95 >= existing.x &&
              n.position.x + 95 <= existing.x + existing.width &&
              n.position.y + 30 >= existing.y &&
              n.position.y <= existing.y + existing.height);

          if (isInside) {
            return {
              ...n,
              structureId: id,
              position: {
                x: n.position.x + dx,
                y: n.position.y + dy,
              },
            };
          }
          return n;
        })
      );
    }
  };

  // Group movement: Move structure together with all equipment nodes inside it
  const handleMoveStructureWithNodes = (
    structureId: string,
    newX: number,
    newY: number,
    nodePositions: { id: string; x: number; y: number }[]
  ) => {
    setStructures((prev) =>
      prev.map((s) => (s.id === structureId ? { ...s, x: newX, y: newY } : s))
    );

    if (nodePositions && nodePositions.length > 0) {
      const posMap = new Map(nodePositions.map((np) => [np.id, np]));
      setNodes((prev) =>
        prev.map((n) => {
          const updated = posMap.get(n.id);
          if (updated) {
            return {
              ...n,
              structureId,
              position: { x: updated.x, y: updated.y },
            };
          }
          return n;
        })
      );
    }
  };

  // Delete Structure
  const handleDeleteStructure = (id: string) => {
    setStructures((prev) => prev.filter((s) => s.id !== id));
  };

  // Add Cable Run (Typed default length, does NOT auto-increase when boxes move)
  const handleAddCable = (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string,
    type: CableType,
    lengthMeters?: number
  ) => {
    const duplicate = cables.some(
      (c) =>
        (c.fromNodeId === fromNodeId &&
          c.fromPortId === fromPortId &&
          c.toNodeId === toNodeId &&
          c.toPortId === toPortId) ||
        (c.fromNodeId === toNodeId &&
          c.fromPortId === toPortId &&
          c.toNodeId === fromNodeId &&
          c.toPortId === fromPortId)
    );
    if (duplicate) return;

    const initialLength = lengthMeters || (type === 'ac_power' ? 2 : type === 'grounding' ? 3 : 15);

    const newCable: CableRun = {
      id: `cable-${Date.now().toString().slice(-4)}`,
      type,
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId,
      lengthMeters: initialLength,
      status: 'green',
      faults: [],
    };

    setCables((prev) => [...prev, newCable]);
    setSelectedCableId(newCable.id);
    setSelectedNodeId(null);
  };

  // Update Cable properties (typed length, type)
  const handleUpdateCable = (id: string, updates: Partial<CableRun>) => {
    setCables((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Delete Cable
  const handleDeleteCable = (id: string) => {
    setCables((prev) => prev.filter((c) => c.id !== id));
    if (selectedCableId === id) setSelectedCableId(null);
  };

  // Trigger error auto-fix recommendation projection
  const handleTriggerErrorFix = (faultCode: string, targetId: string) => {
    setSelectedNodeId(targetId);
    setSelectedCableId(null);

    const fix = findRecommendedFix(faultCode, targetId, nodes, cables);
    if (fix) {
      setProjectedFix(fix);
    }
  };

  // Apply projected recommendation fix
  const handleApplyProjectedFix = () => {
    if (!projectedFix) return;

    if (projectedFix.fixType === 'cable' && projectedFix.fromNodeId && projectedFix.toNodeId) {
      handleAddCable(
        projectedFix.fromNodeId,
        projectedFix.fromPortId || 'poe1',
        projectedFix.toNodeId,
        projectedFix.toPortId || 'poe_in',
        projectedFix.cableType,
        15
      );
      setProjectedFix(null);
    } else if (projectedFix.fixType === 'ip' && projectedFix.newIpConfig) {
      handleUpdateNode(projectedFix.targetNodeId, {
        network: {
          ip: projectedFix.newIpConfig.ip,
          subnet: projectedFix.newIpConfig.subnet,
          gateway: projectedFix.newIpConfig.gateway,
          isDhcp: false,
        },
      });
      setProjectedFix(null);
    } else if (projectedFix.fixType === 'ground_certify') {
      handleUpdateNode(projectedFix.targetNodeId, {
        groundingCertified: true,
      });
      setProjectedFix(null);
    }
  };

  // Quick Save Project (If not saved once or default name, opens Save Project naming modal)
  const handleSaveProjectQuick = () => {
    const isDefaultOrUntitled =
      !hasBeenSavedOnce ||
      projectName === 'TEPBIZ Enterprise Network' ||
      projectName === 'New Clean TEPBIZ Canvas' ||
      projectName.toLowerCase().includes('untitled');

    if (isDefaultOrUntitled) {
      // Detected not saved with a custom project name: open Save Project naming modal!
      setIsSaveProjectModalOpen(true);
      return;
    }

    const existing = getSavedProjectsFromStorage();
    const now = new Date().toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const index = existing.findIndex((p) => p.name.toLowerCase() === projectName.toLowerCase());
    let updated: SavedProject[];

    if (index >= 0) {
      updated = [...existing];
      updated[index] = {
        ...updated[index],
        updatedAt: now,
        structures,
        nodes,
        cables,
      };
    } else {
      const newP: SavedProject = {
        id: `proj-${Date.now()}`,
        name: projectName,
        updatedAt: now,
        structures,
        nodes,
        cables,
      };
      updated = [newP, ...existing];
    }

    saveProjectsToStorage(updated);
    setHasBeenSavedOnce(true);
  };

  // Called when SaveProjectModal completes successfully
  const handleSaveSuccessFromModal = (newName: string) => {
    setProjectName(newName);
    setHasBeenSavedOnce(true);

    const existing = getSavedProjectsFromStorage();
    const now = new Date().toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const index = existing.findIndex((p) => p.name.toLowerCase() === newName.toLowerCase());
    let updated: SavedProject[];

    if (index >= 0) {
      updated = [...existing];
      updated[index] = {
        ...updated[index],
        updatedAt: now,
        structures,
        nodes,
        cables,
      };
    } else {
      const newP: SavedProject = {
        id: `proj-${Date.now()}`,
        name: newName,
        updatedAt: now,
        structures,
        nodes,
        cables,
      };
      updated = [newP, ...existing];
    }

    saveProjectsToStorage(updated);
  };

  // Load Saved Project
  const handleLoadSavedProject = (project: SavedProject) => {
    setStructures(project.structures);
    setNodes(project.nodes);
    setCables((project.cables || []).filter((c) => c.type !== 'grounding'));
    setProjectName(project.name);
    setHasBeenSavedOnce(true);
    setSelectedNodeId(null);
    setSelectedCableId(null);
    setProjectedFix(null);
  };

  // New Clean Project button click handler (Prompts with in-app modal if existing boxes present)
  const handleNewProjectClean = () => {
    if (nodes.length > 0 || structures.length > 0) {
      setIsNewProjectModalOpen(true);
    } else {
      setStructures([]);
      setNodes([]);
      setCables([]);
      setProjectName('Untitled Network Project');
      setHasBeenSavedOnce(false);
      setSelectedNodeId(null);
      setSelectedCableId(null);
      setProjectedFix(null);
      setMode('design');
    }
  };

  // NewProjectModal: Save current & create new clean canvas
  const handleSaveAndCreateNew = (saveAsName: string) => {
    const existing = getSavedProjectsFromStorage();
    const now = new Date().toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newP: SavedProject = {
      id: `proj-${Date.now()}`,
      name: saveAsName,
      updatedAt: now,
      structures,
      nodes,
      cables,
    };
    saveProjectsToStorage([newP, ...existing.filter((p) => p.name !== saveAsName)]);

    // Start fresh clean canvas
    setStructures([]);
    setNodes([]);
    setCables([]);
    setProjectName('Untitled Network Project');
    setHasBeenSavedOnce(false);
    setSelectedNodeId(null);
    setSelectedCableId(null);
    setProjectedFix(null);
    setMode('design');
    setIsNewProjectModalOpen(false);
  };

  // NewProjectModal: Discard unsaved changes & start clean canvas
  const handleDiscardAndCreateNew = () => {
    setStructures([]);
    setNodes([]);
    setCables([]);
    setProjectName('Untitled Network Project');
    setHasBeenSavedOnce(false);
    setSelectedNodeId(null);
    setSelectedCableId(null);
    setProjectedFix(null);
    setMode('design');
    setIsNewProjectModalOpen(false);
  };

  // Load Preset
  const handleLoadPreset = (preset: PresetTopology) => {
    setStructures(preset.structures);
    setNodes(preset.nodes);
    setCables((preset.cables || []).filter((c) => c.type !== 'grounding'));
    setProjectName(preset.name);
    setSelectedNodeId(null);
    setSelectedCableId(null);
    setProjectedFix(null);
  };

  // Save Project JSON
  const handleExportJson = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      projectName,
      structures,
      nodes,
      cables,
    };
    downloadFile(
      `TEPBIZ_Network_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  // Load Project JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.structures && json.nodes && json.cables) {
          setStructures(json.structures);
          setNodes(json.nodes);
          setCables((json.cables as CableRun[]).filter((c) => c.type !== 'grounding'));
          if (json.projectName) setProjectName(json.projectName);
          setSelectedNodeId(null);
          setSelectedCableId(null);
          setProjectedFix(null);
        }
      } catch (err) {
        console.error('Failed to parse project JSON:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans select-none ${
      canvasTheme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* 1. Top Navigation Bar */}
      <TopBar
        mode={mode}
        setMode={handleSetMode}
        summary={summary}
        canvasTheme={canvasTheme}
        onToggleCanvasTheme={() => setCanvasTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onLoadPreset={handleLoadPreset}
        onAddStructure={handleAddStructure}
        onOpenBom={() => setIsBomOpen(true)}
        onOpenIpPlan={() => setIsIpPlanOpen(true)}
        onOpenSiteSurvey={() => setIsSiteSurveyOpen(true)}
        onOpenAiAssistant={() => setRightTab('assistant')}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onNewProjectClean={handleNewProjectClean}
        onSaveProjectQuick={handleSaveProjectQuick}
        projectName={projectName}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Equipment Library */}
        <EquipmentLibrary
          onAddEquipment={handleAddEquipment}
          onAddStructure={handleAddStructure}
          mode={mode}
        />

        {/* Center: Network Interactive Canvas */}
        <NetworkCanvas
          nodes={activeNodes}
          structures={structures}
          cables={activeCables}
          mode={mode}
          canvasTheme={canvasTheme}
          onToggleCanvasTheme={() => setCanvasTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          selectedNodeId={selectedNodeId}
          selectedCableId={selectedCableId}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            if (id) {
              setSelectedCableId(null);
              setRightTab('inspector');
            }
          }}
          onSelectCable={(id) => {
            setSelectedCableId(id);
            if (id) {
              setSelectedNodeId(null);
              setRightTab('inspector');
            }
          }}
          onUpdateNodePosition={handleUpdateNodePosition}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onUpdateStructure={handleUpdateStructure}
          onMoveStructureWithNodes={handleMoveStructureWithNodes}
          onDeleteStructure={handleDeleteStructure}
          onAddCable={handleAddCable}
          onUpdateCable={handleUpdateCable}
          onDeleteCable={handleDeleteCable}
          onOpenDiagnosisForNode={(nodeId) => {
            setSelectedNodeId(nodeId);
            setRightTab('assistant');
          }}
          onAddStructureQuick={() => handleAddStructure('generic', 'New Facility')}
          projectedFix={projectedFix}
          onApplyProjectedFix={handleApplyProjectedFix}
          onDismissProjectedFix={() => setProjectedFix(null)}
        />

        {/* Right Sidebar: Inspector & AI Assistant */}
        <aside className="w-84 border-l border-slate-800 bg-slate-950 flex flex-col h-full shrink-0 z-30">
          <div className="flex items-center border-b border-slate-800 bg-slate-900/80 p-1">
            <button
              onClick={() => setRightTab('inspector')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                rightTab === 'inspector'
                  ? 'bg-slate-800 text-sky-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>

            <button
              onClick={() => setRightTab('assistant')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                rightTab === 'assistant'
                  ? 'bg-slate-800 text-sky-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Specialist</span>
              {summary.redCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {summary.redCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {rightTab === 'inspector' ? (
              <InspectorPanel
                selectedNode={selectedNode}
                selectedCable={selectedCable}
                allNodes={activeNodes}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={handleDeleteNode}
                onUpdateCable={handleUpdateCable}
                onDeleteCable={handleDeleteCable}
                onOpenAiAssistantWithFault={(node) => {
                  setSelectedNodeId(node.id);
                  setRightTab('assistant');
                  if (node.faults.length > 0) {
                    handleTriggerErrorFix(node.faults[0].code, node.id);
                  }
                }}
                mode={mode}
              />
            ) : (
              <AiAssistantPanel
                summary={summary}
                selectedNode={selectedNode}
                nodes={activeNodes}
                cables={activeCables}
                structures={structures}
                onSelectNodeById={(id) => {
                  setSelectedNodeId(id);
                  setSelectedCableId(null);
                }}
                onTriggerErrorFix={handleTriggerErrorFix}
              />
            )}
          </div>
        </aside>
      </div>

      {/* 3. Export & Documentation Modals */}
      <SiteSurveyModal
        isOpen={isSiteSurveyOpen}
        onClose={() => setIsSiteSurveyOpen(false)}
        nodes={activeNodes}
        structures={structures}
        cables={activeCables}
        summary={summary}
      />

      <BomModal
        isOpen={isBomOpen}
        onClose={() => setIsBomOpen(false)}
        nodes={activeNodes}
        cables={activeCables}
      />

      <IpPlanModal
        isOpen={isIpPlanOpen}
        onClose={() => setIsIpPlanOpen(false)}
        nodes={activeNodes}
        structures={structures}
      />

      {/* 4. Project Manager Modal (Save & Continue, New Project, Load) */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        currentStructures={structures}
        currentNodes={nodes}
        currentCables={cables}
        currentProjectName={projectName}
        setCurrentProjectName={setProjectName}
        onLoadProject={handleLoadSavedProject}
        onNewCleanProject={handleNewProjectClean}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* 5. New Project Prompt Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        currentProjectName={projectName}
        nodeCount={nodes.length}
        cableCount={cables.length}
        structureCount={structures.length}
        onSaveAndCreateNew={handleSaveAndCreateNew}
        onDiscardAndCreateNew={handleDiscardAndCreateNew}
      />

      {/* 6. Save Project / Label Name Modal */}
      <SaveProjectModal
        isOpen={isSaveProjectModalOpen}
        onClose={() => setIsSaveProjectModalOpen(false)}
        currentProjectName={projectName}
        structures={structures}
        nodes={nodes}
        cables={cables}
        onSaveSuccess={handleSaveSuccessFromModal}
      />
    </div>
  );
}
