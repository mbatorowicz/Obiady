import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function PrivacyPage() {
  const settings = await prisma.mealSettings.findUnique({
    where: { id: "default" },
  });

  const controllerName =
    settings?.controllerName?.trim() ||
    settings?.bankRecipient?.trim() ||
    "Szkoła (administrator danych — uzupełnij w ustawieniach aplikacji)";
  const controllerAddress = settings?.controllerAddress?.trim() || "—";
  const privacyEmail = settings?.privacyEmail?.trim() || "—";
  const retention =
    settings?.dataRetentionNote?.trim() ||
    "Dane przechowywane są przez okres korzystania z żywienia oraz zgodnie z wymogami rachunkowości.";

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/" className="font-display text-2xl text-brand">
          Obiady
        </Link>
        <h1 className="mt-6 font-display text-3xl tracking-tight">
          Informacja o przetwarzaniu danych (RODO)
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Niniejsza klauzula ma charakter informacyjny i nie zastępuje
          indywidualnej konsultacji z IOD szkoły.
        </p>

        <div className="panel mt-6 space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg mb-1">Administrator danych</h2>
            <p>
              <strong>{controllerName}</strong>
              <br />
              Adres: {controllerAddress}
              <br />
              Kontakt w sprawach danych: {privacyEmail}
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1">Cele przetwarzania</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>organizacja żywienia szkolnego i jadłospisu,</li>
              <li>przyjmowanie zgłoszeń braku obiadu (nieobecności),</li>
              <li>rozliczenia miesięczne, wpłaty i pokwitowania,</li>
              <li>prowadzenie kont rodziców i kart dzieci w aplikacji.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1">Podstawa przetwarzania</h2>
            <p>
              Przetwarzanie odbywa się w związku z realizacją zadań szkoły w
              zakresie żywienia oraz umową / stosunkiem łączącym szkołę z
              rodzicem (opiekunem) — w szczególności art. 6 ust. 1 lit. b i/lub
              lit. e RODO, w zależności od statusu prawnego administratora.
              Szczegółową podstawę ustala szkoła jako administrator.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1">Kategorie danych</h2>
            <p>
              Dane rodziców (imię i nazwisko, e-mail, dane konta), dane dzieci
              (imię, nazwisko, klasa), nieobecności, rozliczenia i wpłaty
              (w tym imię płatnika na pokwitowaniu). Zdjęcia potraw w jadłospisie
              nie służą identyfikacji osób.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1">Odbiorcy / powierzenie</h2>
            <p>
              Dane mogą być przetwarzane u dostawców hostingu i bazy danych
              (np. Vercel, Neon, Vercel Blob) na podstawie umów powierzenia
              przetwarzania. Dostęp mają uprawnieni pracownicy szkoły
              (np. intendentka) w zakresie niezbędnym do obsługi żywienia.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1">Retencja</h2>
            <p>{retention}</p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1">Prawa osób</h2>
            <p>
              Przysługuje m.in. prawo dostępu do danych, ich sprostowania,
              ograniczenia przetwarzania oraz — w zakresie dopuszczalnym —
              usunięcia lub anonimizacji. Wniosek kieruj na adres kontaktu
              powyżej. Przysługuje też skarga do Prezesa UODO.
            </p>
            <p className="mt-2">
              Zalogowany rodzic może pobrać pakiet swoich danych w sekcji{" "}
              <Link href="/rodzic/moje-dane" className="underline">
                Moje dane
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1">Pliki cookie</h2>
            <p>
              Aplikacja używa niezbędnego cookie sesyjnego logowania (Auth.js),
              wymaganego do działania konta. Nie stosujemy banera zgód na
              marketingowe cookies.
            </p>
          </section>
        </div>

        <p className="mt-6 text-sm">
          <Link href="/logowanie" className="underline">
            Logowanie
          </Link>
          {" · "}
          <Link href="/" className="underline">
            Strona główna
          </Link>
        </p>
      </div>
    </div>
  );
}
