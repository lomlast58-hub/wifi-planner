import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API route for AI Assistant grounded in the user's current topology
  app.post('/api/assistant/ask', async (req, res) => {
    try {
      const { prompt, topology, selectedNode } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(200).json({
          fallback: true,
          answer: "Note: GEMINI_API_KEY is not configured in this environment. The built-in deterministic DICT expert rule engine is actively providing real-time diagnostics.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are a Senior Network Field Specialist for the Philippines' DICT (Department of Information and Communications Technology) Free Wi-Fi for All Program (under RA 10929: Free Internet Access in Public Places Act).
Your mission is to guide site planners (local government officials, barangay chairpersons, public school administrators, municipal IT staff, rural health officers) who know their physical facilities (Barangay Halls, Evacuation Covered Courts, Rural Health Units, Public Plazas, State Universities) but need plain-language, encouraging, step-by-step guidance on networking, cabling, PoE power budgets, grounding, and IP subnetting.

Key Philippine deployment realities to keep in mind:
1. Electrical: 220V AC Philippine standard mains voltage. Frequent brownouts require UPS on core equipment.
2. Climate/Outdoor: Tropical climate, extreme rainfall and frequent lightning storms require grounding (copper rod to earth) and surge arresters on any outdoor AP runs.
3. Connectivity: Backbone options include Fiber NAP (FTTH), DSL, or VSAT Satellite Terminals for GIDA (Geographically Isolated and Disadvantaged Areas / remote islands).
4. Bandwidth: Typically 10-20 Mbps for small barangay sites / RHUs, up to 100 Mbps for large public colleges.
5. Cabling: Cat6 max 100m distance limit; beyond that requires fiber optic + media converter.
6. Power: PoE standards (802.3af up to 15.4W, 802.3at PoE+ up to 30W, 802.3bt PoE++ up to 60/90W). PoE switches have power budgets.

Format answers with clean Markdown, short bullet points, actionable steps, and zero confusing acronyms without a quick explanation.`;

      const contents = `Planner's question: "${prompt}"

Current Site Topology Data:
${JSON.stringify({
  nodesCount: topology?.nodes?.length || 0,
  structures: topology?.structures?.map((s: any) => ({ name: s.label, type: s.type })),
  equipment: topology?.nodes?.map((n: any) => ({
    id: n.id,
    label: n.label,
    type: n.type,
    ip: n.network?.ip,
    gateway: n.network?.gateway,
    subnet: n.network?.subnet,
    isDhcp: n.network?.isDhcp,
    status: n.status,
    faults: n.faults,
    power: n.power,
  })),
  cablesCount: topology?.cables?.length || 0,
  cables: topology?.cables?.map((c: any) => ({
    id: c.id,
    type: c.type,
    from: c.fromNodeId,
    to: c.toNodeId,
    lengthMeters: c.lengthMeters,
    status: c.status,
    faults: c.faults,
  })),
  selectedEquipment: selectedNode ? {
    label: selectedNode.label,
    type: selectedNode.type,
    power: selectedNode.power,
    network: selectedNode.network,
    status: selectedNode.status,
    faults: selectedNode.faults,
  } : null,
}, null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      return res.json({ answer: response.text });
    } catch (err: any) {
      console.error('Gemini Assistant API error:', err);
      return res.status(500).json({ error: err.message || 'Error running AI diagnosis' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`DICT WiFi Planner server listening on port ${port}`);
  });
}

startServer();
