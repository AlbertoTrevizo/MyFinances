import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/i18n/get-locale";
import { requireAdmin } from "@/lib/session";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { UsersTable, type UserRow } from "@/components/UsersTable";
import { buttonPrimary, card, inputField } from "@/lib/styles";
import { resolveSort } from "@/lib/sort";
import { matchesSearch } from "@/lib/search";
import { formatDate } from "@/lib/date";
import { accountStatus, signInMethod, sortUsers } from "@/lib/user-status";

const SORT_FIELDS = ["name", "lastName", "email", "method", "status", "role", "createdAt"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.users.title };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string }>;
}) {
  await requireAdmin();
  const { q = "", ...sp } = await searchParams;
  const { locale, t } = await getTranslations();
  const { field, dir } = resolveSort(sp, SORT_FIELDS, "createdAt", "desc");

  // Safe fields only; the hash is read just to compute the sign-in method and never leaves the server.
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      lastName: true,
      email: true,
      passwordHash: true,
      googleId: true,
      emailVerifiedAt: true,
      role: true,
      createdAt: true,
    },
  });

  const query = q.trim();
  const all = users.map((user) => ({
    id: user.id,
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    method: signInMethod(user),
    status: accountStatus(user),
    role: user.role,
    createdAt: user.createdAt,
  }));
  const filtered = query
    ? all.filter((user) => matchesSearch(query, [user.name, user.lastName, user.email]))
    : all;
  const rows: UserRow[] = sortUsers(filtered, field, dir).map((user) => ({
    id: user.id,
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    method: user.method,
    status: user.status,
    role: user.role,
    createdLabel: formatDate(user.createdAt, locale),
    confirmMessage: t.users.confirmDelete(user.email),
  }));

  // Functions cannot pass to a Client Component; confirmDelete was used above.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { confirmDelete: _confirmDelete, ...usersCopy } = t.users;
  const copy = {
    actionsLabel: t.common.actions,
    users: usersCopy,
    validation: t.validation,
    register: t.register,
    emailLabel: t.auth.emailLabel,
    editLabel: t.common.edit,
    deleteLabel: t.common.delete,
    deletingLabel: t.common.deleting,
    cancelLabel: t.common.cancel,
    savingLabel: t.common.saving,
  };

  return (
    <PageContainer title={<PageTitle>{t.users.title}</PageTitle>}>
      <search>
        <form method="get" action="/users" className="flex gap-2">
          <input type="hidden" name="sort" value={field} />
          <input type="hidden" name="dir" value={dir} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t.users.searchPlaceholder}
            aria-label={t.users.searchPlaceholder}
            className={`${inputField} min-w-0 flex-1`}
          />
          <button type="submit" className={buttonPrimary}>
            {t.users.searchButton}
          </button>
        </form>
      </search>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">{query ? t.users.noResults : t.users.emptyMessage}</p>
      ) : (
        <div className={card}>
          <UsersTable rows={rows} copy={copy} sort={field} dir={dir} q={query} />
        </div>
      )}
    </PageContainer>
  );
}
