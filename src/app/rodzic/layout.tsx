import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    redirect("/logowanie");
  }

  return (
    <AppShell
      brandHref="/rodzic"
      title="Konto rodzica"
      userName={session.user.name}
      nav={[
        { href: "/rodzic", label: "Kalendarz" },
        { href: "/rodzic/jadlospis", label: "Jadłospis" },
        { href: "/rodzic/historia", label: "Historia" },
        { href: "/rodzic/platnosci", label: "Płatności" },
      ]}
    >
      {children}
    </AppShell>
  );
}
