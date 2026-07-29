import Link from "next/link";
import { loginAction } from "@/lib/actions/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const showDemo = process.env.SHOW_DEMO_ACCOUNTS === "1";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md panel shadow-sm">
        <Link href="/" className="font-display text-3xl text-brand">
          Obiady
        </Link>
        <h1 className="mt-3 text-2xl font-display">Logowanie</h1>
        <p className="mt-1 text-ink-soft text-sm mb-6">
          {showDemo
            ? "Konta demonstracyjne: intendentka@szkola.pl / rodzic@example.com — hasło haslo123"
            : "Zaloguj się kontem nadanym przez szkołę."}
        </p>

        {params.error ? (
          <div className="mb-4 rounded-xl bg-red-50 text-danger px-3 py-2 text-sm">
            Nieprawidłowy e-mail lub hasło.
          </div>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={params.callbackUrl || ""} />
          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Hasło
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Zaloguj się
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-soft">
          <Link href="/prywatnosc" className="underline">
            Prywatność / RODO
          </Link>
        </p>
      </div>
    </div>
  );
}
