# Obiady szkolne

Aplikacja do zgłaszania nieobecności na obiadach szkolnych i wyliczania miesięcznych należności.

## Start

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

### Konta demo

| Rola | E-mail | Hasło |
|------|--------|-------|
| Intendentka | `intendentka@szkola.pl` | `haslo123` |
| Rodzic | `rodzic@example.com` | `haslo123` |

## Funkcje

- **Rodzic:** kalendarz nieobecności (z deadline), jadłospis, historia, dane do przelewu
- **Intendentka:** dzieci, rodzice, powiązania, jadłospis, porcje na dzień, rozliczenia, ustawienia

Baza: SQLite (`prisma/dev.db`).
