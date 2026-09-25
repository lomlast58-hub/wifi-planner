import React, { useState } from 'react';
import { X, Printer, Download, MapPin, Building, Network } from 'lucide-react';
import { CableRun, NetworkNode, Structure, ValidationSummary } from '../types/network';
import { EQUIPMENT_CATALOG, CABLE_DEFINITIONS } from '../constants/equipmentDefinitions';
import { exportSiteSurveyPdf } from '../utils/pdfExport';

interface SiteSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NetworkNode[];
  structures: Structure[];
  cables: CableRun[];
  summary: ValidationSummary;
}

export const SiteSurveyModal: React.FC<SiteSurveyModalProps> = ({
  isOpen,
  onClose,
  nodes,
  structures,
  cables,
  summary,
}) => {
  const [siteName, setSiteName] = useState('Main Campus & Assembly Grounds');
  const [lguLocation, setLguLocation] = useState('Regional Headquarters & Facility Grounds');
  const [engineerName, setEngineerName] = useState('Lead Systems Engineer');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    exportSiteSurveyPdf(
      siteName,
      lguLocation,
      engineerName,
      structures,
      nodes,
      cables,
      summary
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-600/40 flex items-center justify-center text-sky-400 font-bold text-xs tracking-wider">
              TZ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-100">
                  Field Site Survey &amp; Engineering Plan
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                  TEPBIZ™
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Technical Site Assessment &amp; Deployment Specification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print View</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white transition-colors shadow-sm"
              title="Export Landscape PDF with diagonal TEPBIZ™ watermark"
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

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-950/40 print:bg-white print:text-black print:p-0">
          {/* Document Banner */}
          <div className="border border-slate-800 p-5 rounded-xl bg-slate-900/60 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-[10px] tracking-widest uppercase text-sky-400 font-bold font-mono">
                TEPBIZ™ NETWORK ENGINEERING &amp; INFRASTRUCTURE SYSTEMS
              </div>
              <h1 className="text-base font-bold text-slate-100">
                SITE SURVEY, CABLING SCHEDULE &amp; ARCHITECTURE REPORT
              </h1>
              <div className="text-xs text-slate-400 font-medium">
                Comprehensive Physical &amp; Logical Topology Specification
              </div>
            </div>

            {/* Editable Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Site Name</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Location</label>
                <input
                  type="text"
                  value={lguLocation}
                  onChange={(e) => setLguLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Lead Engineer</label>
                <input
                  type="text"
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Physical Site Structures */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-sky-400" />
              <span>1. Physical Structures Surveyed</span>
            </h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 font-medium">Facility / Structure</th>
                    <th className="p-2.5 font-medium">Facility Type</th>
                    <th className="p-2.5 font-medium">Equipment Installed Inside</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {structures.map((s) => {
                    const inside = nodes.filter((n) => n.structureId === s.id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-900/40">
                        <td className="p-2.5 font-medium text-slate-200">{s.label}</td>
                        <td className="p-2.5 text-slate-400 capitalize">{s.type.replace('_', ' ')}</td>
                        <td className="p-2.5 text-slate-300">
                          {inside.length > 0
                            ? inside.map((n) => n.label).join(', ')
                            : 'No equipment placed inside'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Cabling Schedule */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Structured Cabling Schedule</span>
            </h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 font-medium">Cable Media Type</th>
                    <th className="p-2.5 font-medium">Source Endpoint</th>
                    <th className="p-2.5 font-medium">Destination Endpoint</th>
                    <th className="p-2.5 font-medium text-center">Length</th>
                    <th className="p-2.5 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {cables.map((c) => {
                    const fromNode = nodes.find((n) => n.id === c.fromNodeId);
                    const toNode = nodes.find((n) => n.id === c.toNodeId);
                    const cDef = CABLE_DEFINITIONS[c.type as keyof typeof CABLE_DEFINITIONS];

                    return (
                      <tr key={c.id} className="hover:bg-slate-900/40">
                        <td className="p-2.5 font-medium text-slate-200">{cDef?.name || c.type}</td>
                        <td className="p-2.5 text-slate-300">
                          {fromNode?.label || 'Unknown'} ({c.fromPortId})
                        </td>
                        <td className="p-2.5 text-slate-300">
                          {toNode?.label || 'Unknown'} ({c.toPortId})
                        </td>
                        <td className="p-2.5 text-center font-mono font-medium text-sky-400">
                          {Math.round(c.lengthMeters)}m
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              c.status === 'green'
                                ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                                : 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
                            }`}
                          >
                            {c.status === 'green' ? 'OK' : 'Fault'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
