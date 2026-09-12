import { CategoryForm } from "../CategoryForm";
import { createCategory } from "../actions";

export default function NewCategoryPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Nueva categoría
      </h1>
      <CategoryForm action={createCategory} submitLabel="Crear categoría" />
    </div>
  );
}
