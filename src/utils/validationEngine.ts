import {
  CableRun,
  FaultItem,
  NetworkNode,
  NodeStatus,
  ValidationSummary,
} from '../types/network';
import { EQUIPMENT_CATALOG } from '../constants/equipmentDefinitions';
import { areInSameSubnet, isValidIPv4, isValidSubnetMask } from './ipUtils';

interface AdjacencyEdge {
  cable: CableRun;
  targetNodeId: string;
  fromPort: string;
  toPort: string;
}

export function validateNetwork(
  nodes: NetworkNode[],
  cables: CableRun[]
): {
  validatedNodes: NetworkNode[];
  validatedCables: CableRun[];
  summary: ValidationSummary;
} {
  const nodeMap = new Map<string, NetworkNode>();
  nodes.forEach((n) => {
    nodeMap.set(n.id, {
      ...n,
      faults: [],
      warnings: [],
      status: 'green',
      metrics: {
        poeLoadWatts: 0,
        connectedClients: 0,
      },
    });
  });

  const cableMap = new Map<string, CableRun>();
  cables.forEach((c) => {
    cableMap.set(c.id, {
      ...c,
      faults: [],
      status: 'green',
    });
  });

  // Build adjacency lists by cable type
  const adjAll = new Map<string, AdjacencyEdge[]>();
  const adjData = new Map<string, AdjacencyEdge[]>();
  const adjAC = new Map<string, AdjacencyEdge[]>();
  const adjPoE = new Map<string, AdjacencyEdge[]>();
  const adjGround = new Map<string, AdjacencyEdge[]>();

  nodes.forEach((n) => {
    adjAll.set(n.id, []);
    adjData.set(n.id, []);
    adjAC.set(n.id, []);
    adjPoE.set(n.id, []);
    adjGround.set(n.id, []);
  });

  // 1. Validate Cables directly (Distance, Port Compatibility)
  cables.forEach((cable) => {
    const fromNode = nodeMap.get(cable.fromNodeId);
    const toNode = nodeMap.get(cable.toNodeId);
    const validatedCable = cableMap.get(cable.id)!;

    if (!fromNode || !toNode) {
      validatedCable.status = 'red';
      validatedCable.faults.push({
        code: 'NO_DATA_UPLINK',
        title: 'Dangling Cable',
        message: 'This cable has one or more disconnected ends.',
        why: 'Both ends of a cable must be plugged into valid hardware ports.',
        fix: 'Reconnect or delete this dangling cable run.',
        severity: 'error',
      });
      return;
    }

    const fromSpec = EQUIPMENT_CATALOG[fromNode.type];
    const toSpec = EQUIPMENT_CATALOG[toNode.type];
    const fromPort = fromSpec?.ports.find((p) => p.id === cable.fromPortId);
    const toPort = toSpec?.ports.find((p) => p.id === cable.toPortId);

    // Physical distance rule: Cat5e/Cat6 max 100 meters
    if (cable.type === 'ethernet' && cable.lengthMeters > 100) {
      validatedCable.status = 'red';
      const fault: FaultItem = {
        code: 'DISTANCE_EXCEEDED',
        title: 'Ethernet Cable Exceeds 100m Limit',
        message: `This Cat6 copper cable is ${Math.round(cable.lengthMeters)}m long (limit is 100m).`,
        why: 'Copper Ethernet cables suffer severe high-frequency attenuation and packet loss past 100 meters.',
        fix: 'Replace this run with single-mode Fiber Optic + Media Converter / SFP, or install an inline repeater switch.',
        severity: 'error',
      };
      validatedCable.faults.push(fault);
      fromNode.faults.push(fault);
      toNode.faults.push(fault);
      fromNode.status = 'red';
      toNode.status = 'red';
    } else if (cable.type === 'ethernet' && cable.lengthMeters >= 90) {
      validatedCable.status = 'yellow';
      fromNode.warnings?.push(`Cable between ${fromNode.label} and ${toNode.label} is near 100m limit (${Math.round(cable.lengthMeters)}m).`);
    }

    // Port media check
    if (cable.type === 'fiber') {
      const fromIsFiber = fromPort?.type === 'fiber_sc';
      const toIsFiber = toPort?.type === 'fiber_sc';
      if (!fromIsFiber || !toIsFiber) {
        validatedCable.status = 'red';
        const fault: FaultItem = {
          code: 'PORT_MEDIA_MISMATCH',
          title: 'Fiber Cable Plugged into Copper RJ45 Port',
          message: 'Fiber optic cables cannot plug directly into RJ45 Ethernet jacks without an ONT or Media Converter.',
          why: 'Fiber carries light pulses; RJ45 copper ports require electrical voltage pulses.',
          fix: 'Connect the fiber cable to an ONT/ONU or Media Converter first, then use a Cat6 patch lead to the switch.',
          severity: 'error',
        };
        validatedCable.faults.push(fault);
        fromNode.faults.push(fault);
        toNode.faults.push(fault);
        fromNode.status = 'red';
        toNode.status = 'red';
      }
    }

    // AC Power cable check
    if (cable.type === 'ac_power') {
      const validAc =
        (fromPort?.type === 'ac_out' && toPort?.type === 'ac_in') ||
        (fromPort?.type === 'ac_in' && toPort?.type === 'ac_out');
      if (!validAc) {
        validatedCable.status = 'red';
        const fault: FaultItem = {
          code: 'PORT_MEDIA_MISMATCH',
          title: 'AC Power Incompatible Port Connection',
          message: 'High-voltage 220V AC cable must plug from an AC Out to an AC In port.',
          why: 'Plugging AC mains power into a network data port will immediately cause electrical damage or fire.',
          fix: 'Connect AC power cable strictly between the 220V mains outlet / UPS and equipment AC In socket.',
          severity: 'error',
        };
        validatedCable.faults.push(fault);
        fromNode.faults.push(fault);
        toNode.faults.push(fault);
        fromNode.status = 'red';
        toNode.status = 'red';
      }
    }

    // Grounding check
    if (cable.type === 'grounding') {
      const isGroundPort = fromPort?.type === 'ground_lug' || toPort?.type === 'ground_lug';
      if (!isGroundPort) {
        validatedCable.status = 'yellow';
      }
    }

    // Populate adjacency lists
    adjAll.get(cable.fromNodeId)?.push({ cable, targetNodeId: cable.toNodeId, fromPort: cable.fromPortId, toPort: cable.toPortId });
    adjAll.get(cable.toNodeId)?.push({ cable, targetNodeId: cable.fromNodeId, fromPort: cable.toPortId, toPort: cable.fromPortId });

    if (cable.type === 'ethernet' || cable.type === 'fiber') {
      adjData.get(cable.fromNodeId)?.push({ cable, targetNodeId: cable.toNodeId, fromPort: cable.fromPortId, toPort: cable.toPortId });
      adjData.get(cable.toNodeId)?.push({ cable, targetNodeId: cable.fromNodeId, fromPort: cable.toPortId, toPort: cable.fromPortId });
    }

    if (cable.type === 'ac_power') {
      adjAC.get(cable.fromNodeId)?.push({ cable, targetNodeId: cable.toNodeId, fromPort: cable.fromPortId, toPort: cable.toPortId });
      adjAC.get(cable.toNodeId)?.push({ cable, targetNodeId: cable.fromNodeId, fromPort: cable.toPortId, toPort: cable.fromPortId });
    }

    if (cable.type === 'grounding') {
      adjGround.get(cable.fromNodeId)?.push({ cable, targetNodeId: cable.toNodeId, fromPort: cable.fromPortId, toPort: cable.toPortId });
      adjGround.get(cable.toNodeId)?.push({ cable, targetNodeId: cable.fromNodeId, fromPort: cable.toPortId, toPort: cable.fromPortId });
    }
  });

  // 2. Power Validation:
  // Determine which devices have AC power
  const acPoweredNodes = new Set<string>();

  // Any ac_power node is an origin
  const acSources = nodes.filter((n) => n.type === 'ac_power');
  acSources.forEach((src) => acPoweredNodes.add(src.id));

  // Breadth-first search for AC distribution (AC Out -> UPS -> AC Out -> devices)
  const acQueue: string[] = [...acSources.map((s) => s.id)];
  while (acQueue.length > 0) {
    const currentId = acQueue.shift()!;
    const neighbors = adjAC.get(currentId) || [];
    for (const edge of neighbors) {
      if (!acPoweredNodes.has(edge.targetNodeId)) {
        acPoweredNodes.add(edge.targetNodeId);
        acQueue.push(edge.targetNodeId);
      }
    }
  }

  // Check AC requirements
  nodes.forEach((node) => {
    const vNode = nodeMap.get(node.id)!;
    const spec = EQUIPMENT_CATALOG[node.type];
    if (spec.defaultPower.requiresPower && spec.defaultPower.source === 'ac') {
      if (!acPoweredNodes.has(node.id)) {
        vNode.status = 'red';
        vNode.faults.push({
          code: 'NO_AC_POWER',
          title: `No AC Power Supply (${vNode.label})`,
          message: `${vNode.label} is unpowered. It requires 220V AC electrical power to boot up.`,
          why: 'Active network equipment (routers, switches, ONTs) cannot operate without electrical current.',
          fix: 'Draw an AC Electrical Cable from an AC Power Source (or UPS battery backup) to this device.',
          severity: 'error',
        });
      }
    }
  });

  // 3. PoE (Power over Ethernet) Validation:
  // Check which switches or injectors provide PoE, and track their budget
  const isPoeDevice = (type: string) =>
    type === 'switch_4p_poe' ||
    type === 'core_switch_poe' ||
    type === 'switch_16p_poe' ||
    type === 'poe_injector';

  const poeProviders = nodes.filter((n) => isPoeDevice(n.type));

  poeProviders.forEach((provider) => {
    const vProvider = nodeMap.get(provider.id)!;
    const providerSpec = EQUIPMENT_CATALOG[provider.type];
    const isProviderPowered = acPoweredNodes.has(provider.id);
    const budgetWatts = vProvider.power.poeBudgetWatts || providerSpec.defaultPower.poeBudgetWatts || 0;

    let totalDrawnWatts = 0;
    const dataEdges = adjData.get(provider.id) || [];

    dataEdges.forEach((edge) => {
      // Is this connected on a PoE capable port?
      const isPoePort =
        edge.fromPort.includes('poe') ||
        isPoeDevice(provider.type);

      if (isPoePort) {
        const clientNode = nodeMap.get(edge.targetNodeId);
        if (clientNode && clientNode.power.source === 'poe') {
          adjPoE.get(provider.id)?.push(edge);
          adjPoE.get(clientNode.id)?.push({ ...edge, targetNodeId: provider.id });

          if (isProviderPowered) {
            totalDrawnWatts += clientNode.power.wattage || 15;
          }
        }
      }
    });

    if (vProvider.metrics) {
      vProvider.metrics.poeLoadWatts = totalDrawnWatts;
    }

    if (totalDrawnWatts > budgetWatts && isProviderPowered) {
      vProvider.status = 'red';
      vProvider.faults.push({
        code: 'POE_BUDGET_EXCEEDED',
        title: `PoE Power Budget Exceeded (${vProvider.label})`,
        message: `Total wattage drawn by APs (${totalDrawnWatts}W) exceeds this switch's maximum budget (${budgetWatts}W).`,
        why: 'Overloading a PoE power supply causes random AP reboot loops, unstable Wi-Fi, and brownouts.',
        fix: 'Add a standalone PoE Injector for high-draw APs, or upgrade to a higher-capacity PoE+ switch.',
        severity: 'error',
      });
    } else if (totalDrawnWatts > budgetWatts * 0.85 && isProviderPowered) {
      if (vProvider.status !== 'red') vProvider.status = 'yellow';
      vProvider.warnings?.push(`High PoE load: ${totalDrawnWatts}W / ${budgetWatts}W (85%+ capacity).`);
    }
  });

  // Verify PoE clients (Outdoor AP, Indoor AP, Wireless Bridge)
  nodes.forEach((node) => {
    const vNode = nodeMap.get(node.id)!;
    if (vNode.power.source === 'poe') {
      // Find upstream PoE providers connected via Ethernet
      const neighbors = adjData.get(node.id) || [];
      let receivesPoe = false;

      for (const edge of neighbors) {
        const upstream = nodeMap.get(edge.targetNodeId);
        if (upstream) {
          const isUpstreamPoe = isPoeDevice(upstream.type);
          const isUpstreamPowered = acPoweredNodes.has(upstream.id);
          const portIsPoe = edge.toPort.includes('poe') || isPoeDevice(upstream.type);

          if (isUpstreamPoe && isUpstreamPowered && portIsPoe) {
            receivesPoe = true;
            break;
          }
        }
      }

      if (!receivesPoe) {
        vNode.status = 'red';
        vNode.faults.push({
          code: 'NO_POE_POWER',
          title: `No PoE Power Detected (${vNode.label})`,
          message: `${vNode.label} is an Access Point requiring Power over Ethernet (${vNode.power.requiredStandard || '802.3af/at'}).`,
          why: 'This Access Point does not receive electrical power over its network cable.',
          fix: 'Connect this AP to a PoE Switch port, or insert an inline PoE Injector powered by AC mains.',
          severity: 'error',
        });
      }
    }
  });

  // 4. Outdoor Grounding & Surge Protection Validation
  nodes.forEach((node) => {
    const vNode = nodeMap.get(node.id)!;
    const spec = EQUIPMENT_CATALOG[node.type];

    if (spec.isOutdoor) {
      // If user marked grounding as certified or fixed on site, consider nominal
      if (node.groundingCertified) {
        return;
      }

      // Must have grounding wire attached
      const grounds = adjGround.get(node.id) || [];
      if (grounds.length === 0) {
        vNode.status = 'red';
        vNode.faults.push({
          code: 'MISSING_GROUNDING',
          title: `Missing Earth Grounding (${vNode.label})`,
          message: `${vNode.label} is mounted outdoors in an exposed area and lacks an Earth Grounding wire.`,
          why: 'In the Philippines tropical climate, frequent thunderstorms generate electrostatic build-up that can destroy equipment.',
          fix: 'Attach a Green Grounding Cable from this device’s ground terminal to an earth ground or surge arrester.',
          severity: 'error',
        });
      }
    }
  });

  // 5. Data Connectivity & Path to ISP / Router
  // Find ISP source (isp_nap, isp_pldt, isp_globe, isp_converge, or vsat_terminal)
  const ispNodes = nodes.filter((n) => n.type.startsWith('isp_') || n.type === 'vsat_terminal');
  const reachableFromIsp = new Set<string>();

  if (ispNodes.length > 0) {
    const q: string[] = ispNodes.map((n) => n.id);
    ispNodes.forEach((n) => reachableFromIsp.add(n.id));

    while (q.length > 0) {
      const curr = q.shift()!;
      const neighbors = adjData.get(curr) || [];
      for (const edge of neighbors) {
        if (!reachableFromIsp.has(edge.targetNodeId)) {
          // If node has power (or requires none), data flows
          const target = nodeMap.get(edge.targetNodeId);
          if (target) {
            const isPowered =
              target.power.requiresPower === false ||
              acPoweredNodes.has(target.id) ||
              target.power.source === 'none' ||
              (target.power.source === 'poe' && target.faults.every((f) => f.code !== 'NO_POE_POWER'));

            if (isPowered) {
              reachableFromIsp.add(edge.targetNodeId);
              q.push(edge.targetNodeId);
            }
          }
        }
      }
    }
  }

  // Find Router / Gateway
  const routerNode = nodes.find((n) => n.type === 'router_firewall');

  // Check data reachability
  nodes.forEach((node) => {
    const vNode = nodeMap.get(node.id)!;
    if (
      node.type === 'ac_power' ||
      node.type === 'ups' ||
      node.type === 'ups_3_socket' ||
      node.type === 'patch_panel' ||
      node.type === 'poe_injector' ||
      node.type.startsWith('extension_socket')
    ) {
      return;
    }

    if (ispNodes.length === 0) {
      if (node.type !== 'client_device') {
        vNode.status = 'red';
        vNode.faults.push({
          code: 'BACKBONE_DISCONNECTED',
          title: 'No ISP Demarcation Present',
          message: 'The network is missing an ISP Demarcation NAP or VSAT Terminal.',
          why: 'A network requires an active ISP internet connection or backhaul terminal to communicate with external networks.',
          fix: 'Add an ISP Demarcation / Fiber NAP or VSAT Satellite Terminal to the canvas.',
          severity: 'error',
        });
      }
      return;
    }

    if (!reachableFromIsp.has(node.id)) {
      vNode.status = 'red';
      vNode.faults.push({
        code: 'NO_DATA_UPLINK',
        title: `Disconnected from Internet Uplink (${vNode.label})`,
        message: `${vNode.label} has no continuous data path back to the ISP / Router.`,
        why: 'Data packets cannot flow if cables are missing or an intermediate device is unpowered.',
        fix: 'Draw an Ethernet or Fiber cable connecting this device to the core switch or router.',
        severity: 'error',
      });
    }
  });

  // 6. IP Addressing Validation
  const routerLanIp = routerNode?.network?.ip || '192.168.1.1';
  const routerSubnet = routerNode?.network?.subnet || '255.255.255.0';

  const usedIps = new Map<string, string[]>(); // ip -> [nodeLabels]

  nodes.forEach((node) => {
    const vNode = nodeMap.get(node.id)!;
    const net = vNode.network;
    if (
      !net ||
      node.type === 'ac_power' ||
      node.type === 'ups' ||
      node.type === 'ups_3_socket' ||
      node.type === 'patch_panel' ||
      node.type.startsWith('extension_socket') ||
      node.type.startsWith('isp_')
    ) {
      return;
    }

    // Client devices on DHCP pull from router
    if (net.isDhcp) {
      if (!routerNode) {
        vNode.status = 'red';
        vNode.faults.push({
          code: 'DHCP_NO_SERVER',
          title: `No DHCP Gateway Found (${vNode.label})`,
          message: `${vNode.label} is configured for DHCP, but no active router exists to issue an IP lease.`,
          why: 'DHCP clients require a running router/server on the network to obtain network parameters.',
          fix: 'Place a Router / Firewall on the canvas and connect it to the core switch.',
          severity: 'error',
        });
      } else {
        // Automatically assigned valid dynamic IP for simulation
        net.ip = `192.168.1.${100 + (nodes.indexOf(node) % 150)}`;
        net.subnet = routerSubnet;
        net.gateway = routerLanIp;
      }
      return;
    }

    // Static IP validations
    // Check syntax
    if (!isValidIPv4(net.ip)) {
      vNode.status = 'red';
      vNode.faults.push({
        code: 'IP_SYNTAX_INVALID',
        title: `Invalid IP Address (${vNode.label})`,
        message: `"${net.ip}" is not a valid IPv4 address.`,
        why: 'An IPv4 address must consist of 4 numbers separated by dots, each between 0 and 255.',
        fix: 'Enter a valid address like 192.168.1.20 in the Inspector panel.',
        severity: 'error',
      });
      return;
    }

    if (!isValidSubnetMask(net.subnet)) {
      vNode.status = 'red';
      vNode.faults.push({
        code: 'IP_SYNTAX_INVALID',
        title: `Invalid Subnet Mask (${vNode.label})`,
        message: `"${net.subnet}" is not a valid subnet mask.`,
        why: 'Subnet masks must be contiguous bitmasks such as 255.255.255.0 (/24).',
        fix: 'Set subnet mask to 255.255.255.0.',
        severity: 'error',
      });
      return;
    }

    // Track duplicate IP
    if (!usedIps.has(net.ip)) {
      usedIps.set(net.ip, []);
    }
    usedIps.get(net.ip)!.push(vNode.label);

    // Gateway check (if not the router itself)
    if (node.type !== 'router_firewall') {
      if (!isValidIPv4(net.gateway)) {
        vNode.status = 'red';
        vNode.faults.push({
          code: 'IP_SYNTAX_INVALID',
          title: `Invalid Default Gateway (${vNode.label})`,
          message: `Gateway "${net.gateway}" is not a valid IPv4 address.`,
          why: 'A gateway must point to the router’s LAN interface (e.g. 192.168.1.1).',
          fix: 'Set Default Gateway to 192.168.1.1.',
          severity: 'error',
        });
      } else {
        // Are IP and Gateway on same subnet?
        const onSameSubnet = areInSameSubnet(net.ip, net.gateway, net.subnet);
        if (!onSameSubnet) {
          vNode.status = 'red';
          vNode.faults.push({
            code: 'IP_SUBNET_MISMATCH',
            title: `Subnet Mismatch (${vNode.label})`,
            message: `IP ${net.ip} and Gateway ${net.gateway} are on different subnets with mask ${net.subnet}.`,
            why: `With a ${net.subnet} (/24) mask, devices must share the same network prefix to communicate directly.`,
            fix: `Change this device's IP to match the gateway subnet (e.g. 192.168.1.${net.ip.split('.')[3] || '25'}).`,
            severity: 'error',
          });
        }

        // Does gateway match router IP?
        if (routerNode && routerNode.network?.ip && net.gateway !== routerNode.network.ip) {
          vNode.status = 'yellow';
          vNode.warnings?.push(`Gateway ${net.gateway} does not match active Router IP (${routerNode.network.ip}).`);
        }
      }
    }
  });

  // Duplicate IP check
  usedIps.forEach((labels, ip) => {
    if (labels.length > 1) {
      nodes.forEach((node) => {
        const vNode = nodeMap.get(node.id)!;
        if (vNode.network?.ip === ip && !vNode.network?.isDhcp) {
          vNode.status = 'red';
          vNode.faults.push({
            code: 'IP_DUPLICATE',
            title: `IP Address Conflict (${ip})`,
            message: `Multiple devices (${labels.join(', ')}) are configured with identical IP ${ip}.`,
            why: 'Two devices with the same IP will cause ARP flapping and neither can reliably connect.',
            fix: 'Assign a unique host IP address to each device.',
            severity: 'error',
          });
        }
      });
    }
  });

  // Count summary metrics
  const validatedNodes = Array.from(nodeMap.values());
  const validatedCables = Array.from(cableMap.values());

  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let totalPowerWatts = 0;
  let estimatedTotalCostPhp = 0;

  validatedNodes.forEach((n) => {
    if (n.status === 'red') redCount++;
    else if (n.status === 'yellow') yellowCount++;
    else greenCount++;

    totalPowerWatts += n.power.wattage || 0;
    const spec = EQUIPMENT_CATALOG[n.type];
    estimatedTotalCostPhp += spec?.estimatedCostPhp || 0;
  });

  // Collect all faults for the AI Assistant / Auto-diagnosis
  const allFaults: { targetId: string; targetLabel: string; fault: FaultItem }[] = [];
  validatedNodes.forEach((n) => {
    n.faults.forEach((f) => {
      allFaults.push({ targetId: n.id, targetLabel: n.label, fault: f });
    });
  });
  validatedCables.forEach((c) => {
    c.faults.forEach((f) => {
      allFaults.push({ targetId: c.id, targetLabel: `Cable ${c.type}`, fault: f });
    });
  });

  const clients = validatedNodes.filter((n) => n.type === 'client_device');
  const allClientsOnline = clients.length > 0 && clients.every((c) => c.status === 'green');

  const summary: ValidationSummary = {
    healthy: redCount === 0 && validatedNodes.length > 0,
    greenCount,
    yellowCount,
    redCount,
    totalNodes: validatedNodes.length,
    totalCables: validatedCables.length,
    faults: allFaults,
    totalPowerWatts,
    estimatedTotalCostPhp,
    allClientsOnline,
    bandwidthAvailableMbps: routerNode ? 100 : 0,
  };

  return {
    validatedNodes,
    validatedCables,
    summary,
  };
}
