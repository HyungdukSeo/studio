import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const DB_PATH = path.join(process.cwd(), 'data/storage.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return res.status(200).json(JSON.parse(data));
  } else if (req.method === 'POST') {
    fs.writeFileSync(DB_PATH, JSON.stringify(req.body, null, 2));
    return res.status(200).json({ success: true });
  }
}
