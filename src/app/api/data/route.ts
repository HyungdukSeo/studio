import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// 서버 로컬 디스크의 프로젝트 루트에 data.json 생성됨
const filePath = path.join(process.cwd(), 'data.json');

export async function GET() {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    // 파일이 없으면 초기 상태 반환
    return NextResponse.json({ nodes: [], edges: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 파일을 실시간으로 덮어씀
    await fs.writeFile(filePath, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}