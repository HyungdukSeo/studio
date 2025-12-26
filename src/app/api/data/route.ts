import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// 시놀로지 NAS 마운트 절대 경로
const DATA_DIR = '/app/data';
const FILE_PATH = path.join(DATA_DIR, 'data.json');

/**
 * 데이터 불러오기 (GET)
 */
export async function GET() {
  try {
    // 1. 디렉토리 존재 여부 확인 및 생성 (방어적 코드)
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 2. 파일 읽기 시도
    const data = await fs.readFile(FILE_PATH, 'utf8');
    
    // 파일 내용이 비어있는 경우 예외 처리
    if (!data || data.trim() === "") {
       return NextResponse.json({ books: [], members: [], rentals: [], nodes: [], edges: [] });
    }

    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    console.error("GET Error:", error.message);
    // 파일이 없거나 읽기 실패 시 기본 구조 반환
    return NextResponse.json({ 
      books: [], 
      members: [], 
      rentals: [], 
      nodes: [], 
      edges: [] 
    });
  }
}

/**
 * 데이터 저장하기 (POST)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. 디렉토리 생성 확인
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 2. 1년 이상 된 대여 기록 필터링 (데이터 최적화)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (body.rentals && Array.isArray(body.rentals)) {
      body.rentals = body.rentals.filter((r: any) => {
        const rentalDate = new Date(r.rentalDate);
        return rentalDate > oneYearAgo;
      });
    }

    // 3. 파일 쓰기 (원자적 쓰기를 위해 임시 파일 없이 직접 저장)
    await fs.writeFile(FILE_PATH, JSON.stringify(body, null, 2), 'utf8');
    
    console.log("Successfully saved data to:", FILE_PATH);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Error:", error.message);
    return NextResponse.json(
      { error: 'Save Failed', details: error.message }, 
      { status: 500 }
    );
  }
}