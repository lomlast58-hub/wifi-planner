import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CableRun, NetworkNode, Structure, ValidationSummary } from '../types/network';
import { EQUIPMENT_CATALOG, CABLE_DEFINITIONS } from '../constants/equipmentDefinitions';

/**
 * Draws a prominent, transparent diagonal "TEPBIZ™" watermark across all pages of the document
 */
function applyTepbizLandscapeWatermark(doc: jsPDF, title: string) {
  const pageCount = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Save state & apply watermark
    try {
      (doc as any).saveGraphicsState?.();
      if ((doc as any).setGState && (doc as any).GState) {
        (doc as any).setGState(new (doc as any).GState({ opacity: 0.13 }));
      }
    } catch {}

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(80);
    doc.setTextColor(14, 116, 144); // Sky / Teal tint

    // Centered diagonal watermark across the entire page
    doc.text('TEPBIZ™', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      baseline: 'middle',
      angle: 30,
    });

    try {
      (doc as any).restoreGraphicsState?.();
    } catch {}

    // Top Header Banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('TEPBIZ™ NETWORK SYSTEM SPECIFICATION & ARCHITECTURE', 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${title} · Generated on ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}`, pageWidth - 14, 10, {
      align: 'right',
    });

    // Bottom Footer Trademark
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('TEPBIZ™ Network Designer & Simulation Workspace · Proprietary & Confidential', 14, pageHeight - 7);

    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
}

/**
 * 1. Export Bill of Materials (BOM) as Landscape PDF
 * Note: STRICTLY NO PRICES, Equipment List ONLY, ONT marked as "ISP provided".
 */
