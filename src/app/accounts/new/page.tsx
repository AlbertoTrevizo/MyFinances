import { AccountForm } from "../AccountForm";
import { createAccount } from "../actions";

export default function NewAccountPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Nueva cuenta
      </h1>
      <AccountForm action={createAccount} submitLabel="Crear cuenta" />
    </div>
  );
}
