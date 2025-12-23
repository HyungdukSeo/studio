export type BookStatus = 'available' | 'reserved' | 'borrowed' | 'lost';

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  coverImage: string;
  imageHint: string;
  status: BookStatus;
};

export type Member = {
  id: string;
  name: string;
  email: string;
};

export type Rental = {
  id: string;
  bookId: string;
  memberId: string;
  rentalDate: Date;
  returnDate: Date | null;
  bookTitle?: string;
  memberName?: string;
};
