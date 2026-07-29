import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/logowanie");
  }

  return (
    <AppShell
      brandHref="/admin"
      title="Panel szkoły"
      userName={session.user.name}
      nav={[
        { href: "/admin", label: "Start" },
        { href: "/admin/porcje", label: "Porcje" },
        { href: "/admin/jadlospis", label: "Jadłospis" },
        { href: "/admin/dzieci", label: "Dzieci" },
        { href: "/admin/rodzice", label: "Rodzice" },
        { href: "/admin/rozliczenia", label: "Rozliczenia" },
        { href: "/admin/wplaty", label: "Wpłaty" },
        { href: "/admin/ustawienia", label: "Ustawienia" },
      ]}
    >
      {children}
    </AppShell>
  );
}
