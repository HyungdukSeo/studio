import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// 시놀로지 마운트 경로를 절대 경로로 고정합니다.
const DATA_DIR = '/app/data';
const FILE_PATH = '/app/data/data.json';

export async function GET() {
  try {
    // 1. 폴더가 없다면 생성 시도
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 2. 파일이 있는지 확인 후 읽기
    const data = await fs.readFile(FILE_PATH, 'utf8');
    console.log("데이터 로드 성공");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.log("파일이 없거나 읽기 실패, 기본값 반환");
    return NextResponse.json({ nodes: [], edges: [] });
  }
}

export async function POST(request: Request) {
  try {
    // 1. 폴더 권한 확인 및 생성
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 2. 요청 데이터 파싱
    const body = await request.json();

    // 3. 파일 쓰기 (기존 내용 덮어쓰기)
    await fs.writeFile(FILE_PATH, JSON.stringify(body, null, 2), 'utf8');
    
    console.log("데이터 저장 성공: /app/data/data.json");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("저장 에러 상세:", error.message);
    return NextResponse.json({ error: 'Save Failed', details: error.message }, { status: 500 });
  }
}