export function exportBomPdf(nodes: NetworkNode[], cables: CableRun[], projectName: string) {
  // Landscape A4 (297 x 210 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Aggregate node quantities
  const itemMap = new Map<string, { count: number; node: NetworkNode }>();
  nodes.forEach((n) => {
    const existing = itemMap.get(n.type);
    if (existing) {
      existing.count++;
    } else {
      itemMap.set(n.type, { count: 1, node: n });
    }
  });

  // Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('BILL OF MATERIALS (BOM) — EQUIPMENT LIST', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Project: ${projectName || 'Network Infrastructure Site'}`, 14, 26);
  doc.text('Classification: Technical Equipment Specification (No pricing applied)', 14, 31);

  // Equipment table data
  const equipmentRows: any[][] = [];
  let itemIndex = 1;

  itemMap.forEach(({ count, node }) => {
    const spec = EQUIPMENT_CATALOG[node.type];
    const isOnt = node.type === 'ont_onu';
    const isIspNap = node.type.startsWith('isp_');

    const sourceStatus = isOnt
      ? 'ISP provided'
      : isIspNap
      ? 'Telco Demarcation'
      : 'Procured Equipment';

    const powerSpec = spec.defaultPower.requiresPower
      ? `${spec.defaultPower.wattage}W (${spec.defaultPower.source.toUpperCase()})`
      : 'Passive / No Power';

    equipmentRows.push([
      itemIndex++,
      spec.name || node.label,
      spec.category.toUpperCase(),
      count,
      powerSpec,
      sourceStatus,
      spec.description || 'Standard active network component',
    ]);
  });

  // Cables aggregated
  const cableLengths = new Map<string, number>();
  cables.forEach((c) => {
    const prev = cableLengths.get(c.type) || 0;
    cableLengths.set(c.type, prev + c.lengthMeters);
  });

  cableLengths.forEach((meters, cableType) => {
    const cDef = CABLE_DEFINITIONS[cableType as keyof typeof CABLE_DEFINITIONS];
    equipmentRows.push([
      itemIndex++,
      cDef?.name || cableType,
      'CABLING',
      `${Math.round(meters)} meters`,
      'Passive Conduit / Run',
      'Site Installation Material',
      cDef?.description || 'Physical cabling run on site',
    ]);
  });

  // Render Table
  autoTable(doc, {
    startY: 37,
    head: [['#', 'Equipment Name / Specification', 'Category', 'Quantity', 'Power Rating', 'Provisioning Source', 'Technical Notes']],
    body: equipmentRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 32 },
      5: { cellWidth: 35, fontStyle: 'bold' },
      6: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      // Highlight "ISP provided" in bold teal
      if (data.column.index === 5 && data.cell.text.includes('ISP provided')) {
        data.cell.styles.textColor = [13, 148, 136];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // Apply TEPBIZ watermark & headers/footers
  applyTepbizLandscapeWatermark(doc, 'Equipment Bill of Materials');

  // Save PDF
  doc.save(`TEPBIZ_BOM_${(projectName || 'Project').replace(/\s+/g, '_')}.pdf`);
}

/**
 * 2. Export IP Addressing & Subnet Plan as Landscape PDF
 */
export function exportIpPlanPdf(nodes: NetworkNode[], structures: Structure[], projectName: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const structureMap = new Map<string, string>();
  structures.forEach((s) => structureMap.set(s.id, s.label));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('IP ADDRESSING & SUBNET ALLOCATION PLAN', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Project: ${projectName || 'Network Infrastructure Site'}`, 14, 26);
  doc.text('Layer 3 Network Routing, Subnets, and Default Gateway Assignments', 14, 31);

  const tableRows: any[][] = [];
  let itemIndex = 1;

  nodes.forEach((n) => {
    if (n.network) {
      const loc = n.structureId ? structureMap.get(n.structureId) || 'Site Grounds' : 'General Facility';
      const isGateway = n.type === 'router_firewall';

      tableRows.push([
        itemIndex++,
        n.label,
        loc,
        n.network.ip || 'Unset',
        n.network.subnet || '255.255.255.0',
        n.network.gateway || 'N/A',
        n.network.isDhcp ? 'DHCP Dynamic Pool' : 'Static Assignment',
        isGateway ? 'Core Default Gateway' : 'Managed Host',
        n.status === 'green' ? 'Operational' : n.status === 'yellow' ? 'Warning' : 'Config Error',
      ]);
    }
  });

  autoTable(doc, {
    startY: 37,
    head: [['#', 'Device Label', 'Physical Location', 'IP Address', 'Subnet Mask', 'Default Gateway', 'Allocation Mode', 'Network Role', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 28, fontStyle: 'bold' },
      4: { cellWidth: 28 },
      5: { cellWidth: 28 },
      6: { cellWidth: 32 },
      7: { cellWidth: 35 },
      8: { cellWidth: 'auto', halign: 'center' },
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  applyTepbizLandscapeWatermark(doc, 'IP Addressing & Subnet Schedule');
  doc.save(`TEPBIZ_IP_Plan_${(projectName || 'Project').replace(/\s+/g, '_')}.pdf`);
}

/**
 * 3. Export Comprehensive Site Survey & Engineering Report as Landscape PDF
 */
export function exportSiteSurveyPdf(
  siteName: string,
  location: string,
  engineerName: string,
  structures: Structure[],
  nodes: NetworkNode[],
  cables: CableRun[],
  summary: ValidationSummary
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('SITE SURVEY & ENGINEERING SPECIFICATION REPORT', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Site: ${siteName || 'Infrastructure Site'} · Location: ${location || 'N/A'}`, 14, 26);
  doc.text(`Lead Engineer: ${engineerName || 'Field Operations Lead'} · Overall Status: ${summary.healthy ? 'VERIFIED PASSED' : 'NEEDS ATTENTION'}`, 14, 31);

  // Section 1: Physical Structures Surveyed
  const structureRows = structures.map((s, idx) => {
    const inside = nodes.filter((n) => n.structureId === s.id);
    return [
      idx + 1,
      s.label,
      s.type.replace('_', ' ').toUpperCase(),
      `${s.width}m x ${s.height}m`,
      inside.length > 0 ? inside.map((n) => n.label).join(', ') : 'No equipment placed inside',
    ];
  });

  autoTable(doc, {
    startY: 36,
    head: [['#', 'Facility / Structure Name', 'Facility Type', 'Footprint Dimensions', 'Installed Equipment Inside']],
    body: structureRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60, fontStyle: 'bold' },
      2: { cellWidth: 40 },
      3: { cellWidth: 35 },
      4: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  const nextY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Cabling Schedule
  const nodeMap = new Map<string, string>();
  nodes.forEach((n) => nodeMap.set(n.id, n.label));

  const cableRows = cables.map((c, idx) => {
    const fromLabel = nodeMap.get(c.fromNodeId) || c.fromNodeId;
    const toLabel = nodeMap.get(c.toNodeId) || c.toNodeId;
    const cDef = CABLE_DEFINITIONS[c.type as keyof typeof CABLE_DEFINITIONS];

    return [
      idx + 1,
      cDef?.name || c.type,
      `${fromLabel} (${c.fromPortId})`,
      `${toLabel} (${c.toPortId})`,
      `${Math.round(c.lengthMeters)} meters`,
      c.status === 'green' ? 'OK / Verified' : 'Fault Alert',
    ];
  });

  autoTable(doc, {
    startY: nextY,
    head: [['#', 'Cable Media Type', 'Source Endpoint & Port', 'Destination Endpoint & Port', 'Measured Length', 'Link Health']],
    body: cableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 65 },
      3: { cellWidth: 65 },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 'auto', halign: 'center' },
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  applyTepbizLandscapeWatermark(doc, 'Site Survey & Engineering Report');
  doc.save(`TEPBIZ_Site_Survey_${(siteName || 'Site').replace(/\s+/g, '_')}.pdf`);
}
