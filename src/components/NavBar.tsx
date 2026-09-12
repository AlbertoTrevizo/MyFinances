import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/expenses", label: "Gastos" },
  { href: "/accounts", label: "Cuentas" },
  { href: "/categories", label: "Categorías" },
];

export function NavBar() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <nav className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
        <Link href="/" className="font-semibold text-zinc-900 dark:text-zinc-50">
          Nuestras Finanzas
        </Link>
        <div className="flex gap-4 text-sm">
          {links.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
