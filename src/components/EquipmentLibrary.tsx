import React, { useState } from 'react';
import {
  Globe,
  Server,
  Zap,
  Wifi,
  Search,
  Building2,
  Plus,
  Radio,
  Shield,
  Laptop,
  Box,
} from 'lucide-react';
import { EquipmentCategory, EquipmentType } from '../types/network';
import { EQUIPMENT_CATALOG } from '../constants/equipmentDefinitions';

interface EquipmentLibraryProps {
  onAddEquipment: (type: EquipmentType) => void;
  onAddStructure: (type: string, label: string) => void;
  mode: 'design' | 'simulate';
}

export const EquipmentLibrary: React.FC<EquipmentLibraryProps> = ({
  onAddEquipment,
  onAddStructure,
  mode,
}) => {
  const [activeTab, setActiveTab] = useState<EquipmentCategory | 'structures'>('backbone');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryIcons: Record<EquipmentCategory, React.ReactNode> = {
    backbone: <Globe className="w-3.5 h-3.5" />,
    core: <Server className="w-3.5 h-3.5" />,
    power: <Zap className="w-3.5 h-3.5" />,
    access: <Wifi className="w-3.5 h-3.5" />,
  };

  const getEquipmentIcon = (type: EquipmentType) => {
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
        return <Box className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredEquipment = Object.values(EQUIPMENT_CATALOG).filter((item) => {
    const roleText = item.networkRole || item.dictRole || '';
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleText.toLowerCase().includes(searchQuery.toLowerCase());

    if (searchQuery) return matchesSearch;
    return item.category === activeTab;
  });

  const structureTemplates = [
    { type: 'barangay_hall', label: 'Main Office Facility', color: '#1e293b', desc: 'Administrative & operations building' },
    { type: 'covered_court', label: 'Covered Assembly Area', color: '#0f172a', desc: 'Open assembly & recreational facility' },
    { type: 'health_center', label: 'Clinic / Health Annex', color: '#042f2e', desc: 'Community health & medical post' },
    { type: 'school', label: 'Educational Wing / Lab', color: '#172554', desc: 'Classrooms & computer rooms' },
    { type: 'plaza', label: 'Outdoor Grounds / Park', color: '#14532d', desc: 'Open grounds & outdoor grounds' },
    { type: 'library', label: 'Digital Hub / Library', color: '#312e81', desc: 'Resource area & workstations' },
  ];

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col h-full shrink-0 select-none z-10">
      {/* Header & Search */}
      <div className="p-3 border-b border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            Equipment Library
          </span>
          <span className="text-[10px] text-slate-400">
            {mode === 'simulate' ? 'Simulation active' : 'Click to add node'}
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search equipment, ports, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      {!searchQuery && (
        <div className="grid grid-cols-5 p-1.5 gap-1 bg-slate-900/60 border-b border-slate-800/80 text-[11px]">
          {(['backbone', 'core', 'power', 'access'] as EquipmentCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex flex-col items-center py-1.5 px-1 rounded-md capitalize transition-all ${
                activeTab === cat
                  ? 'bg-slate-800 text-sky-400 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {categoryIcons[cat]}
              <span className="mt-1 text-[10px]">{cat}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveTab('structures')}
            className={`flex flex-col items-center py-1.5 px-1 rounded-md capitalize transition-all ${
              activeTab === 'structures'
                ? 'bg-slate-800 text-sky-400 font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="mt-1 text-[10px]">Site</span>
          </button>
        </div>
      )}

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {activeTab === 'structures' && !searchQuery ? (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 px-1 uppercase tracking-wider">
              Site Structures &amp; Buildings
            </div>
            <p className="text-[11px] text-slate-400 px-1">
              Add movable, resizable building blocks to map equipment to physical zones.
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {structureTemplates.map((struct) => (
                <div
                  key={struct.type}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex items-start justify-between group"
                >
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>{struct.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {struct.desc}
                    </p>
                  </div>
                  <button
                    disabled={mode === 'simulate'}
                    onClick={() => onAddStructure(struct.type, struct.label)}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
                    title="Add structure block to canvas"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          filteredEquipment.map((eq) => {
            const hasPoe = eq.defaultPower.source === 'poe' || eq.defaultPower.poeBudgetWatts;
            const isAc = eq.defaultPower.source === 'ac';

            return (
              <div
                key={eq.type}
                className="p-3 rounded-xl border border-slate-800/90 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 transition-all relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60">
                      {getEquipmentIcon(eq.type)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100 group-hover:text-sky-300 transition-colors">
                        {eq.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {eq.ports.length} port{eq.ports.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={mode === 'simulate'}
                    onClick={() => onAddEquipment(eq.type)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
                    title={`Add ${eq.name} to canvas`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {eq.description}
                </p>

                {/* Specs / Tags */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                  {eq.type.includes('non_poe') && (
                    <span className="text-purple-400 bg-purple-950/70 border border-purple-800/60 px-1.5 py-0.5 rounded font-medium">
                      Non-PoE (Data Only)
                    </span>
                  )}
                  {eq.type === 'poe_injector' && (
                    <span className="text-amber-300 bg-amber-950/70 border border-amber-700/60 px-1.5 py-0.5 rounded font-medium">
                      PoE Injector (Right-side Ports)
                    </span>
                  )}
                  {eq.type === 'extension_socket_2p' && (
                    <span className="text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-1.5 py-0.5 rounded font-medium">
                      2 AC Outlets
                    </span>
                  )}
                  {eq.type === 'extension_socket_3p' && (
                    <span className="text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-1.5 py-0.5 rounded font-medium">
                      3 AC Outlets
                    </span>
                  )}
                  {eq.type === 'extension_socket_4p' && (
                    <span className="text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-1.5 py-0.5 rounded font-medium">
                      4 AC Outlets
                    </span>
                  )}
                  {hasPoe && !eq.type.includes('non_poe') && (
                    <span className="text-sky-400 bg-sky-950/60 border border-sky-800/50 px-1.5 py-0.5 rounded">
                      {eq.defaultPower.poeBudgetWatts ? `PoE Budget: ${eq.defaultPower.poeBudgetWatts}W` : `PoE (${eq.defaultPower.requiredStandard || 'af'})`}
                    </span>
                  )}
                  {isAc && (
                    <span className="text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.5 rounded">
                      220V AC ({eq.defaultPower.wattage}W)
                    </span>
                  )}
                  {eq.isOutdoor && (
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                      Outdoor Weatherproof
                    </span>
                  )}
                  {eq.maxThroughputMbps && (
                    <span className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      {eq.maxThroughputMbps} Mbps
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
