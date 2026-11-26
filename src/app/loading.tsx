import { PageContainer } from "@/components/PageContainer";
import { getTranslations } from "@/i18n/get-locale";
import { card } from "@/lib/styles";

export default async function Loading() {
  const { t } = await getTranslations();

  return (
    <PageContainer
      title={<div aria-hidden="true" className="h-8 w-48 animate-pulse rounded-lg bg-line motion-reduce:animate-none" />}
    >
      <span role="status" className="sr-only">{t.common.loading}</span>
      <div aria-hidden="true" className={`${card} space-y-4 p-5 sm:p-6`}>
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="h-8 animate-pulse rounded-lg bg-canvas motion-reduce:animate-none" />
        ))}
      </div>
    </PageContainer>
  );
}
