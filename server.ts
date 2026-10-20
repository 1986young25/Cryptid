import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Aura Insight Engine API Route
  app.post('/api/aura/analyze', async (req, res) => {
    try {
      const { telemetryLogs, metrics, weights } = req.body;

      const prompt = `You are the Aura Insight Engine, an AI telemetry analysis core for the Project Cryptid / Aura Decision Plan and Control Matrix.
Analyze the following live telemetry events and system metrics:

System Metrics:
- Metronome Clock: ${metrics?.clockFrequency ?? 3.69} Hz (Tesla Pulse)
- Shannon Entropy Floor: ${metrics?.entropyFloor ?? 1.69} bits (Threshold: >= 1.5000)
- Mahalanobis Distance M(s): ${metrics?.mahDistance ?? 0.12} (Threshold: <= 0.1500)
- Acoustic Time-Reversal Attenuation: ${metrics?.attenuationDb ?? -42.6} dB
- Free-Space Characteristic Impedance Z0: ${metrics?.impedanceZ0 ?? 376.73} Ohm

Apex Weights (W1 to W6):
${JSON.stringify(weights, null, 2)}

Recent Telemetry Logs:
${JSON.stringify(telemetryLogs, null, 2)}

Provide an operational anomaly evaluation and actionable optimization suggestions formatted as JSON with the exact structure:
{
  "overallStatus": "OPTIMAL" | "NOMINAL" | "ATTENTION_REQUIRED",
  "healthScore": <integer 0-100>,
  "anomalies": [
    { "severity": "LOW" | "MEDIUM" | "HIGH", "component": string, "description": string }
  ],
  "optimizations": [
    { "target": string, "action": string, "expectedGain": string }
  ],
  "executiveSummary": string
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error('Error in Aura Insight Engine:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze telemetry logs' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aura Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
