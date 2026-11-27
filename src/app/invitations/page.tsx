import type { Metadata } from "next";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { invitationDecision } from "@/lib/book-rules";
import { prisma } from "@/lib/prisma";
import { hashToken, requireUser } from "@/lib/session";
import { card } from "@/lib/styles";
import { InvitationForm } from "./InvitationForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.books.invitation.title };
}

export default async function InvitationPage({ searchParams }: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const user = await requireUser();
  const { token } = await searchParams;
  const { t } = await getTranslations();
  const invitation = typeof token === "string" ? await prisma.bookInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { book: { include: { owner: { select: { name: true, lastName: true } } } } },
  }) : null;
  const member = invitation && await prisma.bookMember.findUnique({
    where: { bookId_userId: { bookId: invitation.bookId, userId: user.id } },
  });
  const access = invitation?.book.ownerId === user.id ? "owner" : member?.role ?? null;
  const decision = invitationDecision({ invitation, now: new Date(), userEmail: user.email, access });

  return (
    <PageContainer title={<PageTitle>{t.books.invitation.title}</PageTitle>}>
      <section className={`${card} space-y-4 p-5`}>
        {decision === "invalid" || decision === "wrongAccount" ? <p>{t.books.invitation[decision]}</p> : invitation && typeof token === "string" && <>
          {decision === "accept" && <>
            <h2 className="break-words text-lg font-semibold">{invitation.book.name}</h2>
            <p className="break-words">{t.books.invitation.invitedBy}: {[invitation.book.owner.name, invitation.book.owner.lastName].filter(Boolean).join(" ")}</p>
            <p>{t.books.roleLabel}: {t.books.roles[invitation.role]}</p>
          </>}
          <InvitationForm token={token} bookId={invitation.bookId} alreadyMember={decision === "alreadyMember"} copy={t.books.invitation} conflict={t.books.errors.conflict} switching={t.books.switching} />
        </>}
      </section>
    </PageContainer>
  );
}
