import type { Prisma } from "@prisma/client";
import { pickNewOwner } from "./book-rules";

type BookEvent =
  | { event: "book_transferred"; data: { bookId: string; from: string; to: string } }
  | { event: "book_deleted"; data: { bookId: string; reason: "owner_deleted" } };

export async function deleteBook(tx: Prisma.TransactionClient, bookId: string): Promise<void> {
  await tx.book.delete({ where: { id: bookId } });
}

// The caller logs these events only after the transaction commits.
export async function resolveOwnedBooks(tx: Prisma.TransactionClient, userId: string): Promise<BookEvent[]> {
  const books = await tx.book.findMany({
    where: { ownerId: userId },
    select: { id: true, members: { select: { userId: true, role: true, createdAt: true } } },
  });
  const events: BookEvent[] = [];
  for (const book of books) {
    const newOwner = pickNewOwner(book.members);
    if (newOwner) {
      await tx.book.update({ where: { id: book.id }, data: { ownerId: newOwner } });
      await tx.bookMember.delete({ where: { bookId_userId: { bookId: book.id, userId: newOwner } } });
      await tx.bookInvitation.deleteMany({ where: { bookId: book.id } });
      events.push({ event: "book_transferred", data: { bookId: book.id, from: userId, to: newOwner } });
    } else {
      await deleteBook(tx, book.id);
      events.push({ event: "book_deleted", data: { bookId: book.id, reason: "owner_deleted" } });
    }
  }
  return events;
}
