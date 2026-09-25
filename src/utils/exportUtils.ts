import { CableRun, NetworkNode, Structure } from '../types/network';
import { EQUIPMENT_CATALOG, CABLE_DEFINITIONS } from '../constants/equipmentDefinitions';

export function exportBomCsv(nodes: NetworkNode[], cables: CableRun[]): string {
  // Aggregate equipment quantities
  const counts = new Map<string, { count: number; node: NetworkNode }>();
  nodes.forEach((n) => {
    const existing = counts.get(n.type);
    if (existing) {
      existing.count++;
    } else {
      counts.set(n.type, { count: 1, node: n });
    }
  });

  const rows: string[] = [
    'Category,Equipment Name,Item Code,Quantity,Unit Cost (PHP),Total Cost (PHP),Power Specs,Deployment Role',
  ];

  let grandTotal = 0;

  counts.forEach(({ count, node }) => {
    const spec = EQUIPMENT_CATALOG[node.type];
    const unitCost = spec.estimatedCostPhp || 0;
    const total = unitCost * count;
    grandTotal += total;

    const powerStr = spec.defaultPower.requiresPower
      ? `${spec.defaultPower.wattage}W (${spec.defaultPower.source.toUpperCase()})`
      : 'Passive / No Power';

    const role = (spec.networkRole || spec.dictRole || 'Network Hardware').replace(/"/g, '""');

    rows.push(
      `"${spec.category.toUpperCase()}","${spec.name}","${node.type}",${count},${unitCost},${total},"${powerStr}","${role}"`
    );
  });

  // Also include Cable Runs summary
  const cableLengths = new Map<string, number>();
  cables.forEach((c) => {
    const prev = cableLengths.get(c.type) || 0;
    cableLengths.set(c.type, prev + c.lengthMeters);
  });

  cableLengths.forEach((meters, cableType) => {
    const cDef = CABLE_DEFINITIONS[cableType as keyof typeof CABLE_DEFINITIONS];
    const costPerMeter = cableType === 'fiber' ? 45 : cableType === 'ethernet' ? 30 : 25;
    const total = Math.round(meters * costPerMeter);
    grandTotal += total;
    rows.push(
      `"CABLING","${cDef?.name || cableType}","${cableType}",${Math.round(meters)} meters,${costPerMeter}/m,${total},"N/A","Cable Runs on site"`
    );
  });

  rows.push(`,,,,GRAND TOTAL (PHP),${grandTotal},,`);
  return rows.join('\n');
}

export function exportIpPlanCsv(nodes: NetworkNode[], structures: Structure[]): string {
  const structureMap = new Map<string, string>();
  structures.forEach((s) => structureMap.set(s.id, s.label));

  const rows: string[] = [
    'Device Label,Equipment Type,Location / Structure,IP Address,Subnet Mask,Default Gateway,Assignment Mode,Status',
  ];

  nodes.forEach((n) => {
    if (n.network) {
      const loc = n.structureId ? structureMap.get(n.structureId) || 'Outdoor / Unassigned' : 'General Site';
      rows.push(
        `"${n.label}","${n.type}","${loc}","${n.network.ip}","${n.network.subnet}","${n.network.gateway}","${n.network.isDhcp ? 'DHCP (Dynamic)' : 'Static'}","${n.status.toUpperCase()}"`
      );
    }
  });

  return rows.join('\n');
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
