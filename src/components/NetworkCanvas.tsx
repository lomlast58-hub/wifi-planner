import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Zap,
  Globe,
  Server,
  Wifi,
  Radio,
  Shield,
  Laptop,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GripHorizontal,
  X,
  Settings,
  Copy,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { CableRun, CableType, NetworkNode, PortType, Structure } from '../types/network';
import { EQUIPMENT_CATALOG, CABLE_DEFINITIONS } from '../constants/equipmentDefinitions';
import { ProjectedFix } from '../utils/autoFixEngine';

interface NetworkCanvasProps {
  nodes: NetworkNode[];
  structures: Structure[];
  cables: CableRun[];
  mode: 'design' | 'simulate';
  canvasTheme?: 'dark' | 'light';
  onToggleCanvasTheme?: () => void;
  selectedNodeId: string | null;
  selectedCableId: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectCable: (id: string | null) => void;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onUpdateNode: (id: string, updates: Partial<NetworkNode>) => void;
  onDeleteNode: (id: string) => void;
  onUpdateStructure: (id: string, updates: Partial<Structure>) => void;
  onDeleteStructure: (id: string) => void;
  onAddCable: (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string, type: CableType, lengthMeters?: number) => void;
  onUpdateCable: (id: string, updates: Partial<CableRun>) => void;
  onDeleteCable: (id: string) => void;
  onOpenDiagnosisForNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onAddStructureQuick?: () => void;
  projectedFix: ProjectedFix | null;
  onApplyProjectedFix?: () => void;
  onDismissProjectedFix?: () => void;
}

interface DraggingPortState {
  nodeId: string;
  portId: string;
  portType: PortType;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface VerticalSegment {
  cableId: string;
  x: number;
  yMin: number;
  yMax: number;
}

/**
 * Builds a horizontal SVG path segment with semi-circular upward line hops (bridges)
 * at any intersection with perpendicular vertical segments of other lines, matching
 * electrical and schematic circuit diagram wire jump standards.
 */
function buildHorizontalSegmentWithHops(
  x1: number,
  y: number,
  x2: number,
  currentCableId: string,
  verticalSegments: VerticalSegment[] = [],
  isFirst: boolean = false
): string {
  if (Math.abs(x1 - x2) < 1) return isFirst ? `M ${x1} ${y}` : '';

  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);

  // Find all vertical segments from other lines that cross this horizontal segment
  const intersections: number[] = [];
  for (const v of verticalSegments) {
    if (v.cableId === currentCableId) continue;
    if (v.x > minX + 8 && v.x < maxX - 8 && y > v.yMin + 4 && y < v.yMax - 4) {
      intersections.push(v.x);
    }
  }

  // Sort intersections along line direction
  const dir = x2 > x1 ? 1 : -1;
  intersections.sort((a, b) => (dir > 0 ? a - b : b - a));

  let res = isFirst ? `M ${x1} ${y}` : '';
  let curX = x1;
  const hopR = 5.5;

  for (const ix of intersections) {
    if (Math.abs(ix - curX) < hopR * 2 + 1) continue;

    const hopStart = Math.round(ix - dir * hopR);
    const hopEnd = Math.round(ix + dir * hopR);

    res += ` L ${hopStart} ${y}`;
    // Upward arc bridge (sweep 0 for left-to-right, sweep 1 for right-to-left both arc upward)
    const sweep = dir > 0 ? 0 : 1;
    res += ` A ${hopR} ${hopR} 0 0 ${sweep} ${hopEnd} ${y}`;
    curX = hopEnd;
  }

  res += ` L ${x2} ${y}`;
  return res;
}

/**
 * Generates clean, groomed right-angle straight orthogonal lines (Manhattan routing with 90-degree corners only).
 * From start port: exits horizontally a little bit to the right (turnX),
 * turns 90° vertically straight to destination port range (end.y),
 * then turns 90° horizontally straight into destination port (end.x).
 * Supports schematic line hops over intersecting vertical wires.
 */
function getOrthogonalPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  cableIndex: number = 0,
  cableId: string = 'draft',
  verticalSegments: VerticalSegment[] = []
): { pathData: string; midX: number; midY: number; turnX: number } {
  // 1. Direct horizontal line if ports are on same horizontal line
  if (Math.abs(start.y - end.y) < 2) {
    const pathData = buildHorizontalSegmentWithHops(start.x, start.y, end.x, cableId, verticalSegments, true);
    return {
      pathData,
      midX: Math.round((start.x + end.x) / 2),
      midY: start.y,
      turnX: Math.round((start.x + end.x) / 2),
    };
  }

  // 2. Strictly 90-degree straight lines with deterministic lane offsets:
  // When multiple lines run in parallel, each cable receives its own dedicated corridor (spaced 14px apart)
  const conduitOffset = 24 + ((cableIndex % 5) * 14);
  const turnX = Math.round(Math.max(start.x, end.x) + conduitOffset);

  // Segment 1: Exit horizontal from start port with line hops if crossing another line
  const seg1 = buildHorizontalSegmentWithHops(start.x, start.y, turnX, cableId, verticalSegments, true);

  // Segment 2: Vertical run straight to end.y
  const seg2 = ` L ${turnX} ${end.y}`;

  // Segment 3: Horizontal run straight into destination port with line hops
  const seg3 = buildHorizontalSegmentWithHops(turnX, end.y, end.x, cableId, verticalSegments, false);

  const pathData = `${seg1}${seg2}${seg3}`;

  return {
    pathData,
    midX: turnX,
    midY: Math.round((start.y + end.y) / 2),
    turnX,
  };
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  nodes,
  structures,
  cables,
  mode,
  canvasTheme = 'dark',
  onToggleCanvasTheme,
  selectedNodeId,
  selectedCableId,
  onSelectNode,
  onSelectCable,
  onUpdateNodePosition,
  onUpdateNode,
  onDeleteNode,
  onUpdateStructure,
  onDeleteStructure,
  onAddCable,
  onUpdateCable,
  onDeleteCable,
  onOpenDiagnosisForNode,
  onDuplicateNode,
  onAddStructureQuick,
  projectedFix,
  onApplyProjectedFix,
  onDismissProjectedFix,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Dragging state
  const [draggedNode, setDraggedNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Structure Dragging & Resizing state
  const [draggedStructure, setDraggedStructure] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizingStructure, setResizingStructure] = useState<{ id: string; startWidth: number; startHeight: number; startX: number; startY: number } | null>(null);

  // Cable drawing state
  const [cableDraft, setCableDraft] = useState<DraggingPortState | null>(null);
  const [hoveredPort, setHoveredPort] = useState<{ nodeId: string; portId: string; portType: PortType } | null>(null);
  const [portTooltip, setPortTooltip] = useState<{ text: string; x: number; y: number; valid: boolean } | null>(null);

  // Right-click Context Menus
  const [nodeContextMenu, setNodeContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [cableContextMenu, setCableContextMenu] = useState<{ cableId: string; x: number; y: number } | null>(null);

  // Close context menus on window click
  useEffect(() => {
    const handleGlobalClick = () => {
      setNodeContextMenu(null);
      setCableContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Convert screen coordinates to canvas virtual coordinates
  const screenToCanvas = (screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: screenX, y: screenY };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (screenX - rect.left - pan.x) / zoom;
    const y = (screenY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Determine cable type from port types
  const getCompatibleCableType = (port1: PortType, port2: PortType): CableType | null => {
    if (
      (port1 === 'ac_out' && port2 === 'ac_in') ||
      (port1 === 'ac_in' && port2 === 'ac_out')
    ) {
      return 'ac_power';
    }

    if (port1 === 'fiber_sc' && port2 === 'fiber_sc') {
      return 'fiber';
    }

    if (port1 === 'ground_lug' && port2 === 'ground_lug') {
      return 'grounding';
    }

    const isEth1 = port1 === 'rj45' || port1 === 'rj45_poe_in' || port1 === 'rj45_poe_out';
    const isEth2 = port2 === 'rj45' || port2 === 'rj45_poe_in' || port2 === 'rj45_poe_out';

    if (isEth1 && isEth2) {
      return 'ethernet';
    }

    return null;
  };

  // Port coordinate calculation
  const getPortCoordinates = (nodeId: string, portId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    // Specialized physical horizontal PoE Injector adapter box
    if (node.type === 'poe_injector') {
      if (portId === 'data_in') {
        return { x: node.position.x + 8, y: node.position.y + 44 };
      }
      if (portId === 'poe_out') {
        return { x: node.position.x + 150 - 8, y: node.position.y + 44 };
      }
      if (portId === 'pwr_in') {
        return { x: node.position.x + 150 - 8, y: node.position.y + 76 };
      }
    }

    const spec = EQUIPMENT_CATALOG[node.type];
    const ports = spec?.ports || [];
    const index = ports.findIndex((p) => p.id === portId);

    const nodeWidth = 190;
    const nodeHeaderHeight = 44;
    const portAreaStartY = nodeHeaderHeight + 10;
    const portRowHeight = 22;

    const y = node.position.y + portAreaStartY + (index >= 0 ? index * portRowHeight + 10 : 20);
    const x = node.position.x + nodeWidth - 10;

    return { x, y };
  };

  // Mouse wheel: auto zoom in or out
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    // Scroll up (deltaY < 0) zooms in, Scroll down (deltaY > 0) zooms out
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(2.5, Math.max(0.35, Number((prev + delta).toFixed(2)))));
  };

  // Canvas Mouse down: left-click on empty area, background, or empty box canvas to slide / pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click slides/pans view

    const target = e.target as HTMLElement;

    // Check if clicked element is an interactive object that should not trigger pan
    const isInteractive =
      target.closest('[data-node-id]') ||
      target.closest('[data-structure-header]') ||
      target.closest('[data-structure-resize]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('[data-no-pan]') ||
      target.closest('[data-cable-id]');

    if (isInteractive) {
      return;
    }

    onSelectNode(null);
    onSelectCable(null);
    setNodeContextMenu(null);
    setCableContextMenu(null);
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Window mousemove and mouseup listeners ensure continuous, uninterrupted sliding and dragging
  useEffect(() => {
    if (!isPanning && !draggedNode && !draggedStructure && !resizingStructure && !cableDraft) {
      return;
    }

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const coords = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      };

      // Pan canvas view (slide / adjust canvas at any zoom level)
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      // Drag node (Fixed cable length; protected structure header title area)
      // Clamped so it NEVER enters or merges with the left sidebar!
      if (draggedNode && mode === 'design') {
        let rawX = Math.round((coords.x - draggedNode.offsetX) / 10) * 10;
        let rawY = Math.round((coords.y - draggedNode.offsetY) / 10) * 10;

        // Prevent crossing into left sidebar!
        // On screen: screenX = rect.left + pan.x + rawX * zoom >= rect.left + 16px
        // Therefore: rawX >= (16 - pan.x) / zoom
        const minAllowedX = Math.round((16 - pan.x) / zoom / 10) * 10;
        const minAllowedY = Math.round((16 - pan.y) / zoom / 10) * 10;
        rawX = Math.max(minAllowedX, rawX);
        rawY = Math.max(minAllowedY, rawY);

        // Find if this node position is inside any structure block
        const struct = structures.find(
          (s) =>
            rawX + 95 >= s.x &&
            rawX + 95 <= s.x + s.width &&
            rawY + 30 >= s.y &&
            rawY <= s.y + s.height
        );

        // Structure title area row occupies [struct.y, struct.y + 44].
        if (struct && rawY < struct.y + 44) {
          rawY = struct.y + 48;
        }

        onUpdateNodePosition(draggedNode.id, rawX, rawY);
        return;
      }

      // Drag structure
      // Clamped so it NEVER enters or merges with the left sidebar!
      if (draggedStructure && mode === 'design') {
        let rawX = Math.round((coords.x - draggedStructure.offsetX) / 10) * 10;
        let rawY = Math.round((coords.y - draggedStructure.offsetY) / 10) * 10;

        const minStructX = Math.round((16 - pan.x) / zoom / 10) * 10;
        const minStructY = Math.round((16 - pan.y) / zoom / 10) * 10;
        rawX = Math.max(minStructX, rawX);
        rawY = Math.max(minStructY, rawY);

        onUpdateStructure(draggedStructure.id, {
          x: rawX,
          y: rawY,
        });
        return;
      }

      // Resize structure
      if (resizingStructure && mode === 'design') {
        const newWidth = Math.max(160, Math.round(resizingStructure.startWidth + (coords.x - resizingStructure.startX)));
        const newHeight = Math.max(120, Math.round(resizingStructure.startHeight + (coords.y - resizingStructure.startY)));
        onUpdateStructure(resizingStructure.id, {
          width: newWidth,
          height: newHeight,
        });
        return;
      }

      // Drag cable draft
      if (cableDraft) {
        setCableDraft((prev) =>
          prev
            ? {
                ...prev,
                currentX: coords.x,
                currentY: coords.y,
              }
            : null
        );

        if (hoveredPort && hoveredPort.nodeId !== cableDraft.nodeId) {
          const cableType = getCompatibleCableType(cableDraft.portType, hoveredPort.portType);
          if (cableType) {
            setPortTooltip({
              text: `Compatible: ${CABLE_DEFINITIONS[cableType].name} (Release to connect)`,
              x: coords.x + 15,
              y: coords.y - 10,
              valid: true,
            });
          } else {
            setPortTooltip({
              text: `Incompatible media: Cannot plug ${cableDraft.portType} into ${hoveredPort.portType}!`,
              x: coords.x + 15,
              y: coords.y - 10,
              valid: false,
            });
          }
        } else {
          setPortTooltip(null);
        }
      }
    };

    const handleWindowMouseUp = () => {
      setIsPanning(false);
      setDraggedNode(null);
      setDraggedStructure(null);
      setResizingStructure(null);

      // Finalize cable if dropped on compatible port
      if (cableDraft && hoveredPort && hoveredPort.nodeId !== cableDraft.nodeId) {
        const cableType = getCompatibleCableType(cableDraft.portType, hoveredPort.portType);
        if (cableType) {
          onAddCable(
            cableDraft.nodeId,
            cableDraft.portId,
            hoveredPort.nodeId,
            hoveredPort.portId,
            cableType
          );
        }
      }

      setCableDraft(null);
      setPortTooltip(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [
    isPanning,
    draggedNode,
    draggedStructure,
    resizingStructure,
    cableDraft,
    pan,
    panStart,
    zoom,
    mode,
    structures,
    hoveredPort,
    onUpdateNodePosition,
    onUpdateStructure,
    onAddCable,
  ]);

  // Global mouse move fallback
  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = screenToCanvas(e.clientX, e.clientY);

    // Pan canvas
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // Drag node (Fixed cable length; protected structure header title area)
    if (draggedNode && mode === 'design') {
      let rawX = Math.round((coords.x - draggedNode.offsetX) / 10) * 10;
      let rawY = Math.round((coords.y - draggedNode.offsetY) / 10) * 10;

      const minAllowedX = Math.round((16 - pan.x) / zoom / 10) * 10;
      const minAllowedY = Math.round((16 - pan.y) / zoom / 10) * 10;
      rawX = Math.max(minAllowedX, rawX);
      rawY = Math.max(minAllowedY, rawY);

      // Find if this node position is inside any structure block
      const struct = structures.find(
        (s) =>
          rawX + 95 >= s.x &&
          rawX + 95 <= s.x + s.width &&
          rawY + 30 >= s.y &&
          rawY <= s.y + s.height
      );

      // Structure title area row occupies [struct.y, struct.y + 44].
      if (struct && rawY < struct.y + 44) {
        rawY = struct.y + 48;
      }

      onUpdateNodePosition(draggedNode.id, rawX, rawY);
      return;
    }

    // Drag structure
    if (draggedStructure && mode === 'design') {
      let rawX = Math.round((coords.x - draggedStructure.offsetX) / 10) * 10;
      let rawY = Math.round((coords.y - draggedStructure.offsetY) / 10) * 10;

      const minStructX = Math.round((16 - pan.x) / zoom / 10) * 10;
      const minStructY = Math.round((16 - pan.y) / zoom / 10) * 10;
      rawX = Math.max(minStructX, rawX);
      rawY = Math.max(minStructY, rawY);

      onUpdateStructure(draggedStructure.id, {
        x: rawX,
        y: rawY,
      });
      return;
    }

    // Resize structure
    if (resizingStructure && mode === 'design') {
      const newWidth = Math.max(160, Math.round(resizingStructure.startWidth + (coords.x - resizingStructure.startX)));
      const newHeight = Math.max(120, Math.round(resizingStructure.startHeight + (coords.y - resizingStructure.startY)));
      onUpdateStructure(resizingStructure.id, {
        width: newWidth,
        height: newHeight,
      });
      return;
    }

    // Drag cable draft
    if (cableDraft) {
      setCableDraft({
        ...cableDraft,
        currentX: coords.x,
        currentY: coords.y,
      });

      if (hoveredPort && hoveredPort.nodeId !== cableDraft.nodeId) {
        const cableType = getCompatibleCableType(cableDraft.portType, hoveredPort.portType);
        if (cableType) {
          setPortTooltip({
            text: `Compatible: ${CABLE_DEFINITIONS[cableType].name} (Release to connect)`,
            x: coords.x + 15,
            y: coords.y - 10,
            valid: true,
          });
        } else {
          setPortTooltip({
            text: `Incompatible media: Cannot plug ${cableDraft.portType} into ${hoveredPort.portType}!`,
            x: coords.x + 15,
            y: coords.y - 10,
            valid: false,
          });
        }
      } else {
        setPortTooltip(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
    setDraggedStructure(null);
    setResizingStructure(null);

    // Finalize cable if dropped on compatible port
    if (cableDraft && hoveredPort && hoveredPort.nodeId !== cableDraft.nodeId) {
      const cableType = getCompatibleCableType(cableDraft.portType, hoveredPort.portType);
      if (cableType) {
        onAddCable(
          cableDraft.nodeId,
          cableDraft.portId,
          hoveredPort.nodeId,
          hoveredPort.portId,
          cableType
        );
      }
    }

    setCableDraft(null);
    setPortTooltip(null);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(2.5, Math.max(0.35, Number((prev + delta).toFixed(2)))));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'isp_nap':
      case 'isp_pldt':
      case 'isp_globe':
      case 'isp_converge':
      case 'ont_onu':
      case 'dsl_modem':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'vsat_terminal':
        return <Radio className="w-4 h-4 text-amber-400" />;
      case 'router_firewall':
      case 'core_switch_poe':
      case 'switch_4p_poe':
      case 'switch_16p_poe':
      case 'core_switch_non_poe':
      case 'switch_4p_non_poe':
      case 'switch_16p_non_poe':
      case 'patch_panel':
        return <Server className="w-4 h-4 text-purple-400" />;
      case 'ac_power':
      case 'ups':
      case 'ups_3_socket':
      case 'extension_socket':
      case 'extension_socket_2p':
      case 'extension_socket_3p':
      case 'extension_socket_4p':
      case 'poe_injector':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'surge_arrester':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'outdoor_ap':
      case 'indoor_ap':
      case 'wireless_bridge':
        return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'client_device':
        return <Laptop className="w-4 h-4 text-slate-300" />;
      default:
        return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  // 1. Gather all vertical segments across all cables for line-hop collision checks
  const verticalSegments: VerticalSegment[] = useMemo(() => {
    return cables.map((c, i) => {
      const s = getPortCoordinates(c.fromNodeId, c.fromPortId);
      const e = getPortCoordinates(c.toNodeId, c.toPortId);
      const conduitOffset = 24 + ((i % 5) * 14);
      const tx = Math.round(Math.max(s.x, e.x) + conduitOffset);
      return {
        cableId: c.id,
        x: tx,
        yMin: Math.min(s.y, e.y),
        yMax: Math.max(s.y, e.y),
      };
    });
  }, [cables, nodes]);

  // 2. Compute groomed paths with 90-deg angles, parallel spacing, and line hops
  const cableRoutes = useMemo(() => {
    return cables.map((cable, idx) => {
      const start = getPortCoordinates(cable.fromNodeId, cable.fromPortId);
      const end = getPortCoordinates(cable.toNodeId, cable.toPortId);
      const isSelected = selectedCableId === cable.id;

      const { pathData, midX, midY, turnX } = getOrthogonalPath(
        start,
        end,
        idx,
        cable.id,
        verticalSegments
      );

      const def = CABLE_DEFINITIONS[cable.type] || CABLE_DEFINITIONS.ethernet;
      let strokeColor = def.color;

      if (mode === 'simulate') {
        if (cable.status === 'red') strokeColor = '#ef4444';
        else if (cable.status === 'yellow') strokeColor = '#f59e0b';
        else strokeColor = '#22c55e';
      }

      // Stagger badge Y position so adjacent parallel cables don't overlap badges
      const staggerY = ((idx % 3) - 1) * 26; // -26px, 0px, +26px
      const badgeY = Math.round(midY + staggerY);
      const badgeX = turnX;

      return {
        cable,
        idx,
        start,
        end,
        pathData,
        badgeX,
        badgeY,
        strokeColor,
        def,
        isSelected,
      };
    });
  }, [cables, nodes, selectedCableId, mode, verticalSegments]);

  // Coordinates for projected auto-fix recommendation line
  const projectedCoords = projectedFix?.fromNodeId && projectedFix?.toNodeId
    ? {
        start: getPortCoordinates(projectedFix.fromNodeId, projectedFix.fromPortId || 'poe1'),
        end: getPortCoordinates(projectedFix.toNodeId, projectedFix.toPortId || 'poe_in'),
      }
    : null;

  const isLight = canvasTheme === 'light';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex-1 h-full relative overflow-hidden select-none transition-colors duration-200 ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      } ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
      style={{
        backgroundImage: isLight
          ? `radial-gradient(circle, rgba(14, 116, 144, 0.16) 1px, transparent 1px)`
          : `radial-gradient(circle, rgba(56, 189, 248, 0.08) 1px, transparent 1px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* 0. Projected Fix Recommendation Top Banner */}
      {projectedFix && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-sky-500/80 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="p-1.5 rounded-lg bg-sky-950 border border-sky-600/40 text-sky-400">
            <Sparkles className="w-4 h-4 animate-spin text-sky-300" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-100">{projectedFix.title}</div>
            <div className="text-[11px] text-slate-300">{projectedFix.description}</div>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {projectedFix.fixType !== 'info' && onApplyProjectedFix && (
              <button
                onClick={onApplyProjectedFix}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                {projectedFix.actionText}
              </button>
            )}
            {onDismissProjectedFix && (
              <button
                onClick={onDismissProjectedFix}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss recommendation preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Canvas Viewport Transformer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* 1. Structures Layer (Buildings with Dedicated Glowing Title Area Row) */}
        {structures.map((struct) => (
          <div
            key={struct.id}
            data-structure-id={struct.id}
            style={{
              transform: `translate(${struct.x}px, ${struct.y}px)`,
              width: `${struct.width}px`,
              height: `${struct.height}px`,
            }}
            className={`absolute rounded-2xl border p-0 shadow-xl backdrop-blur-xs transition-colors group ${
              isLight
                ? 'border-slate-300 bg-white/70 shadow-slate-300/40'
                : 'border-slate-800/90 bg-slate-900/35 shadow-black/40'
            }`}
          >
            {/* Dedicated Structure Title Area Row (Glowing Letters, Protected Zone) */}
            <div
              data-structure-header={struct.id}
              onMouseDown={(e) => {
                if (mode === 'simulate') return;
                e.stopPropagation();
                const coords = screenToCanvas(e.clientX, e.clientY);
                setDraggedStructure({
                  id: struct.id,
                  offsetX: coords.x - struct.x,
                  offsetY: coords.y - struct.y,
                });
              }}
              className={`h-11 px-3 rounded-t-2xl border-b flex items-center justify-between cursor-grab active:cursor-grabbing transition-colors ${
                isLight
                  ? 'bg-slate-100/90 border-slate-300/80'
                  : 'bg-slate-950/85 border-cyan-500/30'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <GripHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 shrink-0" />
                
                {/* Glowing Structure Label */}
                <input
                  type="text"
                  value={struct.label}
                  disabled={mode === 'simulate'}
                  onChange={(e) => onUpdateStructure(struct.id, { label: e.target.value })}
                  className={`bg-transparent text-xs font-bold px-1.5 py-0.5 rounded transition-colors focus:outline-none focus:bg-slate-800/60 truncate ${
                    isLight
                      ? 'text-sky-700 drop-shadow-[0_0_6px_rgba(3,105,161,0.35)]'
                      : 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.85)] tracking-wide'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                  Zone
                </span>

                {mode === 'design' && (
                  <button
                    onClick={() => onDeleteStructure(struct.id)}
                    title="Remove structure block"
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Resize handle */}
            {mode === 'design' && (
              <div
                data-structure-resize={struct.id}
                data-no-pan="true"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const coords = screenToCanvas(e.clientX, e.clientY);
                  setResizingStructure({
                    id: struct.id,
                    startWidth: struct.width,
                    startHeight: struct.height,
                    startX: coords.x,
                    startY: coords.y,
                  });
                }}
                className="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-400 hover:text-sky-400"
              >
                <div className="w-2 h-2 border-r-2 border-b-2 border-current rounded-xs" />
              </div>
            )}
          </div>
        ))}

        {/* 2. SVG Cabling Layer (STRAIGHT LINES WITH 90-DEGREE CURVED BENDS) */}
        <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none z-10 overflow-visible">
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.9" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* 2a. All Cable Lines Layer (Paths, Line Hops, Glow & Hover Target) */}
          <g className="cable-lines-layer">
            {cableRoutes.map((cr) => (
              <g
                key={`cable-line-${cr.cable.id}`}
                data-cable-id={cr.cable.id}
                className="pointer-events-auto cursor-pointer group"
                onClick={() => onSelectCable(cr.cable.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCableContextMenu({
                    cableId: cr.cable.id,
                    x: e.clientX,
                    y: e.clientY,
                  });
                  setNodeContextMenu(null);
                }}
              >
                {/* Wide invisible click target */}
                <path
                  d={cr.pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="18"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />

                {/* Main Cable Line (Straight segments with strict 90-deg corners and schematic line hops) */}
                <path
                  d={cr.pathData}
                  fill="none"
                  stroke={cr.strokeColor}
                  strokeWidth={cr.isSelected ? cr.def.strokeWidth + 2 : cr.def.strokeWidth}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeDasharray={
                    mode === 'simulate' && cr.cable.status === 'green' ? '6,6' : cr.def.dashArray
                  }
                  className={
                    mode === 'simulate' && cr.cable.status === 'green'
                      ? 'animate-[dash_1s_linear_infinite]'
                      : ''
                  }
                />
              </g>
            ))}
          </g>

          {/* 2b. Auto-Draw Projected Recommendation Fix Line (90-deg) */}
          {projectedCoords && (() => {
            const { pathData } = getOrthogonalPath(projectedCoords.start, projectedCoords.end, 0);
            return (
              <g className="animate-in fade-in duration-300 pointer-events-none">
                <path
                  d={pathData}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeDasharray="6,6"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  filter="url(#glow-cyan)"
                  className="animate-[dash_0.8s_linear_infinite]"
                />
              </g>
            );
          })()}

          {/* Dynamic Draft Cable while dragging from a port (90-deg) */}
          {cableDraft && (() => {
            const { pathData } = getOrthogonalPath(
              { x: cableDraft.startX, y: cableDraft.startY },
              { x: cableDraft.currentX, y: cableDraft.currentY },
              0
            );
            return (
              <path
                d={pathData}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="4,4"
                strokeLinecap="square"
                strokeLinejoin="miter"
                className="animate-pulse"
              />
            );
          })()}

          {/* 2c. All Cable Length Badges Layer (RENDERED ON TOP OF ALL LINES - NEVER COVERED) */}
          <g className="cable-badges-layer pointer-events-auto">
            {cableRoutes.map((cr) => (
              <g
                key={`cable-badge-${cr.cable.id}`}
                data-cable-id={cr.cable.id}
                transform={`translate(${cr.badgeX}, ${cr.badgeY})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCable(cr.cable.id);
                  setCableContextMenu({
                    cableId: cr.cable.id,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                className="cursor-pointer group select-none"
              >
                {/* High-contrast solid pill badge that completely obscures anything underneath */}
                <rect
                  x="-26"
                  y="-12"
                  width="52"
                  height="24"
                  rx="12"
                  className={`${
                    isLight
                      ? 'fill-white stroke-sky-600 hover:stroke-sky-500 shadow-md'
                      : 'fill-slate-950 stroke-sky-500/90 hover:stroke-cyan-300 shadow-2xl'
                  } transition-all`}
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-bold select-none cursor-pointer ${
                    isLight ? 'fill-sky-900' : 'fill-sky-200'
                  }`}
                >
                  {Math.round(cr.cable.lengthMeters)}m
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* 3. Equipment Nodes Layer (SEMI-TRANSPARENT BOXES so lines connected behind are visible) */}
        {nodes.map((node) => {
          const spec = EQUIPMENT_CATALOG[node.type];
          const isSelected = selectedNodeId === node.id;
          const isRed = mode === 'simulate' && node.status === 'red';
          const isYellow = mode === 'simulate' && node.status === 'yellow';
          const isProjectedTarget = projectedFix?.targetNodeId === node.id;
          const needsGrounding = spec?.isOutdoor || spec?.ports.some((p) => p.type === 'ground_lug');

          // Specialized physical horizontal PoE Injector adapter box with Left & Right ports
          if (node.type === 'poe_injector') {
            const dataInConnected = cables.some(
              (c) => (c.fromNodeId === node.id && c.fromPortId === 'data_in') || (c.toNodeId === node.id && c.toPortId === 'data_in')
            );
            const poeOutConnected = cables.some(
              (c) => (c.fromNodeId === node.id && c.fromPortId === 'poe_out') || (c.toNodeId === node.id && c.toPortId === 'poe_out')
            );
            const pwrConnected = cables.some(
              (c) => (c.fromNodeId === node.id && c.fromPortId === 'pwr_in') || (c.toNodeId === node.id && c.toPortId === 'pwr_in')
            );

            return (
              <div
                key={node.id}
                data-node-id={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                  if (isRed && onOpenDiagnosisForNode) {
                    onOpenDiagnosisForNode(node.id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNodeContextMenu({
                    nodeId: node.id,
                    x: e.clientX,
                    y: e.clientY,
                  });
                  setCableContextMenu(null);
                  onSelectNode(node.id);
                }}
                style={{
                  transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                  width: '150px',
                }}
                className={`absolute rounded-xl border backdrop-blur-md shadow-xl transition-all select-none z-20 ${
                  isLight
                    ? 'bg-white/90 text-slate-900 border-slate-300'
                    : 'bg-slate-900/90 text-slate-100 border-slate-750'
                } ${
                  isProjectedTarget
                    ? 'border-rose-500 ring-4 ring-rose-500/50 shadow-rose-950/80 scale-105 animate-pulse'
                    : isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-sky-950/50'
                    : isRed
                    ? 'border-rose-600/90 ring-2 ring-rose-500/30'
                    : 'hover:border-sky-400/80'
                }`}
              >
                {/* Node Header & Drag Bar */}
                <div
                  data-node-header={node.id}
                  onMouseDown={(e) => {
                    if (mode === 'simulate') return;
                    e.stopPropagation();
                    const coords = screenToCanvas(e.clientX, e.clientY);
                    setDraggedNode({
                      id: node.id,
                      offsetX: coords.x - node.position.x,
                      offsetY: coords.y - node.position.y,
                    });
                    onSelectNode(node.id);
                  }}
                  className={`p-1.5 px-2 rounded-t-xl border-b flex items-center justify-between cursor-grab active:cursor-grabbing ${
                    isRed
                      ? 'bg-rose-950/50 border-rose-800/60'
                      : isLight
                      ? 'bg-slate-100/90 border-slate-200'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className={`text-[11px] font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      PoE Injector
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {mode === 'simulate' ? (
                      <div>
                        {isRed ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse cursor-pointer" />
                        ) : isYellow ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNode(node.id);
                        }}
                        title="Delete equipment"
                        className="w-3.5 h-3.5 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-[9px] font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Body: Left (Data In) <---> Right (PoE Out) */}
                <div className="p-2 space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    {/* Left Port: Data In */}
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-semibold text-slate-400">DATA IN</span>
                      <div
                        data-no-pan="true"
                        onMouseDown={(e) => {
                          if (mode === 'simulate') return;
                          e.stopPropagation();
                          const coords = screenToCanvas(e.clientX, e.clientY);
                          setCableDraft({
                            nodeId: node.id,
                            portId: 'data_in',
                            portType: 'rj45',
                            startX: coords.x,
                            startY: coords.y,
                            currentX: coords.x,
                            currentY: coords.y,
                          });
                        }}
                        onMouseEnter={() => setHoveredPort({ nodeId: node.id, portId: 'data_in', portType: 'rj45' })}
                        onMouseLeave={() => setHoveredPort(null)}
                        title="Data In (Left Port, from Switch/Router) - Drag to connect"
                        className={`w-3.5 h-3.5 mt-0.5 rounded-full border flex items-center justify-center cursor-crosshair transition-transform hover:scale-125 bg-sky-950 text-sky-400 border-sky-800 ${
                          dataInConnected ? 'ring-2 ring-emerald-500/70' : ''
                        }`}
                      >
                        <div className="w-1 h-1 rounded-full bg-current" />
                      </div>
                    </div>

                    {/* Center 48V LED badge */}
                    <div className="flex flex-col items-center px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-[9px] text-amber-300">
                      <div className="flex items-center gap-0.5 font-mono font-bold">
                        <span>⚡ 48V</span>
                      </div>
                      <span className="text-[8px] text-amber-400/80">INLINE</span>
                    </div>

                    {/* Right Port: PoE Out */}
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-semibold text-sky-400">PoE OUT</span>
                      <div
                        data-no-pan="true"
                        onMouseDown={(e) => {
                          if (mode === 'simulate') return;
                          e.stopPropagation();
                          const coords = screenToCanvas(e.clientX, e.clientY);
                          setCableDraft({
                            nodeId: node.id,
                            portId: 'poe_out',
                            portType: 'rj45_poe_out',
                            startX: coords.x,
                            startY: coords.y,
                            currentX: coords.x,
                            currentY: coords.y,
                          });
                        }}
                        onMouseEnter={() => setHoveredPort({ nodeId: node.id, portId: 'poe_out', portType: 'rj45_poe_out' })}
                        onMouseLeave={() => setHoveredPort(null)}
                        title="PoE Out (Right Port, with inline 48V power to AP) - Drag to connect"
                        className={`w-3.5 h-3.5 mt-0.5 rounded-full border flex items-center justify-center cursor-crosshair transition-transform hover:scale-125 bg-amber-950 text-amber-400 border-amber-800 ${
                          poeOutConnected ? 'ring-2 ring-emerald-500/70' : ''
                        }`}
                      >
                        <div className="w-1 h-1 rounded-full bg-current" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom: 220V AC Power In */}
                  <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[9px]">
                    <span className="text-slate-400">220V AC Power:</span>
                    <div
                      data-no-pan="true"
                      onMouseDown={(e) => {
                        if (mode === 'simulate') return;
                        e.stopPropagation();
                        const coords = screenToCanvas(e.clientX, e.clientY);
                        setCableDraft({
                          nodeId: node.id,
                          portId: 'pwr_in',
                          portType: 'ac_in',
                          startX: coords.x,
                          startY: coords.y,
                          currentX: coords.x,
                          currentY: coords.y,
                        });
                      }}
                      onMouseEnter={() => setHoveredPort({ nodeId: node.id, portId: 'pwr_in', portType: 'ac_in' })}
                      onMouseLeave={() => setHoveredPort(null)}
                      title="AC Power In (220V from Mains/UPS) - Drag to connect"
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center cursor-crosshair transition-transform hover:scale-125 bg-rose-950 text-rose-400 border-rose-800 ${
                        pwrConnected ? 'ring-2 ring-emerald-500/70' : ''
                      }`}
                    >
                      <div className="w-1 h-1 rounded-full bg-current" />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={node.id}
              data-node-id={node.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node.id);
                if (isRed && onOpenDiagnosisForNode) {
                  onOpenDiagnosisForNode(node.id);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setNodeContextMenu({
                  nodeId: node.id,
                  x: e.clientX,
                  y: e.clientY,
                });
                setCableContextMenu(null);
                onSelectNode(node.id);
              }}
              style={{
                transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                width: '190px',
              }}
              className={`absolute rounded-xl border backdrop-blur-md shadow-xl transition-all select-none z-20 ${
                isLight
                  ? 'bg-white/85 text-slate-900 border-slate-300'
                  : 'bg-slate-900/80 text-slate-100 border-slate-750'
              } ${
                isProjectedTarget
                  ? 'border-rose-500 ring-4 ring-rose-500/50 shadow-rose-950/80 scale-105 animate-pulse'
                  : isSelected
                  ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-sky-950/50'
                  : isRed
                  ? 'border-rose-600/90 ring-2 ring-rose-500/30'
                  : 'hover:border-sky-400/80'
              }`}
            >
              {/* Node Header & Drag Bar */}
              <div
                data-node-header={node.id}
                onMouseDown={(e) => {
                  if (mode === 'simulate') return;
                  e.stopPropagation();
                  const coords = screenToCanvas(e.clientX, e.clientY);
                  setDraggedNode({
                    id: node.id,
                    offsetX: coords.x - node.position.x,
                    offsetY: coords.y - node.position.y,
                  });
                  onSelectNode(node.id);
                }}
                className={`p-2.5 rounded-t-xl border-b flex items-center justify-between cursor-grab active:cursor-grabbing ${
                  isRed
                    ? 'bg-rose-950/50 border-rose-800/60'
                    : isLight
                    ? 'bg-slate-100/90 border-slate-200'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  {getNodeIcon(node.type)}
                  <span className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {node.label}
                  </span>
                </div>

                {/* Right controls on node header */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {mode === 'simulate' ? (
                    <div
                      className="flex items-center"
                      title={
                        isRed
                          ? 'Click to view fault explanation in AI Specialist'
                          : isYellow
                          ? 'Warning / Near Capacity'
                          : 'Operational / Nominal'
                      }
                    >
                      {isRed ? (
                        <XCircle className="w-4 h-4 text-rose-500 animate-pulse cursor-pointer" />
                      ) : isYellow ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                      title="Delete equipment"
                      className="w-4 h-4 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Node Details (IP, Grounding quick toggle, Ports) */}
              <div className="p-2 space-y-1.5 text-[11px]">
                {node.network?.ip && (
                  <div className={`flex items-center justify-between font-mono text-[10px] px-2 py-0.5 rounded border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}>
                    <span className="text-slate-400">IP</span>
                    <span className="font-semibold text-sky-400">{node.network.ip}</span>
                  </div>
                )}

                {/* Grounding terminal quick fix badge */}
                {needsGrounding && (
                  <div className="pt-0.5">
                    {node.groundingCertified ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateNode(node.id, { groundingCertified: false });
                        }}
                        title="Grounding Certified Bonded. Click to toggle."
                        className="w-full text-[10px] text-emerald-400 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 px-1.5 py-0.5 rounded flex items-center justify-between font-medium transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Ground: Fixed ✓</span>
                        </span>
                        <span className="text-[9px] text-emerald-300/70">Certified</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateNode(node.id, { groundingCertified: true });
                        }}
                        title="Outdoor ground missing! Click to mark grounding as installed & certified"
                        className="w-full text-[10px] text-amber-400 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 px-1.5 py-0.5 rounded flex items-center justify-between font-medium transition-colors animate-pulse"
                      >
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Fix Ground ✕</span>
                        </span>
                        <span className="text-[9px] underline">Click to Fix</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Ports List & Connect Sockets */}
                <div className="pt-1 space-y-1">
                  {spec?.ports.map((port) => {
                    const isPortConnected = cables.some(
                      (c) =>
                        (c.fromNodeId === node.id && c.fromPortId === port.id) ||
                        (c.toNodeId === node.id && c.toPortId === port.id)
                    );

                    let portBadgeColor = 'bg-sky-950 text-sky-400 border-sky-800';
                    if (port.type === 'ac_in' || port.type === 'ac_out') {
                      portBadgeColor = 'bg-rose-950 text-rose-400 border-rose-800';
                    } else if (port.type === 'fiber_sc') {
                      portBadgeColor = 'bg-amber-950 text-amber-400 border-amber-800';
                    } else if (port.type === 'ground_lug') {
                      portBadgeColor = 'bg-emerald-950 text-emerald-400 border-emerald-800';
                    }

                    return (
                      <div
                        key={port.id}
                        className={`flex items-center justify-between text-[10px] py-0.5 px-1 rounded transition-colors ${
                          isLight ? 'hover:bg-slate-200/60 text-slate-700' : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <span className="truncate pr-1">{port.name}</span>

                        <div
                          data-no-pan="true"
                          onMouseDown={(e) => {
                            if (mode === 'simulate') return;
                            e.stopPropagation();
                            const coords = screenToCanvas(e.clientX, e.clientY);
                            setCableDraft({
                              nodeId: node.id,
                              portId: port.id,
                              portType: port.type,
                              startX: coords.x,
                              startY: coords.y,
                              currentX: coords.x,
                              currentY: coords.y,
                            });
                          }}
                          onMouseEnter={() => {
                            setHoveredPort({
                              nodeId: node.id,
                              portId: port.id,
                              portType: port.type,
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredPort(null);
                          }}
                          title={`Port: ${port.name} (${port.type}) - Drag to connect`}
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center cursor-crosshair transition-transform hover:scale-125 ${portBadgeColor} ${
                            isPortConnected ? 'ring-2 ring-emerald-500/70 ring-offset-1 ring-offset-slate-900' : ''
                          }`}
                        >
                          <div className="w-1 h-1 rounded-full bg-current" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Port Compatibility Tooltip */}
      {portTooltip && (
        <div
          style={{
            position: 'absolute',
            left: `${portTooltip.x * zoom + pan.x}px`,
            top: `${portTooltip.y * zoom + pan.y}px`,
          }}
          className={`pointer-events-none z-50 text-xs px-2.5 py-1.5 rounded-lg shadow-2xl border font-medium ${
            portTooltip.valid
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80'
              : 'bg-rose-950/90 text-rose-200 border-rose-700/80'
          }`}
        >
          {portTooltip.text}
        </div>
      )}

      {/* Node Right-Click Context Menu */}
      {nodeContextMenu && (() => {
        const clickedNode = nodes.find((n) => n.id === nodeContextMenu.nodeId);
        const spec = clickedNode ? EQUIPMENT_CATALOG[clickedNode.type] : null;
        const needsGrounding = spec?.isOutdoor || spec?.ports.some((p) => p.type === 'ground_lug');

        return (
          <div
            style={{ top: nodeContextMenu.y, left: nodeContextMenu.x }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 text-xs text-slate-200 space-y-1 animate-in fade-in duration-100"
          >
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              {clickedNode?.label || 'Device Settings'}
            </div>
            <button
              onClick={() => {
                onSelectNode(nodeContextMenu.nodeId);
                setNodeContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2"
            >
              <Settings className="w-3.5 h-3.5 text-sky-400" />
              <span>Open Inspector / IP Config</span>
            </button>

            {needsGrounding && clickedNode && (
              <button
                onClick={() => {
                  onUpdateNode(clickedNode.id, {
                    groundingCertified: !clickedNode.groundingCertified,
                  });
                  setNodeContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-emerald-300"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {clickedNode.groundingCertified ? 'Remove Ground Certification' : 'Mark Grounding Certified/Fixed'}
                </span>
              </button>
            )}

            {onDuplicateNode && (
              <button
                onClick={() => {
                  onDuplicateNode(nodeContextMenu.nodeId);
                  setNodeContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-purple-400" />
                <span>Duplicate Device</span>
              </button>
            )}
            <div className="my-1 border-t border-slate-800/80" />
            <button
              onClick={() => {
                onDeleteNode(nodeContextMenu.nodeId);
                setNodeContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/60 text-rose-400 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Device</span>
            </button>
          </div>
        );
      })()}

      {/* Cable Right-Click Context Menu */}
      {cableContextMenu && (
        <div
          style={{ top: cableContextMenu.y, left: cableContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 text-xs text-slate-200 space-y-3 animate-in fade-in duration-100"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Cable Settings
            </span>
            <button
              onClick={() => setCableContextMenu(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Type Cable Length */}
          {(() => {
            const cable = cables.find((c) => c.id === cableContextMenu.cableId);
            if (!cable) return null;

            return (
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-medium block">
                  Cable Length (meters)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    defaultValue={Math.round(cable.lengthMeters)}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 2);
                      onUpdateCable(cable.id, { lengthMeters: val });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">meters</span>
                </div>
              </div>
            );
          })()}

          {/* Switch Cable Wire Type */}
          {(() => {
            const cable = cables.find((c) => c.id === cableContextMenu.cableId);
            if (!cable) return null;

            return (
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-medium block">
                  Change Wire Type
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['ethernet', 'fiber', 'ac_power', 'grounding'] as CableType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        onUpdateCable(cable.id, { type: t });
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors text-left truncate ${
                        cable.type === t
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {t === 'ethernet'
                        ? 'Cat6 LAN'
                        : t === 'fiber'
                        ? 'Fiber Optic'
                        : t === 'ac_power'
                        ? '220V AC'
                        : 'Grounding'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          <button
            onClick={() => {
              onDeleteCable(cableContextMenu.cableId);
              setCableContextMenu(null);
            }}
            className="w-full py-1.5 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Remove Cable</span>
          </button>
        </div>
      )}

      {/* BOTTOM CONTROL TOOLBAR: Viewport Controls + CABLE ROW BAR IN LINE WITH ZOOM ROW */}
      <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none gap-3">
        {/* Left: Viewport HUD Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-2xl">
          <button
            onClick={() => handleZoom(0.1)}
            title="Zoom In (or scroll mouse wheel up)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-medium text-slate-300 px-1 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(-0.1)}
            title="Zoom Out (or scroll mouse wheel down)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 my-auto" />
          <button
            onClick={handleResetView}
            title="Reset View"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Canvas Theme Toggle */}
          {onToggleCanvasTheme && (
            <>
              <div className="w-px h-4 bg-slate-800 my-auto" />
              <button
                onClick={onToggleCanvasTheme}
                title={`Switch Canvas: Current is ${isLight ? 'White Paper' : 'Dark Blueprint'}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white transition-colors text-xs font-medium"
              >
                {isLight ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-sky-300" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>White</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Quick Add Structure Button */}
          {onAddStructureQuick && (
            <>
              <div className="w-px h-4 bg-slate-800 my-auto" />
              <button
                onClick={onAddStructureQuick}
                title="Add New Structure / Building"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors text-xs font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Structure</span>
              </button>
            </>
          )}
        </div>

        {/* Right: CABLE ROW BAR (IN LINE WITH ZOOM ROW AT BOTTOM) */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl shadow-2xl text-[11px]">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cables:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-500 rounded" />
            <span className="text-slate-300 font-medium">220V AC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-400 rounded" />
            <span className="text-slate-300 font-medium">Cat6 LAN</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400 rounded" />
            <span className="text-slate-300 font-medium">Fiber Optic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-emerald-400" />
            <span className="text-slate-300 font-medium">Grounding</span>
          </div>
        </div>
      </div>
    </div>
  );
};
