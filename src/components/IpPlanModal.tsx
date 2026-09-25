import React from 'react';
import { X, Download, Network } from 'lucide-react';
import { NetworkNode, Structure } from '../types/network';
import { exportIpPlanPdf } from '../utils/pdfExport';

interface IpPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NetworkNode[];
  structures: Structure[];
}

export const IpPlanModal: React.FC<IpPlanModalProps> = ({
  isOpen,
  onClose,
  nodes,
  structures,
}) => {
  if (!isOpen) return null;

  const structureMap = new Map<string, string>();
  structures.forEach((s) => structureMap.set(s.id, s.label));

  const networkDevices = nodes.filter((n) => n.network);

  const handleExportPdf = () => {
    exportIpPlanPdf(nodes, structures, 'TEPBIZ Network Project');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-600/40 text-purple-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-100">
                  IP Addressing &amp; Subnet Plan
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                  TEPBIZ™
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Layer 3 configuration table for gateways, switches, access points, and client pools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-colors shadow-sm"
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

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5 font-medium">Device Label</th>
                  <th className="p-2.5 font-medium">Assigned Zone / Facility</th>
                  <th className="p-2.5 font-medium">IP Address</th>
                  <th className="p-2.5 font-medium">Subnet Mask</th>
                  <th className="p-2.5 font-medium">Default Gateway</th>
                  <th className="p-2.5 font-medium">Allocation Mode</th>
                  <th className="p-2.5 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {networkDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No network-configured equipment on canvas. Add a Router or Access Point to view IP addressing.
                    </td>
                  </tr>
                ) : (
                  networkDevices.map((n) => {
                    const loc = n.structureId
                      ? structureMap.get(n.structureId) || 'Site Grounds'
                      : 'Unassigned';

                    return (
                      <tr key={n.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium text-slate-200">{n.label}</td>
                        <td className="p-2.5 text-slate-400">{loc}</td>
                        <td className="p-2.5 font-mono font-semibold text-sky-400">{n.network?.ip}</td>
                        <td className="p-2.5 font-mono text-slate-400">{n.network?.subnet}</td>
                        <td className="p-2.5 font-mono text-slate-400">{n.network?.gateway}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              n.network?.isDhcp
                                ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {n.network?.isDhcp ? 'DHCP Dynamic' : 'Static IP'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              n.status === 'green'
                                ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                                : n.status === 'yellow'
                                ? 'text-amber-400 bg-amber-950/60 border border-amber-800/60'
                                : 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
                            }`}
                          >
                            {n.status === 'green' ? 'Nominal' : n.status === 'yellow' ? 'Warning' : 'Fault'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
