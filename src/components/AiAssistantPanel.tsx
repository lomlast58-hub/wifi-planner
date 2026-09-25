import React, { useState } from 'react';
import {
  Sparkles,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Send,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  ChevronRight,
  ExternalLink,
  Network,
  ShieldCheck,
} from 'lucide-react';
import { CableRun, NetworkNode, Structure, ValidationSummary } from '../types/network';
import { NETWORKING_GLOSSARY, GlossaryItem } from '../constants/glossary';
import { isValidIPv4 } from '../utils/ipUtils';

interface AiAssistantPanelProps {
  summary: ValidationSummary;
  selectedNode: NetworkNode | null;
  nodes: NetworkNode[];
  cables: CableRun[];
  structures: Structure[];
  onSelectNodeById: (nodeId: string) => void;
  onTriggerErrorFix?: (faultCode: string, targetId: string) => void;
  onApplyRecommendedIp?: (nodeId: string, ip: string, subnet: string, gateway: string) => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  summary,
  selectedNode,
  nodes,
  cables,
  structures,
  onSelectNodeById,
  onTriggerErrorFix,
  onApplyRecommendedIp,
}) => {
  const [tab, setTab] = useState<'diagnosis' | 'ask' | 'tips' | 'glossary'>('diagnosis');
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; text: string; time: string }[]
  >([
    {
      role: 'assistant',
      text: "Kumusta! I am your TEPBIZ™ Network Specialist. Ask me any question about cable distance limits, 90-degree orthogonal wiring, PoE wattage budgets, 220V power, lightning grounding, or IP subnet configuration.",
      time: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [expandedGlossaryId, setExpandedGlossaryId] = useState<string | null>(null);

  // Router IP detection
  const routerNode = nodes.find((n) => n.type === 'router_firewall');
  const activeGatewayIp = routerNode?.network?.ip || '192.168.1.1';
  const gwPrefix = isValidIPv4(activeGatewayIp)
    ? activeGatewayIp.split('.').slice(0, 3).join('.')
    : '192.168.1';

  // 3 Recommended Usable IPs
  const recIps = [
    { ip: `${gwPrefix}.10`, desc: 'Next Free Host' },
    { ip: `${gwPrefix}.25`, desc: 'Access Point' },
    { ip: `${gwPrefix}.50`, desc: 'Client Device' },
  ];

  // Filter IP faults
  const ipFaults = summary.faults.filter(
    (f) =>
      f.fault.code === 'IP_SUBNET_MISMATCH' ||
      f.fault.code === 'IP_SYNTAX_INVALID' ||
      f.fault.code === 'IP_DUPLICATE' ||
      f.fault.code === 'GATEWAY_NOT_FOUND' ||
      f.fault.code === 'DHCP_NO_SERVER'
  );

  const nonIpFaults = summary.faults.filter(
    (f) =>
      f.fault.code !== 'IP_SUBNET_MISMATCH' &&
      f.fault.code !== 'IP_SYNTAX_INVALID' &&
      f.fault.code !== 'IP_DUPLICATE' &&
      f.fault.code !== 'GATEWAY_NOT_FOUND' &&
      f.fault.code !== 'DHCP_NO_SERVER'
  );

  // Proactive planning tips based on topology
  const getProactiveTips = () => {
    const tips: { id: string; title: string; desc: string; type: 'warning' | 'info' | 'success' }[] = [];

    // Check long cables
    const longCables = cables.filter((c) => c.type === 'ethernet' && c.lengthMeters >= 85);
    if (longCables.length > 0) {
      tips.push({
        id: 'long-cable',
        title: 'Long Cat6 Runs Approaching 100m Limit',
        desc: `${longCables.length} Ethernet cable run(s) are near or past 85 meters. In tropical outdoor Philippine conduits, signal resistance increases with temperature. Consider fiber optic cable + media converter for outdoor runs.`,
        type: 'warning',
      });
    }

    // Check outdoor AP grounding
    const outdoorAps = nodes.filter((n) => n.type === 'outdoor_ap');
    if (outdoorAps.length > 0) {
      tips.push({
        id: 'outdoor-lightning',
        title: 'Outdoor Lightning Surge Protection Recommended',
        desc: `You have ${outdoorAps.length} outdoor AP(s) placed. Ensure each outdoor run passes through an in-line surge arrester bonded to a dedicated copper earth ground rod or certified building ground bond.`,
        type: 'info',
      });
    }

    // Check UPS presence
    const hasUps = nodes.some((n) => n.type === 'ups' || n.type === 'ups_3_socket');
    const hasCore = nodes.some((n) => n.type === 'router_firewall' || n.type === 'core_switch_poe' || n.type === 'switch_4p_poe' || n.type === 'switch_16p_poe');
    if (hasCore && !hasUps) {
      tips.push({
        id: 'missing-ups',
        title: 'Power Outage Risk: Add a UPS',
        desc: 'Core router and switches are directly plugged into wall mains without a UPS battery backup. Power fluctuations can cause equipment reboot loops and packet loss.',
        type: 'warning',
      });
    }

    // Check bandwidth sizing
    const ispNode = nodes.find((n) => n.type.startsWith('isp_') || n.type === 'vsat_terminal');
    if (ispNode?.type === 'vsat_terminal') {
      tips.push({
        id: 'vsat-bandwidth',
        title: 'VSAT Satellite Bandwidth Management',
        desc: 'VSAT connections typically deliver 10-15 Mbps with higher latency. Enable Bandwidth Throttling (e.g. 1-2 Mbps per user) on the router captive portal to prevent video streaming from choking critical operations.',
        type: 'info',
      });
    } else {
      tips.push({
        id: 'free-wifi-sla',
        title: 'TEPBIZ Bandwidth & QoS Allocation',
        desc: 'Standard commercial & enterprise sites recommend at least 20-50 Mbps dedicated throughput to serve concurrent users browsing portal applications and cloud services.',
        type: 'success',
      });
    }

    return tips;
  };

  const handleAskQuestion = async (queryText?: string) => {
    const question = queryText || inputQuery;
    if (!question.trim()) return;

    const userMsg = {
      role: 'user' as const,
      text: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoadingAi(true);

    try {
      const response = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: question,
          topology: { nodes, cables, structures },
          selectedNode: selectedNode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || 'No response returned from assistant.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      // Local fallback intelligent response
      let localAnswer = "Based on your current site layout:\n\n";
      const q = question.toLowerCase();

      if (q.includes('poe') || q.includes('power')) {
        localAnswer += "**Power over Ethernet (PoE)** delivers electric current over Cat6 twisted-pair cables alongside network data. High-powered outdoor APs need 802.3at (PoE+) supplying up to 30W, whereas indoor APs typically require 802.3af (15.4W). Always make sure your PoE switch total wattage budget covers the sum of all APs!";
      } else if (q.includes('gateway') || q.includes('ip') || q.includes('subnet')) {
        localAnswer += "**Default Gateway & Subnets**: A Default Gateway (like `192.168.1.1`) is the router IP address that all devices send Internet traffic to. With a `/24` subnet mask (`255.255.255.0`), all your devices must have IP addresses sharing the first three numbers (e.g. `192.168.1.X`), or they will be on separate islands and cannot communicate.";
      } else if (q.includes('ground') || q.includes('lightning') || q.includes('surge')) {
        localAnswer += "**Earth Grounding Protection**: Outdoor equipment and wireless access points mounted on rooftops or poles are exposed to severe atmospheric static and lightning strikes. Static buildup will damage switches and network interfaces unless you install an inline surge protector bonded with a grounding conductor to an earth ground electrode or certified grounding bar.";
      } else if (q.includes('distance') || q.includes('fiber') || q.includes('cat6')) {
        localAnswer += "**100-Meter Cat6 Limit**: Certified copper Ethernet cables can only transmit reliable Gigabit data up to 100 meters (328 feet). For distances over 100m (e.g. from Barangay Hall to a far basketball court or school wing), you must run single-mode fiber optic cable connected to an ONT or media converter!";
      } else {
        localAnswer += `Here is your current topology health check: ${
          summary.healthy
            ? 'All devices and cables are verified healthy and ready for deployment!'
            : `There are ${summary.redCount} red fault(s) detected. Check the Auto-Diagnosis tab to see specific causes and fixes.`
        }`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: localAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const proactiveTips = getProactiveTips();

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 text-xs select-none">
      {/* Tab Navigation */}
      <div className="grid grid-cols-4 p-1.5 gap-1 bg-slate-900 border-b border-slate-800 text-[11px] shrink-0">
        <button
          onClick={() => setTab('diagnosis')}
          className={`py-1.5 px-1 rounded-md transition-all flex items-center justify-center gap-1 ${
            tab === 'diagnosis'
              ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Diagnose</span>
          {summary.redCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {summary.redCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('ask')}
          className={`py-1.5 px-1 rounded-md transition-all flex items-center justify-center gap-1 ${
            tab === 'ask'
              ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>

        <button
          onClick={() => setTab('tips')}
          className={`py-1.5 px-1 rounded-md transition-all flex items-center justify-center gap-1 ${
            tab === 'tips'
              ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Tips</span>
        </button>

        <button
          onClick={() => setTab('glossary')}
          className={`py-1.5 px-1 rounded-md transition-all flex items-center justify-center gap-1 ${
            tab === 'glossary'
              ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Glossary</span>
        </button>
      </div>

      {/* Tab 1: Auto-Diagnosis Feed */}
      {tab === 'diagnosis' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-slate-100">
              Simulation Verification Engine
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {summary.redCount} Errors · {summary.yellowCount} Warnings
            </span>
          </div>

          {/* Special IP Configuration Errors Section (As requested by user!) */}
          {ipFaults.length > 0 && (
            <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-600/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                  <Network className="w-4 h-4 text-sky-400" />
                  <span>IP Addressing &amp; Subnet Diagnostics</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-900 text-sky-200">
                  {ipFaults.length} IP Issue{ipFaults.length > 1 ? 's' : ''}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Active Gateway detected: <strong className="text-sky-300 font-mono">{activeGatewayIp}</strong>. All devices must reside in subnet <strong className="text-sky-300 font-mono">{gwPrefix}.X</strong> with gateway set to <strong className="text-sky-300 font-mono">{activeGatewayIp}</strong>.
              </p>

              {/* 3 Usable Recommended IPs */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  3 Usable IP Recommendations:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {recIps.map((rec) => (
                    <div
                      key={rec.ip}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center"
                    >
                      <div className="text-[10px] font-mono font-bold text-sky-400">{rec.ip}</div>
                      <div className="text-[9px] text-slate-400">{rec.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {ipFaults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectNodeById(item.targetId);
                      if (onTriggerErrorFix) {
                        onTriggerErrorFix(item.fault.code, item.targetId);
                      }
                    }}
                    className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/80 hover:bg-rose-950/60 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-rose-300 font-semibold text-xs">
                      <span>{item.targetLabel}: {item.fault.title}</span>
                      <span className="text-[10px] text-sky-400 flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Fix IP ↗</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-200/90">{item.fault.message}</p>
                    <div className="text-[10px] text-emerald-300 bg-slate-900/70 p-1.5 rounded border border-slate-800">
                      <strong>Fix: </strong>{item.fault.fix}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Non-IP Faults or All Healthy */}
          {summary.faults.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center space-y-2 mt-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-xs font-semibold text-emerald-300">
                100% Operational &amp; Ready
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Every power path, PoE standard, cable distance, grounding wire, and IP subnet is verified. Citizens can now authenticate and browse.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {nonIpFaults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectNodeById(item.targetId);
                    if (onTriggerErrorFix) {
                      onTriggerErrorFix(item.fault.code, item.targetId);
                    }
                  }}
                  className="p-3 rounded-xl border border-rose-800/60 bg-rose-950/20 hover:bg-rose-950/30 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{item.targetLabel}: {item.fault.title}</span>
                    </div>
                    <span className="text-[10px] text-sky-400 font-medium group-hover:underline flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      <span>Recommend Fix ↗</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    {item.fault.message}
                  </p>

                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-[11px]">
                    <div className="text-slate-400">
                      <strong className="text-slate-300">Why it happens: </strong>
                      {item.fault.why}
                    </div>
                    <div className="text-emerald-400 pt-0.5">
                      <strong>How to fix: </strong>
                      {item.fault.fix}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Ask AI Chat */}
      {tab === 'ask' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl max-w-[90%] text-xs leading-relaxed space-y-1 ${
                  msg.role === 'user'
                    ? 'ml-auto bg-sky-600 text-white rounded-br-xs'
                    : 'mr-auto bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`text-[9px] font-mono text-right ${
                    msg.role === 'user' ? 'text-sky-200' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            ))}

            {isLoadingAi && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>TEPBIZ Specialist is analyzing your topology...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-slate-800 bg-slate-900/40 flex flex-wrap gap-1.5 shrink-0">
            <button
              onClick={() => handleAskQuestion("How do I fix IP address and gateway mismatches?")}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
            >
              How to fix IP mismatch?
            </button>
            <button
              onClick={() => handleAskQuestion("Why do I need a media converter for long cable runs?")}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
            >
              Why media converter?
            </button>
            <button
              onClick={() => handleAskQuestion("What is PoE budget and how is it calculated?")}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
            >
              What is PoE budget?
            </button>
            <button
              onClick={() => handleAskQuestion("Why is lightning grounding protection required?")}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
            >
              Why grounding?
            </button>
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 shrink-0 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask TEPBIZ Network Specialist..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskQuestion();
              }}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={() => handleAskQuestion()}
              disabled={isLoadingAi || !inputQuery.trim()}
              className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Proactive Planning Tips */}
      {tab === 'tips' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="pb-1">
            <div className="text-xs font-semibold text-slate-100">
              Proactive Deployment Recommendations
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Field engineering best practices tailored to your canvas layout.
            </div>
          </div>

          {proactiveTips.map((tip) => (
            <div
              key={tip.id}
              className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                {tip.type === 'warning' ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                ) : tip.type === 'info' ? (
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
                <span className="text-xs font-semibold text-slate-200">{tip.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Networking Glossary */}
      {tab === 'glossary' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="pb-1">
            <div className="text-xs font-semibold text-slate-100">
              TEPBIZ Engineering Glossary
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Click any term to expand technical definitions and engineering context.
            </div>
          </div>

          {NETWORKING_GLOSSARY.map((item: GlossaryItem) => {
            const isExpanded = expandedGlossaryId === item.id;
            return (
              <div
                key={item.id}
                className="border border-slate-800 rounded-xl bg-slate-900/50 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedGlossaryId(isExpanded ? null : item.id)}
                  className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-850"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-200">{item.term}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.shortDef}</p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-90 text-sky-400' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-slate-800/80 bg-slate-950/40 space-y-2 text-[11px] text-slate-300">
                    <p className="leading-relaxed">{item.fullExplanation}</p>
                    <div className="p-2 rounded bg-sky-950/40 border border-sky-900/60 text-sky-200">
                      <strong>TEPBIZ Technical Context: </strong>
                      {item.practicalContext}
                    </div>
                    <div className="text-slate-400 font-mono text-[10px]">
                      <strong>Example: </strong>
                      {item.example}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
