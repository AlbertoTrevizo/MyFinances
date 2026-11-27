import { notFound } from "next/navigation";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { card } from "@/lib/styles";
import { formatDate } from "@/lib/date";
import { deleteBook, leaveBook, removeMember, renameBook, revokeInvitation } from "../actions";
import { BookDeleteButton } from "../BookDeleteButton";
import { BookForm } from "../BookForm";
import { MemberRoleForm } from "../MemberRoleForm";
import { InviteForm } from "../InviteForm";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, lastName: true, email: true } },
      members: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { user: { select: { id: true, name: true, lastName: true, email: true } } },
      },
    },
  });
  if (!book) notFound();
  const access = book.ownerId === user.id ? "owner" : book.members.find((member) => member.userId === user.id)?.role;
  if (!access) notFound();
  const { t, locale } = await getTranslations();
  const invitations = access === "owner" ? await prisma.bookInvitation.findMany({
    where: { bookId: book.id, expiresAt: { gt: new Date() } },
    select: { id: true, email: true, role: true, expiresAt: true },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  }) : [];
  const members = [
    { user: book.owner, role: "owner" as const },
    ...book.members.map((member) => ({ user: member.user, role: member.role })),
  ];

  return (
    <PageContainer title={<PageTitle><span className="break-words">{book.name}</span></PageTitle>}>
      {access === "owner" && (
        <section className={`${card} p-5`} aria-labelledby="rename-book">
          <h2 id="rename-book" className="mb-4 text-lg font-semibold">{t.books.renameTitle}</h2>
          <BookForm action={renameBook.bind(null, book.id)} name={book.name} nameLabel={t.books.nameLabel} submitLabel={t.books.rename} savingLabel={t.books.saving} />
        </section>
      )}
      <section className={card} aria-labelledby="book-members">
        <h2 id="book-members" className="p-5 text-lg font-semibold">{t.books.membersTitle}</h2>
        <ul className="divide-y divide-line">
          {members.map((member) => (
            <li key={member.user.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p id={`member-${member.user.id}`} className="break-words font-semibold">{[member.user.name, member.user.lastName].filter(Boolean).join(" ")}</p>
                <p className="break-all text-sm text-ink-muted">{member.user.email}</p>
                <p className="text-sm text-ink-muted">{t.books.roles[member.role]}</p>
              </div>
              {access === "owner" && member.role !== "owner" && (
                <div className="flex flex-wrap items-start gap-2">
                  <MemberRoleForm bookId={book.id} userId={member.user.id} role={member.role} roles={t.books.roles} label={t.books.roleLabel} submitLabel={t.books.changeRole} savingLabel={t.books.saving} />
                  <BookDeleteButton action={removeMember.bind(null, book.id, member.user.id)} confirmMessage={t.books.confirmRemove(member.user.email)} label={t.books.removeMember} pendingLabel={t.books.removing} cancelLabel={t.books.cancel} describedBy={`member-${member.user.id}`} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
      {access === "owner" && <>
        <div className="grid gap-5 md:grid-cols-2">
          {(["email", "link"] as const).map((kind) => (
            <section key={kind} className={`${card} min-w-0 p-5`} aria-labelledby={`invite-${kind}`}>
              <h2 id={`invite-${kind}`} className="mb-4 text-lg font-semibold">{kind === "email" ? t.books.invite.title : t.books.invite.linkTitle}</h2>
              <InviteForm bookId={book.id} kind={kind} copy={t.books.invite} roles={t.books.roles} roleLabel={t.books.roleLabel} />
            </section>
          ))}
        </div>
        <section className={card} aria-labelledby="book-invitations">
          <h2 id="book-invitations" className="p-5 text-lg font-semibold">{t.books.invitations.title}</h2>
          {!invitations.length ? <p className="px-5 pb-5 text-sm text-ink-muted">{t.books.invitations.empty}</p> : (
            <ul className="divide-y divide-line">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p id={`invitation-${invitation.id}`} className="break-all font-semibold">{invitation.email ? `${t.books.invitations.email}: ${invitation.email}` : t.books.invitations.link}</p>
                    <p className="text-sm text-ink-muted">{t.books.roles[invitation.role]}</p>
                    <p className="text-sm text-ink-muted">{t.books.invitations.expires}: {formatDate(invitation.expiresAt, locale)}</p>
                  </div>
                  <BookDeleteButton action={revokeInvitation.bind(null, book.id, invitation.id)} confirmMessage={t.books.invitations.confirmRevoke} label={t.books.invitations.revoke} pendingLabel={t.books.invitations.revoking} cancelLabel={t.books.cancel} describedBy={`invitation-${invitation.id}`} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </>}
      <section className={`${card} flex items-center justify-between gap-4 p-5`}>
        <h2 className="text-lg font-semibold">{access === "owner" ? t.books.delete : t.books.leave}</h2>
        <BookDeleteButton
          action={(access === "owner" ? deleteBook : leaveBook).bind(null, book.id)}
          confirmMessage={access === "owner" ? t.books.confirmDelete(book.name) : t.books.confirmLeave(book.name)}
          label={access === "owner" ? t.books.delete : t.books.leave}
          pendingLabel={access === "owner" ? t.books.deleting : t.books.leaving}
          cancelLabel={t.books.cancel}
        />
      </section>
    </PageContainer>
  );
}
