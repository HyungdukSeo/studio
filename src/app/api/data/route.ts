import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// /app/data/data.json 경로를 바라보게 합니다.
const DATA_DIR = path.join(process.cwd(), 'data');
const filePath = path.join(DATA_DIR, 'data.json');

export async function GET() {
  try {
    // 폴더가 없으면 생성 (안전장치)
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    const data = await fs.readFile(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ nodes: [], edges: [] });
  }
}

export async function POST(request: Request) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const body = await request.json();
    await fs.writeFile(filePath, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Save Failed' }, { status: 500 });
  }
}