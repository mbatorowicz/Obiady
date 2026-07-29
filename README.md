# Obiady

Aplikacja do zgłaszania braku obiadu i miesięcznych rozliczeń żywienia w szkole.

Pełny opis produktu: [PROMPT.md](./PROMPT.md).

## Lokalnie

1. Skopiuj `.env.example` → `.env` i uzupełnij:
   - `DATABASE_URL` — Postgres (np. [Neon](https://neon.tech) free tier)
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_URL=http://localhost:3000`
   - `SHOW_DEMO_ACCOUNTS=1` (opcjonalnie)
2. Zainstaluj i uruchom:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

### Konta demo (seed)

| Rola | E-mail | Hasło |
|------|--------|-------|
| Intendentka | `intendentka@szkola.pl` | `haslo123` |
| Rodzic | `rodzic@example.com` | `haslo123` |

Zdjęcia jadłospisu lokalnie trafiają do `public/uploads/menu/`. Na Vercel ustaw **Vercel Blob**.

## Deploy na Vercel

1. Połącz repo z [vercel.com](https://vercel.com) (Import Project).
2. W projekcie dodaj integracje (Marketplace):
   - **Neon** (Postgres) — wstrzyknie `DATABASE_URL`
   - **Blob** — wstrzyknie `BLOB_READ_WRITE_TOKEN`
3. Ustaw zmienne środowiskowe (Production + Preview):

| Zmienna | Wartość |
|---------|---------|
| `DATABASE_URL` | z Neon (pooled, `sslmode=require`) |
| `AUTH_SECRET` | długi losowy ciąg |
| `AUTH_URL` | `https://twoja-domena.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | z Vercel Blob |
| `SHOW_DEMO_ACCOUNTS` | `1` tylko na stagingu; w produkcji usuń lub `0` |

4. Framework Preset: **Next.js**. Build używa `prisma migrate deploy && next build`.
5. Po pierwszym deployu (gdy baza jest pusta) uruchom seed raz, np.:

```bash
vercel env pull .env.local
npx prisma migrate deploy
npm run db:seed
```

albo przez `npx vercel` + lokalne `DATABASE_URL` wskazujące na tę samą bazę.

## Funkcje

- **Rodzic:** kalendarz braku obiadu (termin w dniu posiłku), jadłospis, historia, dane do przelewu i historia wpłat, eksport „Moje dane”
- **Szkoła:** dzieci, rodzice, jadłospis ze zdjęciami, porcje, rozliczenia, wpłaty i pokwitowania, ustawienia, eksport/anonimizacja RODO

## RODO / checklista operacyjna

To **nie jest porada prawna** — przed produkcją zweryfikuj z IOD szkoły.

1. Uzupełnij w **Ustawieniach** dane administratora (nazwa, adres, e-mail RODO) — trafiają na `/prywatnosc`.
2. Zawrzyj umowy powierzenia (DPA) z dostawcami: **Vercel**, **Neon**, **Vercel Blob**.
3. Zmień hasła startowe rodziców / wyłącz `SHOW_DEMO_ACCOUNTS` w produkcji.
4. Eksport JSON: admin (Dzieci / Rodzice), rodzic (`/rodzic/moje-dane`). Anonimizacja konta/karty — tylko admin; rozliczenia zostają.
