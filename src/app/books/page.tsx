import Link from "next/link";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { prisma } from "@/lib/prisma";
import { requireUser, resolveBook } from "@/lib/session";
import { badge, card } from "@/lib/styles";
import { createBook } from "./actions";
import { BookForm } from "./BookForm";
import { SwitchBookButton } from "./BookSwitcher";

export default async function BooksPage() {
  const user = await requireUser();
  const { book: activeBook, books } = await resolveBook(user);
  const { locale, t } = await getTranslations();
  const counts = await prisma.book.findMany({
    where: { id: { in: books.map((book) => book.id) } },
    select: { id: true, _count: { select: { members: true } } },
  });
  const memberCounts = new Map(counts.map((book) => [book.id, book._count.members + 1]));

  return (
    <PageContainer title={<PageTitle>{t.books.title}</PageTitle>}>
      <section className={`${card} p-5`} aria-labelledby="create-book">
        <h2 id="create-book" className="mb-4 text-lg font-semibold">{t.books.createTitle}</h2>
        <BookForm action={createBook} nameLabel={t.books.nameLabel} submitLabel={t.books.create} savingLabel={t.books.saving} />
      </section>
      <ul className={`${card} divide-y divide-line`}>
        {[...books].sort((a, b) => a.name.localeCompare(b.name, locale)).map((book) => (
          <li key={book.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <Link href={`/books/${book.id}`} className="break-words font-semibold text-primary hover:underline">{book.name}</Link>
              <p className="mt-1 text-sm text-ink-muted">{t.books.roles[book.access]}</p>
              <p className="text-sm text-ink-muted">{t.books.memberCount(memberCounts.get(book.id) ?? 1)}</p>
            </div>
            {book.id === activeBook.id ? (
              <span className={`${badge} bg-primary-soft text-primary-strong`}>{t.books.active}</span>
            ) : (
              <SwitchBookButton bookId={book.id} label={t.books.useBook} pendingLabel={t.books.switching} />
            )}
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
