export type EquipmentCategory = 'backbone' | 'core' | 'power' | 'access';

export type EquipmentType =
  | 'isp_nap'
  | 'isp_pldt'
  | 'isp_globe'
  | 'isp_converge'
  | 'ont_onu'
  | 'dsl_modem'
  | 'vsat_terminal'
  | 'router_firewall'
  | 'switch_4p_poe'
  | 'core_switch_poe'
  | 'switch_16p_poe'
  | 'switch_4p_non_poe'
  | 'core_switch_non_poe'
  | 'switch_16p_non_poe'
  | 'patch_panel'
  | 'poe_injector'
  | 'ups'
  | 'ups_3_socket'
  | 'extension_socket'
  | 'extension_socket_2p'
  | 'extension_socket_3p'
  | 'extension_socket_4p'
  | 'surge_arrester'
  | 'ac_power'
  | 'outdoor_ap'
  | 'indoor_ap'
  | 'wireless_bridge'
  | 'client_device';

export type CableType = 'ac_power' | 'ethernet' | 'fiber';

export type PortType = 'ac_in' | 'ac_out' | 'rj45' | 'rj45_poe_in' | 'rj45_poe_out' | 'fiber_sc';

export type NodeStatus = 'green' | 'yellow' | 'red' | 'idle';

export interface PortDefinition {
  id: string;
  name: string;
  type: PortType;
  label?: string;
}

export interface NetworkConfig {
  ip: string;
  subnet: string;
  gateway: string;
  isDhcp: boolean;
  dns?: string;
  ssid?: string;
}

export interface PowerConfig {
  requiresPower: boolean;
  source: 'ac' | 'poe' | 'dc' | 'none';
  requiredStandard?: '802.3af' | '802.3at' | '802.3bt';
  wattage: number; // Consumption in Watts
  poeBudgetWatts?: number; // Provided PoE capacity
  upsCapacityVA?: number;
  batteryRuntimeMins?: number;
}

export interface EquipmentSpec {
  type: EquipmentType;
  name: string;
  category: EquipmentCategory;
  description: string;
  networkRole: string; // Architectural deployment role
  dictRole?: string;
  defaultPower: PowerConfig;
  hasNetworkConfig: boolean;
  ports: PortDefinition[];
  maxRangeMeters?: number;
  maxThroughputMbps?: number;
  maxClients?: number;
  isOutdoor?: boolean;
  estimatedCostPhp: number;
}

export interface NetworkNode {
  id: string;
  type: EquipmentType;
  label: string;
  structureId?: string | null;
  position: { x: number; y: number };
  power: PowerConfig;
  network?: NetworkConfig;
  status: NodeStatus;
  faults: FaultItem[];
  warnings?: string[];
  groundingCertified?: boolean;
  metrics?: {
    connectedClients?: number;
    currentThroughputMbps?: number;
    poeLoadWatts?: number;
  };
}

export interface Structure {
  id: string;
  label: string;
  type: 'barangay_hall' | 'covered_court' | 'health_center' | 'school' | 'plaza' | 'library' | 'generic';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface CableRun {
  id: string;
  type: CableType;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  lengthMeters: number;
  status: NodeStatus;
  faults: FaultItem[];
}

export type FaultCode =
  | 'NO_AC_POWER'
  | 'NO_POE_POWER'
  | 'POE_BUDGET_EXCEEDED'
  | 'DISTANCE_EXCEEDED'
  | 'PORT_MEDIA_MISMATCH'
  | 'MISSING_SURGE_PROTECTION'
  | 'NO_DATA_UPLINK'
  | 'IP_SYNTAX_INVALID'
  | 'IP_SUBNET_MISMATCH'
  | 'IP_DUPLICATE'
  | 'GATEWAY_NOT_FOUND'
  | 'DHCP_NO_SERVER'
  | 'BACKBONE_DISCONNECTED'
  | 'CLIENT_UNAUTHENTICATED'
  | 'WARNING_BANDWIDTH_CHOKE'
  | 'WARNING_HIGH_POE_LOAD';

export interface FaultItem {
  code: FaultCode;
  title: string;
  message: string;
  why: string;
  fix: string;
  severity: 'error' | 'warning';
}

export interface ValidationSummary {
  healthy: boolean;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  totalNodes: number;
  totalCables: number;
  faults: { targetId: string; targetLabel: string; fault: FaultItem }[];
  totalPowerWatts: number;
  estimatedTotalCostPhp: number;
  allClientsOnline: boolean;
  bandwidthAvailableMbps: number;
}
