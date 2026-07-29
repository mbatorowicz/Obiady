import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.role === "ADMIN") redirect("/admin");
  if (session?.user?.role === "PARENT") redirect("/rodzic");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(28,42,34,0.55), rgba(28,42,34,0.75)), url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1800&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-end px-6 pb-16 pt-10 text-white md:justify-center md:pb-24">
        <p className="font-display text-5xl md:text-7xl tracking-tight mb-4 animate-[fadeUp_0.7s_ease]">
          Obiady
        </p>
        <h1 className="max-w-xl text-xl md:text-2xl font-medium leading-snug text-white/90 mb-3">
          Zgłoś brak obiadu. Zobacz, ile zapłacić w tym miesiącu.
        </h1>
        <p className="max-w-lg text-white/75 mb-8">
          Rodzice zaznaczają dni bez porcji. Szkoła ma listę dla kuchni i
          przejrzyste rozliczenia.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/logowanie"
            className="btn bg-white text-ink hover:bg-bg-deep px-6"
          >
            Zaloguj się
          </Link>
          <Link
            href="/prywatnosc"
            className="btn border border-white/40 text-white hover:bg-white/10 px-6"
          >
            Prywatność
          </Link>
        </div>
      </div>
    </div>
  );
}
