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
  reservedBy?: string | null;
  dueDate?: string | null;
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
  rentalDate: string;
  returnDate: string | null;
  bookTitle: string;
  memberName: string;
};
