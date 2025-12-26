// pages/api/data.ts
import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const filePath = path.join(process.cwd(), 'data.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(filePath)) return res.status(200).json({ nodes: [], edges: [] });
      const data = fs.readFileSync(filePath, 'utf8');
      return res.status(200).json(JSON.parse(data));
    } catch (e) {
      return res.status(500).json({ error: 'Read Error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = JSON.stringify(req.body, null, 2);
      fs.writeFileSync(filePath, data);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Write Error' });
    }
  }
}