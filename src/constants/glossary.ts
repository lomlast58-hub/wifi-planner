export interface GlossaryItem {
  id: string;
  term: string;
  shortDef: string;
  fullExplanation: string;
  practicalContext: string;
  example: string;
}

export const NETWORKING_GLOSSARY: GlossaryItem[] = [
  {
    id: 'ip-address',
    term: 'IP Address',
    shortDef: 'A unique digital identifier (e.g., 192.168.1.10) assigned to every device on a network.',
    fullExplanation:
      'Like a street address for mail delivery, an IP address ensures data packets find the exact computer, phone, or access point they are meant for. In IPv4, it consists of four numbers separated by dots (0-255).',
    practicalContext:
      'In production wireless networks, the router hands out IP addresses automatically to connecting devices so they can browse the web without manual configuration.',
    example: '192.168.1.50',
  },
  {
    id: 'subnet-mask',
    term: 'Subnet Mask',
    shortDef: 'Defines the boundary between the network portion and the host portion of an IP address.',
    fullExplanation:
      'A subnet mask tells devices which other IP addresses are in the same local segment (same subnet) and which require sending packets through the gateway to reach. A mask of 255.255.255.0 (/24) means devices must match in the first three octets to communicate directly.',
    practicalContext:
      'Commonly set to 255.255.255.0 (/24) for up to 254 devices, or 255.255.252.0 (/22) in large public assembly venues to support up to 1,022 simultaneous users.',
    example: '255.255.255.0 (/24)',
  },
  {
    id: 'default-gateway',
    term: 'Default Gateway',
    shortDef: 'The router doorway that devices send traffic to when trying to reach the Internet.',
    fullExplanation:
      'When your device wants to load external websites or cloud services, it recognizes that those servers are outside the local network. It sends all outbound traffic to its Default Gateway (usually the LAN IP of your site router).',
    practicalContext:
      'If an Access Point has the wrong Gateway configured, clients can connect to the Wi-Fi signal but will see "No Internet connection" on their devices.',
    example: '192.168.1.1',
  },
  {
    id: 'dhcp',
    term: 'DHCP (Dynamic Host Configuration Protocol)',
    shortDef: 'An automated service that leases IP addresses and network settings to connecting client devices.',
    fullExplanation:
      'Without DHCP, every user entering a facility would need to manually type in an IP address, subnet mask, and DNS before they could browse. DHCP automatically leases an address instantly upon wireless connection.',
    practicalContext:
      'The core gateway router runs a DHCP server pool sized according to expected public traffic (e.g., 192.168.1.50 to 192.168.1.250).',
    example: 'Pool: 192.168.1.100 - 192.168.1.250 (Lease: 2 hours)',
  },
  {
    id: 'poe',
    term: 'PoE (Power over Ethernet)',
    shortDef: 'A technology allowing a single Cat6 network cable to transmit electrical power alongside data.',
    fullExplanation:
      'Eliminates the need to run 220V electrical AC outlets up to high ceilings or outdoor light poles. Standards include 802.3af (up to 15.4W) and 802.3at PoE+ (up to 30W), which is required for high-power outdoor Wi-Fi 6 APs.',
    practicalContext:
      'Outdoor APs in stadiums and covered grounds run entirely on PoE from the central rack, keeping high-voltage AC safely inside the locked equipment room.',
    example: '802.3at (PoE+) providing 22W over 45m of Cat6',
  },
  {
    id: 'ont-onu',
    term: 'ONT / ONU (Optical Network Terminal)',
    shortDef: 'The hardware device that transforms laser light from fiber optic cable into electrical Ethernet data.',
    fullExplanation:
      'Fiber optic lines carry pulses of light over glass strands. The ONT receives this optical signal and converts it into standard copper RJ45 Gigabit Ethernet that plugs into your router’s WAN port.',
    practicalContext:
      'Installed at the entrance demarcation point where the contracted fiber ISP brings the drop line into the building. Marked as ISP provided equipment in BOM.',
    example: 'SC/APC Optical In -> RJ45 Gigabit Ethernet Out',
  },
  {
    id: 'bandwidth',
    term: 'Bandwidth (Throughput)',
    shortDef: 'The maximum data transfer capacity of the Internet connection, measured in Megabits per second (Mbps).',
    fullExplanation:
      'Higher bandwidth allows more users to browse, stream, and conduct online cloud transactions simultaneously without experiencing lag or buffering.',
    practicalContext:
      'Small offices usually configure 20-50 Mbps, while large multi-building campuses or training centers deploy 100-500 Mbps dedicated throughput.',
    example: '50 Mbps Dedicated Internet Access (DIA)',
  },
  {
    id: 'ssid',
    term: 'SSID (Service Set Identifier)',
    shortDef: 'The broadcasted name of the wireless network that users see on their Wi-Fi picker.',
    fullExplanation:
      'The human-readable label broadcasted by Access Points so phones and laptops know which Wi-Fi network they are joining.',
    practicalContext:
      'Configured across all access points with seamless roaming so users stay connected as they walk between indoor rooms and outdoor areas.',
    example: '"TEPBIZ-SECURE-WIFI"',
  },
  {
    id: 'vsat-gida',
    term: 'VSAT (Satellite Earth Terminal)',
    shortDef: 'Satellite-delivered Internet for remote facilities where terrestrial fiber and cell towers cannot reach.',
    fullExplanation:
      'VSAT (Very Small Aperture Terminal) bounces Internet signals directly to geostationary or low-Earth orbit satellites. While latency is higher, it brings vital connectivity to isolated communities.',
    practicalContext:
      'Used as primary backhaul for remote island clinics, mountain lookouts, or disaster emergency backup stations.',
    example: '0.9m Dish + Satellite Transceiver pointing at satellite horizon',
  },
  {
    id: 'lightning-arrester',
    term: 'Surge Protector & Earth Grounding',
    shortDef: 'Protective hardware diverting high-voltage atmospheric lightning strikes safely into the earth.',
    fullExplanation:
      'Outdoor APs mounted on high poles attract static buildup that can travel along Ethernet cables and destroy expensive switches.',
    practicalContext:
      'Professional installations require an in-line lightning arrester and solid copper grounding wire bonded to an earth ground rod or building structural steel.',
    example: 'In-line RJ45 Surge Suppressor bonded to Copper Earth Rod',
  },
  {
    id: 'cat6-limit',
    term: '100-Meter Ethernet Distance Limit',
    shortDef: 'The maximum allowable physical length for a standard Cat5e or Cat6 copper Ethernet cable run.',
    fullExplanation:
      'Electrical resistance and signal attenuation cause high-frequency data packets to degrade severely beyond 100 meters (328 feet), leading to packet loss and link drops. For runs exceeding 100m, fiber optic cable or a repeater switch must be used.',
    practicalContext:
      'When wiring an outdoor AP across an entire sports complex or campus grounds, check the run distance. If over 100m, use fiber with a media converter or a wireless bridge.',
    example: 'Main Building to far court corner: 125m -> Must use fiber or bridge!',
  },
];
