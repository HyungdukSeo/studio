import type { Book, Member, Rental, BookStatus } from './types';
import { PlaceHolderImages } from './placeholder-images';

const categories = ['Fiction', 'Science Fiction', 'Fantasy', 'Non-Fiction', 'Mystery', 'Romance', 'Biography', 'Children'];
const statuses: BookStatus[] = ['available', 'borrowed', 'reserved'];

const getImageForIndex = (index: number) => {
    const image = PlaceHolderImages[index % PlaceHolderImages.length];
    return { url: image.imageUrl, hint: image.imageHint };
}

export const mockBooks: Book[] = Array.from({ length: 25 }, (_, i) => {
    const { url, hint } = getImageForIndex(i);
    return {
        id: `book-${i + 1}`,
        title: `The Great Novel Vol. ${i + 1}`,
        author: `Author ${i + 1}`,
        category: categories[i % categories.length],
        description: `A captivating story in the world of ${categories[i % categories.length]}. This is volume ${i + 1} in a long-running series of epic tales.`,
        coverImage: url,
        imageHint: hint,
        status: statuses[i % statuses.length],
    };
});

export const mockMembers: Member[] = Array.from({ length: 20 }, (_, i) => ({
    id: `member-${i + 1}`,
    name: `Member ${i + 1}`,
    email: `member${i + 1}@example.com`,
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
