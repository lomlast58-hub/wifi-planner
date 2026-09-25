import { CableRun, CableType, NetworkNode } from '../types/network';
import { EQUIPMENT_CATALOG } from '../constants/equipmentDefinitions';

export interface ProjectedFix {
  targetNodeId: string;
  fromNodeId?: string;
  fromPortId?: string;
  toNodeId?: string;
  toPortId?: string;
  cableType: CableType;
  title: string;
  description: string;
  actionText: string;
  fixType: 'cable' | 'ip' | 'info' | 'ground_certify';
  newIpConfig?: { ip: string; gateway: string; subnet: string };
}

export function findRecommendedFix(
  faultCode: string,
  targetNodeId: string,
  nodes: NetworkNode[],
  cables: CableRun[]
): ProjectedFix | null {
  const targetNode = nodes.find((n) => n.id === targetNodeId);
  if (!targetNode) return null;

  // 1. NO_POE_POWER
  if (faultCode === 'NO_POE_POWER') {
    const poeProviders = nodes.filter(
      (n) =>
        n.type === 'switch_4p_poe' ||
        n.type === 'core_switch_poe' ||
        n.type === 'switch_16p_poe' ||
        n.type === 'poe_injector'
    );

    for (const provider of poeProviders) {
      const spec = EQUIPMENT_CATALOG[provider.type];
      const poePorts = spec.ports.filter(
        (p) => p.type === 'rj45_poe_out' || p.id.startsWith('poe')
      );

      // Find first unused PoE port
      for (const port of poePorts) {
        const isPortUsed = cables.some(
          (c) =>
            (c.fromNodeId === provider.id && c.fromPortId === port.id) ||
            (c.toNodeId === provider.id && c.toPortId === port.id)
        );

        if (!isPortUsed) {
          return {
            targetNodeId,
            fromNodeId: provider.id,
            fromPortId: port.id,
            toNodeId: targetNodeId,
            toPortId: 'poe_in',
            cableType: 'ethernet',
            title: `Auto-Fix: Connect to Free PoE Port (${port.name})`,
            description: `Connect a Cat6 cable from ${provider.label} (${port.name}) to ${targetNode.label} (PoE In).`,
            actionText: 'Apply PoE Cable Link',
            fixType: 'cable',
          };
        }
      }
    }

    return {
      targetNodeId,
      cableType: 'ethernet',
      title: 'Auto-Fix Advice: Add a PoE Switch or Injector',
      description:
        'All PoE ports on your canvas are occupied or none exist. Drag a 4-Port, 8-Port, or 16-Port PoE Switch or a Single PoE Injector from the library.',
      actionText: 'View Library',
      fixType: 'info',
    };
  }

  // 2. NO_AC_POWER
  if (faultCode === 'NO_AC_POWER') {
    const powerSources = nodes.filter(
      (n) => n.type === 'ac_power' || n.type === 'ups' || n.type === 'ups_3_socket' || n.type.startsWith('extension_socket')
    );

    for (const src of powerSources) {
      const spec = EQUIPMENT_CATALOG[src.type];
      const acPorts = spec.ports.filter((p) => p.type === 'ac_out' || p.id.includes('ac_out'));

      for (const port of acPorts) {
        return {
          targetNodeId,
          fromNodeId: src.id,
          fromPortId: port.id,
          toNodeId: targetNodeId,
          toPortId: 'pwr_in',
          cableType: 'ac_power',
          title: `Auto-Fix: Connect 220V AC Power from ${src.label}`,
          description: `Plug an AC Electrical cable from ${src.label} (${port.name}) to ${targetNode.label} (Power In).`,
          actionText: 'Apply AC Power Connection',
          fixType: 'cable',
        };
      }
    }
  }

  // 3. MISSING_GROUNDING
  if (faultCode === 'MISSING_GROUNDING') {
    // Check if there is an in-canvas surge arrester
    const arrester = nodes.find((n) => n.type === 'surge_arrester');
    if (arrester) {
      return {
        targetNodeId,
        fromNodeId: targetNodeId,
        fromPortId: 'gnd',
        toNodeId: arrester.id,
        toPortId: 'gnd',
        cableType: 'grounding',
        title: `Auto-Fix: Bond Grounding to ${arrester.label}`,
        description: `Connect a green grounding cable from ${targetNode.label} to ${arrester.label}.`,
        actionText: 'Apply Grounding Cable',
        fixType: 'cable',
      };
    }

    // Default option: Certify building ground bond
    return {
      targetNodeId,
      cableType: 'grounding',
      title: 'Auto-Fix: Mark Grounding Terminal as Certified Fixed',
      description: `Verify that ${targetNode.label} is grounded via building structural steel/copper rod. Click to mark grounding as certified fixed.`,
      actionText: 'Certify Grounding Fix',
      fixType: 'ground_certify',
    };
  }

  // 4. IP_SUBNET_MISMATCH or GATEWAY_NOT_FOUND or IP_SYNTAX_INVALID
  if (
    faultCode === 'IP_SUBNET_MISMATCH' ||
    faultCode === 'GATEWAY_NOT_FOUND' ||
    faultCode === 'IP_SYNTAX_INVALID' ||
    faultCode === 'IP_DUPLICATE'
  ) {
    const router = nodes.find((n) => n.type === 'router_firewall');
    const routerIp = router?.network?.ip || '192.168.1.1';
    const prefix = routerIp.split('.').slice(0, 3).join('.');

    // Find used host numbers
    const usedHosts = new Set<number>();
    nodes.forEach((n) => {
      if (n.network?.ip && n.id !== targetNodeId) {
        const parts = n.network.ip.split('.');
        if (parts.length === 4) {
          usedHosts.add(parseInt(parts[3], 10));
        }
      }
    });

    let chosenHost = 10;
    while (usedHosts.has(chosenHost) && chosenHost < 254) {
      chosenHost++;
    }

    const alignedIp = `${prefix}.${chosenHost}`;

    return {
      targetNodeId,
      cableType: 'ethernet',
      title: `Auto-Fix: Align IP to Gateway Subnet (${alignedIp})`,
      description: `Change IP from "${targetNode.network?.ip || 'unset'}" to "${alignedIp}" with Subnet "255.255.255.0" and Gateway "${routerIp}".`,
      actionText: 'Apply Recommended IP Config',
      fixType: 'ip',
      newIpConfig: {
        ip: alignedIp,
        gateway: routerIp,
        subnet: router?.network?.subnet || '255.255.255.0',
      },
    };
  }

  // 5. NO_DATA_UPLINK
  if (faultCode === 'NO_DATA_UPLINK') {
    if (targetNode.type === 'outdoor_ap' || targetNode.type === 'indoor_ap') {
      const switchNode = nodes.find(
        (n) =>
          n.type === 'core_switch_poe' ||
          n.type === 'switch_4p_poe' ||
          n.type === 'switch_16p_poe' ||
          n.type === 'poe_injector'
      );
      if (switchNode) {
        return {
          targetNodeId,
          fromNodeId: switchNode.id,
          fromPortId: 'poe1',
          toNodeId: targetNodeId,
          toPortId: 'poe_in',
          cableType: 'ethernet',
          title: `Auto-Fix: Connect to ${switchNode.label}`,
          description: `Connect Cat6 cable from ${switchNode.label} to ${targetNode.label} to establish data path.`,
          actionText: 'Connect to Switch',
          fixType: 'cable',
        };
      }
    }
  }

  return null;
}
