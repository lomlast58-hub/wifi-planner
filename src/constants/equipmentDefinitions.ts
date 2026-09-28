import { EquipmentSpec, EquipmentType } from '../types/network';

export const EQUIPMENT_CATALOG: Record<EquipmentType, EquipmentSpec> = {
  // ISP Demarcation Options
  isp_pldt: {
    type: 'isp_pldt',
    name: 'PLDT Enterprise Fiber NAP',
    category: 'backbone',
    description: 'PLDT Enterprise optical hand-off demarcation point (FTTH/Metro Ethernet).',
    networkRole: 'Commercial contracted optical backbone connection.',
    defaultPower: { requiresPower: false, source: 'none', wattage: 0 },
    hasNetworkConfig: false,
    ports: [
      { id: 'fiber_out', name: 'Fiber Drop Port', type: 'fiber_sc', label: 'PLDT Fiber' },
    ],
    maxThroughputMbps: 100,
    estimatedCostPhp: 0,
  },

  isp_globe: {
    type: 'isp_globe',
    name: 'Globe Business Fiber NAP',
    category: 'backbone',
    description: 'Globe Business telecom optical entry point (Dedicated Internet Access).',
    networkRole: 'Commercial telecom dedicated uplink provider.',
    defaultPower: { requiresPower: false, source: 'none', wattage: 0 },
    hasNetworkConfig: false,
    ports: [
      { id: 'fiber_out', name: 'Fiber Drop Port', type: 'fiber_sc', label: 'Globe Fiber' },
    ],
    maxThroughputMbps: 100,
    estimatedCostPhp: 0,
  },

  isp_converge: {
    type: 'isp_converge',
    name: 'Converge ICT Fiber NAP',
    category: 'backbone',
    description: 'Converge ICT pure fiber demarcation box.',
    networkRole: 'Pure fiber backhaul hand-off point.',
    defaultPower: { requiresPower: false, source: 'none', wattage: 0 },
    hasNetworkConfig: false,
    ports: [
      { id: 'fiber_out', name: 'Fiber Drop Port', type: 'fiber_sc', label: 'Converge Fiber' },
    ],
    maxThroughputMbps: 100,
    estimatedCostPhp: 0,
  },

  isp_nap: {
    type: 'isp_nap',
    name: 'Dedicated Fiber Demarcation (NAP)',
    category: 'backbone',
    description: 'Carrier network entry terminal delivering dedicated enterprise fiber connectivity.',
    networkRole: 'Primary external fiber uplink connection.',
    defaultPower: { requiresPower: false, source: 'none', wattage: 0 },
    hasNetworkConfig: false,
    ports: [
      { id: 'fiber_out', name: 'Carrier Fiber Port', type: 'fiber_sc', label: 'Fiber Out' },
    ],
    maxThroughputMbps: 100,
    estimatedCostPhp: 0,
  },

  ont_onu: {
    type: 'ont_onu',
    name: 'ONT / ONU Optical Terminal',
    category: 'backbone',
    description: 'Optical Network Terminal converting incoming light signals to Gigabit RJ45 Ethernet.',
    networkRole: 'ISP Provided optical modem connecting fiber NAP to gateway router.',
    defaultPower: { requiresPower: true, source: 'ac', wattage: 12 },
    hasNetworkConfig: false,
    ports: [
      { id: 'pon_in', name: 'PON / SC Optical In', type: 'fiber_sc', label: 'Optical In' },
      { id: 'lan_out', name: 'GE LAN 1 Out', type: 'rj45', label: 'LAN 1' },
      { id: 'pwr_in', name: '12V DC / AC Power', type: 'ac_in', label: 'Power In' },
    ],
    maxThroughputMbps: 1000,
    estimatedCostPhp: 2500,
  },

  dsl_modem: {
    type: 'dsl_modem',
    name: 'Broadband / DSL Modem',
    category: 'backbone',
    description: 'Broadband modem transceiver for copper or legacy uplink delivery.',
    networkRole: 'Secondary or alternate WAN provider connection.',
    defaultPower: { requiresPower: true, source: 'ac', wattage: 10 },
    hasNetworkConfig: false,
    ports: [
      { id: 'line_in', name: 'RJ11 / Copper In', type: 'rj45', label: 'Line In' },
      { id: 'lan_out', name: 'LAN Out', type: 'rj45', label: 'Ethernet' },
      { id: 'pwr_in', name: 'Power Port', type: 'ac_in', label: 'Power In' },
    ],
    maxThroughputMbps: 25,
    estimatedCostPhp: 2000,
  },

  vsat_terminal: {
    type: 'vsat_terminal',
    name: 'VSAT Satellite Terminal',
    category: 'backbone',
    description: 'High-throughput satellite transceiver (IDU modem + ODU dish) for remote facilities.',
    networkRole: 'Satellite backhaul link for isolated facilities without terrestrial fiber.',
    defaultPower: { requiresPower: true, source: 'ac', wattage: 65 },
    hasNetworkConfig: false,
    ports: [
      { id: 'sat_lan', name: 'Satellite LAN Out', type: 'rj45', label: 'LAN Out' },
      { id: 'pwr_in', name: 'AC 220V In', type: 'ac_in', label: 'Power In' },
      { id: 'gnd', name: 'Earth Ground', type: 'ground_lug', label: 'Ground' },
    ],
    maxThroughputMbps: 15,
    estimatedCostPhp: 85000,
  },

  router_firewall: {
    type: 'router_firewall',
    name: 'Router / Firewall Gateway',
    category: 'core',
    description: 'Enterprise gateway handling WAN/LAN routing, NAT, captive portal, and DHCP server.',
    networkRole: 'Core traffic management, default gateway, and subnet routing.',
    defaultPower: { requiresPower: true, source: 'ac', wattage: 24 },
    hasNetworkConfig: true,
    ports: [
      { id: 'wan_port', name: 'WAN 1 Port', type: 'rj45', label: 'WAN' },
      { id: 'lan_port1', name: 'LAN 1 Port', type: 'rj45', label: 'LAN 1' },
      { id: 'lan_port2', name: 'LAN 2 Port', type: 'rj45', label: 'LAN 2' },
      { id: 'pwr_in', name: 'AC 220V Power In', type: 'ac_in', label: 'Power In' },
    ],
    maxThroughputMbps: 1000,
    estimatedCostPhp: 18000,
  },

  // 4-Port PoE Switch
  switch_4p_poe: {
    type: 'switch_4p_poe',
    name: '4-Port PoE+ Gigabit Switch',
    category: 'core',
    description: 'Compact 4-port Gigabit PoE+ switch for small facilities or single-building wings.',
    networkRole: 'Powers up to 4 access points or IP devices over Ethernet.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 20,
      poeBudgetWatts: 65,
    },
    hasNetworkConfig: true,
    ports: [
      { id: 'uplink', name: 'Uplink (to Router)', type: 'rj45', label: 'Uplink' },
      { id: 'poe1', name: 'PoE Port 1', type: 'rj45_poe_out', label: 'PoE 1' },
      { id: 'poe2', name: 'PoE Port 2', type: 'rj45_poe_out', label: 'PoE 2' },
      { id: 'poe3', name: 'PoE Port 3', type: 'rj45_poe_out', label: 'PoE 3' },
      { id: 'poe4', name: 'PoE Port 4', type: 'rj45_poe_out', label: 'PoE 4' },
      { id: 'pwr_in', name: 'AC Power In', type: 'ac_in', label: 'Power In' },
    ],
    maxThroughputMbps: 1000,
    estimatedCostPhp: 8500,
  },

  // 8-Port PoE Switch (Core Switch)
  core_switch_poe: {
    type: 'core_switch_poe',
    name: '8-Port Managed PoE+ Switch',
    category: 'core',
    description: '8-Port Managed Gigabit PoE+ switch (802.3at up to 130W) powering multiple APs.',
    networkRole: 'Primary distribution switch powering access points and network bridges.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 35,
      poeBudgetWatts: 130,
    },
    hasNetworkConfig: true,
    ports: [
      { id: 'uplink', name: 'Uplink Port (G1)', type: 'rj45', label: 'Uplink' },
      { id: 'poe1', name: 'PoE Port 1', type: 'rj45_poe_out', label: 'PoE 1' },
      { id: 'poe2', name: 'PoE Port 2', type: 'rj45_poe_out', label: 'PoE 2' },
      { id: 'poe3', name: 'PoE Port 3', type: 'rj45_poe_out', label: 'PoE 3' },
      { id: 'poe4', name: 'PoE Port 4', type: 'rj45_poe_out', label: 'PoE 4' },
      { id: 'poe5', name: 'PoE Port 5', type: 'rj45_poe_out', label: 'PoE 5' },
      { id: 'poe6', name: 'PoE Port 6', type: 'rj45_poe_out', label: 'PoE 6' },
      { id: 'poe7', name: 'PoE Port 7', type: 'rj45_poe_out', label: 'PoE 7' },
      { id: 'poe8', name: 'PoE Port 8', type: 'rj45_poe_out', label: 'PoE 8' },
      { id: 'pwr_in', name: 'AC Power In', type: 'ac_in', label: 'Power In' },
    ],
    maxThroughputMbps: 1000,
    estimatedCostPhp: 14500,
  },

  // 16-Port PoE Switch
  switch_16p_poe: {
    type: 'switch_16p_poe',
    name: '16-Port Managed PoE+ Switch',
    category: 'core',
    description: 'High-density 16-port Gigabit PoE+ switch (250W power budget) for campus installations.',
    networkRole: 'Central distribution switch for high-density buildings.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 50,
      poeBudgetWatts: 250,
    },
    hasNetworkConfig: true,
    ports: [
      { id: 'uplink', name: 'SFP/Uplink 1', type: 'rj45', label: 'Uplink' },
      ...Array.from({ length: 16 }, (_, i) => ({
        id: `poe${i + 1}`,
        name: `PoE Port ${i + 1}`,
        type: 'rj45_poe_out' as const,
        label: `PoE ${i + 1}`,
      })),
      { id: 'pwr_in', name: 'AC Power In', type: 'ac_in', label: 'Power In' },
    ],
    maxThroughputMbps: 1000,
    estimatedCostPhp: 28500,
  },

  // 4-Port Non-PoE Switch Hub
  switch_4p_non_poe: {
    type: 'switch_4p_non_poe',
    name: '4-Port Switch Hub (Non-PoE)',
    category: 'core',
    description: 'Standard 4-port Gigabit Ethernet switch hub without PoE injection.',
    networkRole: 'Basic wired expansion for PCs, printers, and workstations.',
    defaultPower: { requiresPower: true, source: 'ac', wattage: 8 },
    hasNetworkConfig: true,
    ports: [
      { id: 'uplink', name: 'Uplink Port', type: 'rj45', label: 'Uplink' },
      { id: 'port1', name: 'LAN Port 1', type: 'rj45', label: 'Port 1' },
      { id: 'port2', name: 'LAN Port 2', type: 'rj45', label: 'Port 2' },
      { id: 'port3', name: 'LAN Port 3', type: 'rj45', label: 'Port 3' },
      { id: 'port4', name: 'LAN Port 4', type: 'rj45', label: 'Port 4' },
      { id: 'pwr_in', name: 'AC Power In', type: 'ac_in', label: 'Power In' },
    ],
    maxThroughputMbps: 1000,
    estimatedCostPhp: 2200,
  },

  // 8-Port Non-PoE Switch Hub
  core_switch_non_poe: {
    type: 'core_switch_non_poe',
    name: '8-Port Switch Hub (Non-PoE)',
    category: 'core',
    description: 'Standard 8-port Gigabit data switch hub without inline PoE.',
    networkRole: 'Data distribution for offices and computer labs.',
    defaultPower: { requiresPower: true, source: 'ac', wattage: 15 },
    hasNetworkConfig: true,
    ports: [
      { id: 'uplink', name: 'Uplink Port', type: 'rj45', label: 'Uplink' },
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `port${i + 1}`,
        name: `LAN Port ${i + 1}`,
        type: 'rj45' as const,
        label: `Port ${i + 1}`,
      })),
      { id: 'pwr_in', name: 'AC Power In', type: 'ac_in', label: 'Power In' },
    ],
    maxThroughputMbps: 1000,
    estimatedCostPhp: 5500,
  },

  // 16-Port Non-PoE Switch
  switch_16p_non_poe: {
    type: 'switch_16p_non_poe',
    name: '16-Port Gigabit Switch (Non-PoE)',
    category: 'core',
    description: 'Rackmount 16-port Gigabit switch for general network distribution.',
    networkRole: 'Facility aggregation switch connecting multiple rooms and patch panels.',
    defaultPower: { requiresPower: true, source: 'ac', wattage: 25 },
    hasNetworkConfig: true,
    ports: [
      { id: 'uplink', name: 'Uplink Port', type: 'rj45', label: 'Uplink' },
      ...Array.from({ length: 16 }, (_, i) => ({
        id: `port${i + 1}`,
        name: `LAN Port ${i + 1}`,
        type: 'rj45' as const,
        label: `Port ${i + 1}`,
      })),
      { id: 'pwr_in', name: 'AC Power In', type: 'ac_in', label: 'Power In' },
    ],
    maxThroughputMbps: 1000,
    estimatedCostPhp: 12500,
  },

  patch_panel: {
    type: 'patch_panel',
    name: 'Patch Panel / Server Rack',
    category: 'core',
    description: 'Structured cabling termination panel for organizing and labeling building cable runs.',
    networkRole: 'Structured physical cable management inside data racks.',
    defaultPower: { requiresPower: false, source: 'none', wattage: 0 },
    hasNetworkConfig: false,
    ports: [
      { id: 'panel_in', name: 'Incoming Jack', type: 'rj45', label: 'In' },
      { id: 'panel_out', name: 'Patch Lead Out', type: 'rj45', label: 'Out' },
    ],
    estimatedCostPhp: 3200,
  },

  // Standalone Physical PoE Injector
  poe_injector: {
    type: 'poe_injector',
    name: 'Standalone PoE Injector',
    category: 'power',
    description: 'Inline PoE injector adapter with Data In, PoE Out, and 220V AC input on the right side.',
    networkRole: 'Provides 48V inline power injection to Access Points from non-PoE switches or routers.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 3,
      poeBudgetWatts: 30,
    },
    hasNetworkConfig: false,
    ports: [
      { id: 'data_in', name: 'Data In (LAN)', type: 'rj45', label: 'Data In' },
      { id: 'poe_out', name: 'PoE Out (+48V Power)', type: 'rj45_poe_out', label: 'PoE Out' },
      { id: 'pwr_in', name: '220V AC Power In', type: 'ac_in', label: 'AC In' },
    ],
    estimatedCostPhp: 1800,
  },

  // UPS with 1 socket as requested
  ups: {
    type: 'ups',
    name: 'Online UPS (1-Socket)',
    category: 'power',
    description: 'Uninterruptible Power Supply with Automatic Voltage Regulation (AVR) featuring 1 dedicated backed-up AC socket.',
    networkRole: 'Provides battery backup and voltage regulation for single core device.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 15,
      upsCapacityVA: 650,
      batteryRuntimeMins: 30,
    },
    hasNetworkConfig: false,
    ports: [
      { id: 'ac_in', name: 'Mains Wall Plug In', type: 'ac_in', label: 'AC In' },
      { id: 'ac_out', name: 'Backup Socket 1', type: 'ac_out', label: 'AC Out 1' },
    ],
    estimatedCostPhp: 4800,
  },

  // UPS with 3 sockets as requested
  ups_3_socket: {
    type: 'ups_3_socket',
    name: 'Online UPS (3-Sockets)',
    category: 'power',
    description: 'Uninterruptible Power Supply with Automatic Voltage Regulation (AVR) featuring 3 isolated backed-up AC sockets.',
    networkRole: 'Provides simultaneous battery backup to router, switch, and ONT.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 25,
      upsCapacityVA: 1500,
      batteryRuntimeMins: 45,
    },
    hasNetworkConfig: false,
    ports: [
      { id: 'ac_in', name: 'Mains Wall Plug In', type: 'ac_in', label: 'AC In' },
      { id: 'ac_out1', name: 'Backup Socket 1', type: 'ac_out', label: 'Socket 1' },
      { id: 'ac_out2', name: 'Backup Socket 2', type: 'ac_out', label: 'Socket 2' },
      { id: 'ac_out3', name: 'Backup Socket 3', type: 'ac_out', label: 'Socket 3' },
    ],
    estimatedCostPhp: 8900,
  },

  extension_socket: {
    type: 'extension_socket',
    name: 'AC Power Strip / Extension (6-Way PDU)',
    category: 'power',
    description: '6-gang 220V AC power distribution strip with surge suppression for connecting multiple devices to a single UPS or wall outlet.',
    networkRole: 'Distributes AC mains power to router, ONT, switch, and accessories inside rack cabinet.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 1,
    },
    hasNetworkConfig: false,
    ports: [
      { id: 'ac_in', name: 'PDU Plug In', type: 'ac_in', label: 'Plug In' },
      { id: 'ac_out1', name: 'Outlet 1', type: 'ac_out', label: 'Out 1' },
      { id: 'ac_out2', name: 'Outlet 2', type: 'ac_out', label: 'Out 2' },
      { id: 'ac_out3', name: 'Outlet 3', type: 'ac_out', label: 'Out 3' },
      { id: 'ac_out4', name: 'Outlet 4', type: 'ac_out', label: 'Out 4' },
      { id: 'ac_out5', name: 'Outlet 5', type: 'ac_out', label: 'Out 5' },
      { id: 'ac_out6', name: 'Outlet 6', type: 'ac_out', label: 'Out 6' },
    ],
    estimatedCostPhp: 950,
  },

  extension_socket_2p: {
    type: 'extension_socket_2p',
    name: 'AC Extension Socket (2-Socket)',
    category: 'power',
    description: 'Dual-outlet 220V AC power extension box with built-in surge suppression.',
    networkRole: 'Provides 2 protected AC power output outlets from a single wall or UPS supply.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 1,
    },
    hasNetworkConfig: false,
    ports: [
      { id: 'ac_in', name: 'AC Input Plug', type: 'ac_in', label: 'AC In' },
      { id: 'ac_out1', name: 'Socket 1 Out', type: 'ac_out', label: 'Socket 1' },
      { id: 'ac_out2', name: 'Socket 2 Out', type: 'ac_out', label: 'Socket 2' },
    ],
    estimatedCostPhp: 450,
  },

  extension_socket_3p: {
    type: 'extension_socket_3p',
    name: 'AC Extension Socket (3-Socket)',
    category: 'power',
    description: 'Triple-outlet 220V AC power extension box with illuminated power switch.',
    networkRole: 'Provides 3 protected AC power output outlets for router, switch, and ONT.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 1,
    },
    hasNetworkConfig: false,
    ports: [
      { id: 'ac_in', name: 'AC Input Plug', type: 'ac_in', label: 'AC In' },
      { id: 'ac_out1', name: 'Socket 1 Out', type: 'ac_out', label: 'Socket 1' },
      { id: 'ac_out2', name: 'Socket 2 Out', type: 'ac_out', label: 'Socket 2' },
      { id: 'ac_out3', name: 'Socket 3 Out', type: 'ac_out', label: 'Socket 3' },
    ],
    estimatedCostPhp: 550,
  },

  extension_socket_4p: {
    type: 'extension_socket_4p',
    name: 'AC Extension Socket (4-Socket)',
    category: 'power',
    description: '4-gang 220V AC power extension strip with individual socket surge protection.',
    networkRole: 'Provides 4 AC power outlets for network cabinet equipment.',
    defaultPower: {
      requiresPower: true,
      source: 'ac',
      wattage: 1,
    },
    hasNetworkConfig: false,
    ports: [
      { id: 'ac_in', name: 'AC Input Plug', type: 'ac_in', label: 'AC In' },
      { id: 'ac_out1', name: 'Socket 1 Out', type: 'ac_out', label: 'Socket 1' },
      { id: 'ac_out2', name: 'Socket 2 Out', type: 'ac_out', label: 'Socket 2' },
      { id: 'ac_out3', name: 'Socket 3 Out', type: 'ac_out', label: 'Socket 3' },
      { id: 'ac_out4', name: 'Socket 4 Out', type: 'ac_out', label: 'Socket 4' },
    ],
    estimatedCostPhp: 700,
  },

  surge_arrester: {
    type: 'surge_arrester',
    name: 'Surge Protector / Lightning Arrester',
    category: 'power',
    description: 'In-line Ethernet surge suppressor protecting indoor switches from high-voltage outdoor lightning strikes.',
    networkRole: 'Surge suppression for all exterior-mounted AP cable entry points.',
    defaultPower: { requiresPower: false, source: 'none', wattage: 0 },
    hasNetworkConfig: false,
    ports: [
      { id: 'eth_in', name: 'Protected Switch Side', type: 'rj45', label: 'Equip' },
      { id: 'eth_out', name: 'Exposed Line Side', type: 'rj45', label: 'Line' },
      { id: 'gnd', name: 'Copper Earth Ground', type: 'ground_lug', label: 'Ground' },
    ],
    estimatedCostPhp: 2200,
  },

  ac_power: {
    type: 'ac_power',
    name: 'AC Mains Power (Single 220V Outlet)',
    category: 'power',
    description: 'Standard 220V AC utility grid wall outlet (220V AC, 60Hz single-phase).',
    networkRole: 'Primary source of electrical energy for active telecommunications equipment.',
    defaultPower: { requiresPower: false, source: 'none', wattage: 0 },
    hasNetworkConfig: false,
    ports: [
      { id: 'ac_out', name: 'Single 220V AC Outlet', type: 'ac_out', label: '220V Out' },
    ],
    estimatedCostPhp: 500,
  },

  outdoor_ap: {
    type: 'outdoor_ap',
    name: 'Outdoor Weatherproof AP',
    category: 'access',
    description: 'IP67 rated dual-band Wi-Fi 6 AP designed for outdoor plazas, courts, and campus grounds.',
    networkRole: 'High-density outdoor wireless coverage broadcaster.',
    defaultPower: {
      requiresPower: true,
      source: 'poe',
      requiredStandard: '802.3at',
      wattage: 22,
    },
    hasNetworkConfig: true,
    ports: [
      { id: 'poe_in', name: 'Gigabit PoE In', type: 'rj45_poe_in', label: 'PoE In' },
      { id: 'gnd', name: 'Grounding Terminal', type: 'ground_lug', label: 'Ground' },
    ],
    maxRangeMeters: 150,
    maxThroughputMbps: 1200,
    maxClients: 250,
    isOutdoor: true,
    estimatedCostPhp: 19500,
  },

  indoor_ap: {
    type: 'indoor_ap',
    name: 'Indoor Ceiling AP',
    category: 'access',
    description: 'Ceiling or wall-mounted dual-band enterprise AP for administrative offices, rooms, and facilities.',
    networkRole: 'Provides reliable indoor wireless coverage for clients and workstations.',
    defaultPower: {
      requiresPower: true,
      source: 'poe',
      requiredStandard: '802.3af',
      wattage: 11,
    },
    hasNetworkConfig: true,
    ports: [
      { id: 'poe_in', name: 'Gigabit PoE In', type: 'rj45_poe_in', label: 'PoE In' },
    ],
    maxRangeMeters: 35,
    maxThroughputMbps: 1200,
    maxClients: 120,
    isOutdoor: false,
    estimatedCostPhp: 9800,
  },

  wireless_bridge: {
    type: 'wireless_bridge',
    name: 'PtP Wireless Bridge',
    category: 'access',
    description: 'Point-to-Point 5GHz directional radio link connecting buildings up to 5km without trenching fiber.',
    networkRole: 'Connects separated buildings or outlying facilities across open terrain.',
    defaultPower: {
      requiresPower: true,
      source: 'poe',
      requiredStandard: '802.3af',
      wattage: 8.5,
    },
    hasNetworkConfig: true,
    ports: [
      { id: 'poe_in', name: 'PoE Data In', type: 'rj45_poe_in', label: 'PoE In' },
      { id: 'gnd', name: 'Grounding Lug', type: 'ground_lug', label: 'Ground' },
    ],
    maxRangeMeters: 5000,
    maxThroughputMbps: 450,
    isOutdoor: true,
    estimatedCostPhp: 8500,
  },

  client_device: {
    type: 'client_device',
    name: 'Client Device (Phone / Laptop)',
    category: 'access',
    description: 'Smartphones, laptops, and tablets connecting to wireless access points.',
    networkRole: 'Endpoint client device authenticating and accessing local/WAN network.',
    defaultPower: { requiresPower: false, source: 'none', wattage: 0 },
    hasNetworkConfig: true,
    ports: [
      { id: 'wifi_link', name: 'Wi-Fi Air Link', type: 'rj45', label: 'Wi-Fi' },
    ],
    estimatedCostPhp: 0,
  },
};

export const CABLE_DEFINITIONS = {
  ac_power: {
    name: 'AC Electrical (220V)',
    color: '#ef4444',
    strokeWidth: 3.5,
    dashArray: 'none',
    maxDistanceMeters: 50,
    description: 'Carries 220V AC mains electricity. Powered equipment is dead without this.',
  },
  ethernet: {
    name: 'LAN / Cat6 Ethernet',
    color: '#38bdf8',
    strokeWidth: 2.5,
    dashArray: 'none',
    maxDistanceMeters: 100,
    description: 'Carries data and inline PoE power. Maximum certified copper run is 100 meters.',
  },
  fiber: {
    name: 'Fiber Optic (Single-Mode)',
    color: '#f59e0b',
    strokeWidth: 2.5,
    dashArray: 'none',
    maxDistanceMeters: 10000,
    description: 'High-speed optical cable. Immune to electrical surges and capable of multi-kilometer runs.',
  },
  grounding: {
    name: 'Copper Grounding Wire',
    color: '#22c55e',
    strokeWidth: 2,
    dashArray: '5,4',
    maxDistanceMeters: 20,
    description: 'Direct bond to earth grounding rod. Required on all outdoor APs and surge arresters.',
  },
};
