import type { Book, Member, Rental, BookStatus } from './types';

const newBooks: {title: string, author: string, category: string, coverImage?: string}[] = [
    { title: '믿는 만큼 자라는 아이들', author: '박혜란', category: '자녀교육' },
    { title: '퇴사인류 보고서', author: '김퇴사', category: '에세이', coverImage: 'https://shopping-phinf.pstatic.net/main_4962228/49622282624.20240829071754.jpg' },
    { title: '다빈치 코드 1', author: '댄 브라운', category: '소설', coverImage: 'http://books.google.com/books/content?id=t1gtvQAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api' },
    { title: '다빈치 코드 2', author: '댄 브라운', category: '소설', coverImage: 'http://books.google.com/books/content?id=t1gtvQAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api' },
    { title: '마흔에 읽는 쇼펜 하우어', author: '강용수', category: '서양철학', coverImage: 'http://books.google.com/books/content?id=Q9g-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '호의에 대하여', author: '문형배', category: '에세이' },
    { title: '설민석의 삼국지 1', author: '설민석', category: '중국철학', coverImage: 'http://books.google.com/books/content?id=5_A_EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '설민석의 삼국지 2', author: '설민석', category: '중국철학', coverImage: 'http://books.google.com/books/content?id=0_A_EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '설민석의 조선왕조실록', author: '설민석', category: '한국사', coverImage: 'http://books.google.com/books/content?id=s-E-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '방구석 미술관 1', author: '조원재', category: '미술', coverImage: 'http://books.google.com/books/content?id=f_g_EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '미술관에 간 할미', author: '할미', category: '미술' },
    { title: '그리고 아무도 없었다', author: '애거서 크리스티', category: '소설', coverImage: 'http://books.google.com/books/content?id=N-Y-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '언젠가 우리가 같은 별을 바라본다면', author: '차인표', category: '소설' },
    { title: '모순', author: '양귀자', category: '소설', coverImage: 'http://books.google.com/books/content?id=r-E-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '시간을 파는 상점 1', author: '김선영', category: '소설', coverImage: 'http://books.google.com/books/content?id=k-E-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '시간을 파는 상점 2', author: '김선영', category: '소설', coverImage: 'http://books.google.com/books/content?id=kK8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '류수영의 평생 레시피', author: '류수영', category: '요리책', coverImage: 'http://books.google.com/books/content?id=rK8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '불편한 편의점 1', author: '김호연', category: '소설', coverImage: 'http://books.google.com/books/content?id=yK8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '불편한 편의점 2', author: '김호연', category: '소설', coverImage: 'http://books.google.com/books/content?id=zK8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '가면산장 살인사건', author: '히가시노 게이고', category: '소설', coverImage: 'http://books.google.com/books/content?id=0K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '당신이 누군가를 죽였다', author: '히가시노 게이고', category: '소설', coverImage: 'http://books.google.com/books/content?id=1K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '눈에 갇힌 외딴 산장에서', author: '히가시노 게이고', category: '소설', coverImage: 'http://books.google.com/books/content?id=2K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '녹나무의 여신', author: '히가시노 게이고', category: '소설', coverImage: 'http://books.google.com/books/content?id=3K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '공중그네', author: '오쿠다 히데오', category: '소설', coverImage: 'http://books.google.com/books/content?id=4K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '라디오체조', author: '오쿠다 히데오', category: '소설' },
    { title: '코로나와 잠수복', author: '오쿠다 히데오', category: '소설' },
    { title: '무코다 이발소', author: '오쿠다 히데오', category: '소설', coverImage: 'http://books.google.com/books/content?id=5K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '그 많던 싱아는 누가 다 먹었을까', author: '박완서', category: '소설', coverImage: 'http://books.google.com/books/content?id=6K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '그산이 정말 거기 있을까', author: '박완서', category: '소설' },
    { title: '달러구트 꿈백화점1', author: '이미예', category: '소설', coverImage: 'http://books.google.com/books/content?id=7K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '달러구트 꿈백화점2', author: '이미예', category: '소설', coverImage: 'http://books.google.com/books/content?id=8K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '청춘의 독서', author: '유시민', category: '소설' },
    { title: '사라진 근대사 100장면 1', author: '박종인', category: '소설' },
    { title: '사라진 근대사 100장면 2', author: '박종인', category: '소설' },
    { title: '최소한의 세계사', author: '임소미', category: '세계사' },
    { title: '최소한의 한국사', author: '최태성', category: '한국사' },
    { title: '미움받을 용기 1', author: '기시미 이치로', category: '심리', coverImage: 'http://books.google.com/books/content?id=-K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '미움받을 용기 2', author: '기시미 이치로', category: '심리', coverImage: 'http://books.google.com/books/content?id=_K8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
    { title: '일류의 조건', author: '사이토 다카', category: '자기계발' },
    { title: '행성1', author: '베르나르베르베르', category: '소설' },
    { title: '행성2', author: '베르나르베르베르', category: '소설' },
    { title: '이어령의 마지막수업', author: '김지수', category: '인문교양' },
    { title: '2025 젋은작가상 수상 작품집', author: '벡온유외6명', category: '소설' },
    { title: '나는 하루 5분만 바꾸기로 했다', author: '옥민송', category: '자기계발' },
    { title: '나를 소모하지 않는 현명한 태도에 관하여', author: '마티아스 뇔케', category: '자기계발' },
    { title: '우리는 모두 죽는 다는 것을 기억하라', author: '웨인다이어', category: '자기계발' },
    { title: '데미안', author: '헤르만 헤세', category: '소설', coverImage: 'http://books.google.com/books/content?id=ZK8-EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
];

export const mockBooks: Book[] = newBooks.map((book, i) => {
    return {
        id: `book-${i + 1}`,
        title: book.title,
        author: book.author,
        category: book.category,
        description: `"${book.title}"은(는) ${book.author} 작가의 ${book.category} 장르 책입니다.`,
        coverImage: book.coverImage || '',
        imageHint: 'book cover',
        status: 'available',
    };
});

const newMembers: { name: string; email: string }[] = [
    { name: '권은주', email: 'ejkwon@ipageon.com' },
    { name: '김병찬', email: 'bckim@ipageon.com' },
    { name: '김수아', email: 'sua.kim@ipageon.com' },
    { name: '박지희', email: 'jhpark@ipageon.com' },
    { name: '백수연', email: 'suyeon.bae@ipageon.com' },
    { name: '서형덕', email: 'hyungduk.seo@ipageon.com' },
    { name: '안정호', email: 'cman@ipageon.com' },
    { name: '원은경', email: 'ekwon@ipageon.com' },
    { name: '유신영', email: 'shinyeong.yu@ipageon.com' },
    { name: '이규혁', email: 'khlee@ipageon.com' },
    { name: '이상수', email: 'sangsoo.lee@ipageon.com' },
    { name: '이성인', email: 'silee@ipageon.com' },
    { name: '이정로', email: 'leejr@ipageon.com' },
    { name: '장형원', email: 'hyungwon.jang@ipageon.com' },
    { name: '전승훈', email: 'shjeon@ipageon.com' },
    { name: '정광희', email: 'ghjeong@ipageon.com' },
    { name: '차의석', email: 'euisuk.cha@ipageon.com' },
    { name: '최성호', email: 'shchoi@ipageon.com' },
    { name: '한상욱', email: 'sangwook.han@ipageon.com' },
    { name: '한은영', email: 'mshan@ipageon.com' },
];

export const mockMembers: Member[] = newMembers.map((member, i) => ({
    id: `member-${i + 1}`,
    name: member.name,
    email: member.email,
}));


export const mockRentals: Rental[] = Array.from({ length: 100 }, (_, i) => {
    const book = mockBooks[i % mockBooks.length];
    const member = mockMembers[i % mockMembers.length];
    const rentalDate = new Date();
    rentalDate.setMonth(rentalDate.getMonth() - (i % 12));
    rentalDate.setFullYear(rentalDate.getFullYear() - Math.floor(i / 24));
    
    const shouldBeReturned = Math.random() > 0.3;
    let returnDate: Date | null = null;
    if (shouldBeReturned) {
        returnDate = new Date(rentalDate);
        returnDate.setDate(returnDate.getDate() + (14 + (i % 14)));
    }

    return {
        id: `rental-${i + 1}`,
        bookId: book.id,
        memberId: member.id,
        rentalDate,
        returnDate,
        bookTitle: book.title,
        memberName: member.name
    };
});
