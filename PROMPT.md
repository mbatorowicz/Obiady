# Prompt produktowy — Obiady

> Zbuduj (lub rozwijaj) webową aplikację **Obiady** do zarządzania żywieniem w **jednej** szkole / przedszkolu.
>
> ## Role
> 1. **Rodzic** — prosty, mobilny widok (kalendarz, jadłospis, historia, płatności).
> 2. **Intendentka / admin szkoły** — pełny panel: dzieci, rodzice, powiązania, jadłospis ze zdjęciami, porcje dla kuchni, rozliczenia, rejestracja wpłat z pokwitowaniem, ustawienia.
>
> Intendentka zarządza wszystkim; rodzice nie zakładają kont samodzielnie.
>
> ## Rodzic
> - Widzi przypisane dzieci i wybiera aktywne.
> - Zgłasza **brak obiadu** na dzień żywieniowy (kalendarz). Zgłoszenie = porcja nieprzygotowywana.
> - **Termin zgłoszeń:** do skonfigurowanej godziny **w dniu obiadu** (nie dzień wcześniej). Po terminie zgłoszenie może być zapisane informacyjnie, ale **nie obniża należności**.
> - Widzi należność miesiąca: `(dni żywieniowe − braki w terminie) × stawka`.
> - Widzi zaplanowany jadłospis (konfigurowalne pozycje + zdjęcia) i historię.
> - Płatność: przelew na rachunek szkoły z gotowym tytułem; status aktualizuje szkoła. Widzi historię zarejestrowanych wpłat.
>
> ## Admin
> - Kartoteka dzieci i kont rodziców + powiązania.
> - Ustawienia: cena obiadu, odbiorca i nr rachunku, godzina terminu zgłoszeń, wyjątki kalendarza (np. ferie), pola jadłospisu.
> - Jadłospis na dzień z wartościami i opcjonalnym zdjęciem per pozycja.
> - Lista porcji na wybrany dzień (kto je, kto zgłosił brak).
> - Rozliczenia miesięczne, rejestracja wpłat (gotówka / przelew), numerowane pokwitowania do druku (`OBI-YYYY-#####`).
>
> ## Poza zakresem MVP
> - Płatności online / PSD2 / automatyczne dopasowanie przelewów z banku.
> - Multi-tenant (wiele szkół w jednej instalacji).
> - SMS / push / WhatsApp.
>
> ## Stack i hosting
> - Next.js (App Router), TypeScript, Tailwind, Auth.js (credentials), Prisma.
> - **Produkcja na Vercel:** PostgreSQL (Neon), zdjęcia w **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`). Lokalnie bez tokena Blob — pliki w `public/uploads`.
> - Env: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, opcjonalnie `SHOW_DEMO_ACCOUNTS=1`.
> - Język UI: **polski**, spójne słownictwo: „brak obiadu”, „termin zgłoszeń”, „rozliczenie”, „wpłata”, „pokwitowanie” — bez anglicyzmów w etykietach.
>
> ## Zasady UX
> - Rodzic: minimum kroków, duże cele na telefonie.
> - Admin: zwarte tabele i listy, czytelne skróty do kuchni i rozliczeń.
> - Brand **Obiady** jako główny sygnał na stronie startowej.
