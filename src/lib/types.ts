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
  reservedBy?: string | null; // email of the member
  dueDate?: string | null;
};

export type Member = {
  id: string; // This will be the Firebase Auth UID
  name: string;
  email: string;
  role: 'admin' | 'member';
};

export type Rental = {
  id: string;
  bookId: string;
  memberId: string;
  rentalDate: string; // ISO 8601 string format
  returnDate: string | null; // ISO 8601 string format, or null if not returned
  bookTitle: string;
  memberName: string;
};
