import React from 'react';
import {
  Trash2,
  Zap,
  Globe,
  Server,
  Wifi,
  Radio,
  Shield,
  Laptop,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  CheckSquare,
  Square,
  ShieldCheck,
  MousePointerClick,
  Layers,
} from 'lucide-react';
import { CableRun, NetworkNode } from '../types/network';
import { EQUIPMENT_CATALOG, CABLE_DEFINITIONS } from '../constants/equipmentDefinitions';
import { areInSameSubnet, getSubnetDetails, isValidIPv4, isValidSubnetMask } from '../utils/ipUtils';

interface InspectorPanelProps {
  selectedNode: NetworkNode | null;
  selectedCable: CableRun | null;
  allNodes: NetworkNode[];
  onUpdateNode: (id: string, updates: Partial<NetworkNode>) => void;
  onDeleteNode: (id: string) => void;
  onUpdateCable: (id: string, updates: Partial<CableRun>) => void;
  onDeleteCable: (id: string) => void;
  onOpenAiAssistantWithFault: (node: NetworkNode) => void;
  mode: 'design' | 'simulate';
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedNode,
  selectedCable,
  allNodes,
  onUpdateNode,
  onDeleteNode,
  onUpdateCable,
  onDeleteCable,
  onOpenAiAssistantWithFault,
  mode,
}) => {
  if (!selectedNode && !selectedCable) {
    return (
      <div className="p-4 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full space-y-2 select-none">
        <Info className="w-6 h-6 text-slate-500" />
        <p className="font-medium text-slate-400">No element selected</p>
        <p className="text-[11px] text-slate-500 max-w-[200px]">
          Click any equipment box or cable on the canvas to inspect and configure.
        </p>
      </div>
    );
  }

  // 1. Cable selected view
  if (selectedCable) {
    const fromNode = allNodes.find((n) => n.id === selectedCable.fromNodeId);
    const toNode = allNodes.find((n) => n.id === selectedCable.toNodeId);
    const def = CABLE_DEFINITIONS[selectedCable.type];

    return (
      <div className="p-4 space-y-4 text-slate-200 text-xs overflow-y-auto h-full select-none">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-100">{def?.name || 'Cable Run'}</div>
            <div className="text-[10px] text-slate-400 font-mono capitalize">{selectedCable.type}</div>
          </div>
          <button
            onClick={() => onDeleteCable(selectedCable.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Delete cable"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cable Connection Endpoints */}
        <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Connected Endpoints
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-medium text-slate-300 truncate max-w-[100px]">
              {fromNode?.label || 'Unknown'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-medium text-slate-300 truncate max-w-[100px]">
              {toNode?.label || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Port: {selectedCable.fromPortId}</span>
            <span>Port: {selectedCable.toPortId}</span>
          </div>
        </div>

        {/* Cable Length (TYPED DIRECTLY + SLIDER) */}
        <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Cable Length (meters)
            </span>
            <span className="text-[10px] text-slate-400">
              Max: {def?.maxDistanceMeters}m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="10000"
              value={Math.round(selectedCable.lengthMeters)}
              onChange={(e) => {
                const val = Math.max(1, Number(e.target.value) || 2);
                onUpdateCable(selectedCable.id, { lengthMeters: val });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
            />
            <span className="text-xs text-slate-400 font-mono">meters</span>
          </div>

          <input
            type="range"
            min="2"
            max="150"
            value={Math.min(150, Math.round(selectedCable.lengthMeters))}
            onChange={(e) => onUpdateCable(selectedCable.id, { lengthMeters: Number(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />

          {/* Change Wire Type */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Change Cable Wire Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['ethernet', 'fiber', 'ac_power'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdateCable(selectedCable.id, { type: t })}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors text-center truncate ${
                    selectedCable.type === t
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {t === 'ethernet'
                    ? 'Cat6 Ethernet'
                    : t === 'fiber'
                    ? 'Fiber Optic'
                    : '220V AC Power'}
                </button>
              ))}
            </div>
          </div>

          {selectedCable.type === 'ethernet' && selectedCable.lengthMeters > 100 && (
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[11px] flex items-start gap-1.5 mt-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                Cat6 exceeds 100m limit. Severe packet drop expected. Use fiber optic or repeater.
              </span>
            </div>
          )}
        </div>

        {/* Faults if any */}
        {selectedCable.faults.length > 0 && (
          <div className="space-y-2 bg-rose-950/40 p-3 rounded-xl border border-rose-900/60">
            <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
              Cable Faults
            </div>
            {selectedCable.faults.map((f, i) => (
              <div key={i} className="text-[11px] text-rose-200">
                <div className="font-semibold">{f.title}</div>
                <div className="text-[10px] text-rose-300/80 mt-0.5">{f.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!selectedNode) {
    return null;
  }

  // 2. Node selected view
  const spec = EQUIPMENT_CATALOG[selectedNode.type];
  const net = selectedNode.network;
  const isRed = mode === 'simulate' && selectedNode.status === 'red';
  const isYellow = mode === 'simulate' && selectedNode.status === 'yellow';
  const needsGrounding = spec?.isOutdoor || spec?.ports.some((p) => p.type === 'ground_lug');

  const subnetInfo = net ? getSubnetDetails(net.ip, net.subnet) : null;
  const isSameSubnetAsGw = net ? areInSameSubnet(net.ip, net.gateway, net.subnet) : false;

  // Active router Gateway IP
  const routerNode = allNodes.find((n) => n.type === 'router_firewall');
  const activeGatewayIp = routerNode?.network?.ip || '192.168.1.1';
  const gwPrefix = isValidIPv4(activeGatewayIp)
    ? activeGatewayIp.split('.').slice(0, 3).join('.')
    : '192.168.1';

  // Find assigned IPs across nodes to recommend free usable IPs
  const assignedHostIps = new Set<string>();
  allNodes.forEach((n) => {
    if (n.network?.ip && n.id !== selectedNode.id) {
      assignedHostIps.add(n.network.ip.trim());
    }
  });

  // Calculate 3 USABLE RECOMMENDED IPs:
  let freeHostSeq = 10;
  while (assignedHostIps.has(`${gwPrefix}.${freeHostSeq}`) && freeHostSeq < 254) {
    freeHostSeq++;
  }
  const recIp1 = `${gwPrefix}.${freeHostSeq}`;

  let freeHostStatic = 50;
  while (assignedHostIps.has(`${gwPrefix}.${freeHostStatic}`) && freeHostStatic < 254) {
    freeHostStatic++;
  }
  const recIp2 = `${gwPrefix}.${freeHostStatic}`;

  let freeHostClient = 100;
  while (assignedHostIps.has(`${gwPrefix}.${freeHostClient}`) && freeHostClient < 254) {
    freeHostClient++;
  }
  const recIp3 = `${gwPrefix}.${freeHostClient}`;

  const recommendedIps = [
    { label: recIp1, desc: 'Next Free Host' },
    { label: recIp2, desc: 'Static AP Tier' },
    { label: recIp3, desc: 'Client / DHCP Pool' },
  ];

  // 3 USABLE RECOMMENDED SUBNETS:
  const recommendedSubnets = [
    { label: '255.255.255.0', cidr: '/24', desc: 'Standard Enterprise Subnet (254 hosts)' },
    { label: '255.255.254.0', cidr: '/23', desc: 'High Density Zone (510 hosts)' },
    { label: '255.255.0.0', cidr: '/16', desc: 'Enterprise Campus (65,534 hosts)' },
  ];

  // 3 USABLE RECOMMENDED GATEWAYS:
  const recommendedGateways = [
    { label: activeGatewayIp, desc: 'Active Core Router' },
    { label: `${gwPrefix}.254`, desc: 'Secondary Gateway / Switch' },
    { label: '10.0.0.1', desc: 'Enterprise / VLAN 10' },
  ];

  return (
    <div className="p-4 space-y-4 text-slate-200 text-xs overflow-y-auto h-full select-none">
      {/* Header & Label */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div className="space-y-1 flex-1 pr-2">
          <input
            type="text"
            value={selectedNode.label}
            onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:border-sky-500"
          />
          <div className="text-[10px] text-slate-400 font-mono">
            {spec?.name}
          </div>
        </div>

        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          title="Delete equipment"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Network Architectural Role */}
      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-300">Deployment Role: </span>
        {spec?.networkRole || spec?.dictRole || 'Network Infrastructure Hardware'}
      </div>

      {/* Grounding & Lightning Safety (Clickable Grounding Fix / Certification as requested) */}
      {needsGrounding && (
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounding Terminal Status</span>
            </span>
            {selectedNode.groundingCertified ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded font-medium">
                ✓ Certified Fixed
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800 px-1.5 py-0.5 rounded">
                Uncertified / Exposed
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Outdoor equipment requires earth bonding against tropical lightning storms. You can connect a grounding cable or mark it certified if the building is already earth-grounded.
          </p>

          <button
            onClick={() =>
              onUpdateNode(selectedNode.id, {
                groundingCertified: !selectedNode.groundingCertified,
              })
            }
            className={`w-full py-2 px-3 rounded-lg border flex items-center justify-between text-xs font-medium transition-colors ${
              selectedNode.groundingCertified
                ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-200'
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-emerald-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {selectedNode.groundingCertified ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>
                {selectedNode.groundingCertified
                  ? 'Grounding Marked as Installed & Fixed'
                  : 'Click to Mark Grounding as Certified Fixed'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Simulation Status & Fault Banner */}
      {isRed && selectedNode.faults.length > 0 && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>Fault Detected</span>
            </span>
            <button
              onClick={() => onOpenAiAssistantWithFault(selectedNode)}
              className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Explain in AI</span>
            </button>
          </div>

          {selectedNode.faults.map((f, i) => (
            <div key={i} className="text-[11px] text-rose-200">
              <div className="font-semibold">{f.title}</div>
              <div className="text-[10px] text-rose-300/90 mt-0.5">{f.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Power Configuration & Meter */}
      <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Electrical &amp; PoE</span>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block">Power Source</span>
            <span className="font-medium text-slate-200 uppercase font-mono">
              {selectedNode.power.source}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block">Wattage Draw</span>
            <span className="font-medium text-slate-200 font-mono">
              {selectedNode.power.wattage || 0}W
            </span>
          </div>
        </div>

        {/* PoE Switch / Injector Budget Meter */}
        {selectedNode.power.poeBudgetWatts && (
          <div className="mt-2 space-y-1 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">PoE Power Budget</span>
              <span className="font-mono text-sky-400 font-medium">
                {selectedNode.metrics?.poeLoadWatts || 0}W / {selectedNode.power.poeBudgetWatts}W
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (selectedNode.metrics?.poeLoadWatts || 0) > selectedNode.power.poeBudgetWatts
                    ? 'bg-rose-500'
                    : 'bg-sky-400'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    ((selectedNode.metrics?.poeLoadWatts || 0) / selectedNode.power.poeBudgetWatts) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Network & IP Addressing Configuration WITH 3 USABLE RECOMMENDATIONS FOR EACH FIELD */}
      {net && (
        <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              IP Addressing Configuration
            </span>

            {/* DHCP Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">DHCP</span>
              <button
                onClick={() =>
                  onUpdateNode(selectedNode.id, {
                    network: { ...net, isDhcp: !net.isDhcp },
                  })
                }
                className={`w-7 h-4 rounded-full transition-colors relative p-0.5 ${
                  net.isDhcp ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    net.isDhcp ? 'translate-x-3' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {net.isDhcp ? (
            <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-900/40 text-[11px] text-sky-300">
              Assigned automatically by core gateway DHCP server pool.
            </div>
          ) : (
            <div className="space-y-3">
              {/* 1. IP Address Field & 3 USABLE RECOMMENDATIONS */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-slate-300">
                    IP Address
                  </label>
                  <span className="text-[9px] text-sky-400 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Pick 1 of 3 usable:</span>
                  </span>
                </div>

                <input
                  type="text"
                  value={net.ip}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      network: { ...net, ip: e.target.value },
                    })
                  }
                  className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none ${
                    isValidIPv4(net.ip) ? 'border-slate-800 focus:border-sky-500' : 'border-rose-600'
                  }`}
                />

                {/* 3 Usable IP Options */}
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  {recommendedIps.map((rec) => (
                    <button
                      key={rec.label}
                      onClick={() =>
                        onUpdateNode(selectedNode.id, {
                          network: { ...net, ip: rec.label },
                        })
                      }
                      className={`px-1.5 py-1 rounded text-[10px] font-mono transition-colors text-center border truncate flex flex-col items-center ${
                        net.ip === rec.label
                          ? 'bg-sky-600 text-white border-sky-500 font-bold shadow-xs'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border-slate-800'
                      }`}
                      title={`${rec.label} (${rec.desc})`}
                    >
                      <span className="font-semibold">{rec.label}</span>
                      <span className="text-[8px] opacity-75 font-sans">{rec.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Subnet Mask Field & 3 USABLE RECOMMENDATIONS */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-slate-300">
                    Subnet Mask
                  </label>
                  <span className="text-[9px] text-sky-400 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Pick 1 of 3 usable:</span>
                  </span>
                </div>

                <input
                  type="text"
                  value={net.subnet}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      network: { ...net, subnet: e.target.value },
                    })
                  }
                  className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none ${
                    isValidSubnetMask(net.subnet) ? 'border-slate-800 focus:border-sky-500' : 'border-rose-600'
                  }`}
                />

                {/* 3 Usable Subnet Mask Options */}
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  {recommendedSubnets.map((rec) => (
                    <button
                      key={rec.label}
                      onClick={() =>
                        onUpdateNode(selectedNode.id, {
                          network: { ...net, subnet: rec.label },
                        })
                      }
                      className={`px-1 py-1 rounded text-[10px] font-mono transition-colors text-center border truncate flex flex-col items-center ${
                        net.subnet === rec.label
                          ? 'bg-sky-600 text-white border-sky-500 font-bold shadow-xs'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border-slate-800'
                      }`}
                      title={`${rec.label} (${rec.cidr}) - ${rec.desc}`}
                    >
                      <span className="font-semibold">{rec.cidr}</span>
                      <span className="text-[8px] opacity-75 font-sans">{rec.label.replace('255.255.', '..')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Default Gateway Field & 3 USABLE RECOMMENDATIONS */}
              {selectedNode.type !== 'router_firewall' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-300">
                      Default Gateway
                    </label>
                    <span className="text-[9px] text-sky-400 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Pick 1 of 3 usable:</span>
                    </span>
                  </div>

                  <input
                    type="text"
                    value={net.gateway}
                    onChange={(e) =>
                      onUpdateNode(selectedNode.id, {
                        network: { ...net, gateway: e.target.value },
                      })
                    }
                    className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none ${
                      isValidIPv4(net.gateway) ? 'border-slate-800 focus:border-sky-500' : 'border-rose-600'
                    }`}
                  />

                  {/* 3 Usable Gateway Options */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    {recommendedGateways.map((rec) => (
                      <button
                        key={rec.label}
                        onClick={() =>
                          onUpdateNode(selectedNode.id, {
                            network: { ...net, gateway: rec.label },
                          })
                        }
                        className={`px-1 py-1 rounded text-[10px] font-mono transition-colors text-center border truncate flex flex-col items-center ${
                          net.gateway === rec.label
                            ? 'bg-sky-600 text-white border-sky-500 font-bold shadow-xs'
                            : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border-slate-800'
                        }`}
                        title={`${rec.label} (${rec.desc})`}
                      >
                        <span className="font-semibold">{rec.label}</span>
                        <span className="text-[8px] opacity-75 font-sans truncate max-w-full">
                          {rec.desc.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subnet Math Preview & Reachability Check */}
              {subnetInfo && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span className="text-slate-200">{subnetInfo.network}/{subnetInfo.cidr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usable Hosts:</span>
                    <span className="text-slate-200">
                      {subnetInfo.totalHosts} ({subnetInfo.firstUsable} - {subnetInfo.lastUsable})
                    </span>
                  </div>

                  {selectedNode.type !== 'router_firewall' && (
                    <div className="pt-1">
                      {isSameSubnetAsGw ? (
                        <div className="text-emerald-400 flex items-center gap-1 font-sans text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Gateway is reachable on same subnet.</span>
                        </div>
                      ) : (
                        <div className="text-rose-400 flex items-center gap-1 font-sans text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Subnet mismatch! Device cannot reach gateway.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
