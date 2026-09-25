import React from 'react';
import { X, Download, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { CableRun, NetworkNode } from '../types/network';
import { EQUIPMENT_CATALOG, CABLE_DEFINITIONS } from '../constants/equipmentDefinitions';
import { exportBomPdf } from '../utils/pdfExport';

interface BomModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NetworkNode[];
  cables: CableRun[];
}

export const BomModal: React.FC<BomModalProps> = ({ isOpen, onClose, nodes, cables }) => {
  if (!isOpen) return null;

  // Aggregate node counts
  const itemMap = new Map<string, { count: number; node: NetworkNode }>();
  nodes.forEach((n) => {
    const existing = itemMap.get(n.type);
    if (existing) {
      existing.count++;
    } else {
      itemMap.set(n.type, { count: 1, node: n });
    }
  });

  const equipmentItems = Array.from(itemMap.values()).map(({ count, node }) => {
    const spec = EQUIPMENT_CATALOG[node.type];
    const isOnt = node.type === 'ont_onu';
    const isIspNap = node.type.startsWith('isp_');

    const sourceStatus = isOnt
      ? 'ISP provided'
      : isIspNap
      ? 'Telco Demarcation'
      : 'Procured Equipment';

    return {
      name: spec?.name || node.label,
      category: spec?.category || 'General',
      count,
      power: spec?.defaultPower.requiresPower
        ? `${spec.defaultPower.wattage}W (${spec.defaultPower.source.toUpperCase()})`
        : 'Passive / No Power',
      role: spec?.networkRole || spec?.dictRole || 'Network Hardware',
      sourceStatus,
      isOnt,
    };
  });

  // Cable lengths
  const cableMap = new Map<string, number>();
  cables.forEach((c) => {
    const prev = cableMap.get(c.type) || 0;
    cableMap.set(c.type, prev + c.lengthMeters);
  });

  const cableItems = Array.from(cableMap.entries()).map(([type, meters]) => {
    const def = CABLE_DEFINITIONS[type as keyof typeof CABLE_DEFINITIONS];
    return {
      name: def?.name || type,
      lengthMeters: Math.round(meters),
      type,
    };
  });

  const handleExportPdf = () => {
    exportBomPdf(nodes, cables, 'TEPBIZ Network Project');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-100">
                  Bill of Materials (BOM) — Equipment List
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                  TEPBIZ™
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Equipment specifications and cabling quantities (Price-free equipment manifest)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors shadow-sm"
              title="Export Landscape PDF with TEPBIZ™ watermark"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF (Landscape)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Active Equipment Table */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>1. Active Network Hardware &amp; Power Equipment</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {equipmentItems.length} unique equipment item{equipmentItems.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 font-medium">Equipment Name</th>
                    <th className="p-2.5 font-medium">Category</th>
                    <th className="p-2.5 font-medium text-center">Qty</th>
                    <th className="p-2.5 font-medium">Power Specs</th>
                    <th className="p-2.5 font-medium">Provisioning Source</th>
                    <th className="p-2.5 font-medium">Deployment Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {equipmentItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-medium text-slate-200">{item.name}</td>
                      <td className="p-2.5 capitalize text-slate-400">{item.category}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-sky-400">
                        {item.count}
                      </td>
                      <td className="p-2.5 text-slate-300 font-mono text-[10px]">{item.power}</td>
                      <td className="p-2.5">
                        {item.isOnt ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-700/60 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-teal-400" />
                            <span>ISP provided</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">{item.sourceStatus}</span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[10px] max-w-xs truncate">
                        {item.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cabling Infrastructure Table */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Structured Cabling Infrastructure
            </div>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 font-medium">Cable Media Type</th>
                    <th className="p-2.5 font-medium text-center">Total Length</th>
                    <th className="p-2.5 font-medium">Specification Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {cableItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400">
                        No cable runs created on canvas yet.
                      </td>
                    </tr>
                  ) : (
                    cableItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium text-slate-200">{item.name}</td>
                        <td className="p-2.5 text-center font-mono font-semibold text-sky-400">
                          {item.lengthMeters} meters
                        </td>
                        <td className="p-2.5 text-slate-400 text-[10px]">
                          {item.type === 'ethernet'
                            ? 'High-speed Cat6 Gigabit transmission (Max 100m certified segment)'
                            : item.type === 'fiber'
                            ? 'Single-mode optical fiber for inter-facility backbone links'
                            : item.type === 'grounding'
                            ? 'Copper lightning protection bond to earth grounding rod'
                            : '220V AC electrical power line'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span>TEPBIZ™ Network Architecture &amp; System Engineering</span>
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
