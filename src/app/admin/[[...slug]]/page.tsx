import { notFound } from "next/navigation";
import AdminHome from "@/screens/admin/home";
import AdminDzieci from "@/screens/admin/dzieci";
import AdminRodzice from "@/screens/admin/rodzice";
import AdminJadlospis from "@/screens/admin/jadlospis";
import AdminPorcje from "@/screens/admin/porcje";
import AdminRozliczenia from "@/screens/admin/rozliczenia";
import AdminUstawienia from "@/screens/admin/ustawienia";
import AdminWplaty from "@/screens/admin/wplaty";
import AdminWplatyNowa from "@/screens/admin/wplaty-nowa";
import AdminPokwitowanie from "@/screens/admin/pokwitowanie";

type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRouter({ params, searchParams }: Props) {
  const { slug = [] } = await params;

  if (slug.length === 0) return <AdminHome />;

  const [a, b, c] = slug;

  if (a === "dzieci" && slug.length === 1) {
    return <AdminDzieci searchParams={searchParams as never} />;
  }
  if (a === "rodzice" && slug.length === 1) {
    return <AdminRodzice searchParams={searchParams as never} />;
  }
  if (a === "ustawienia" && slug.length === 1) return <AdminUstawienia />;
  if (a === "jadlospis" && slug.length === 1) {
    return <AdminJadlospis searchParams={searchParams as never} />;
  }
  if (a === "porcje" && slug.length === 1) {
    return <AdminPorcje searchParams={searchParams as never} />;
  }
  if (a === "rozliczenia" && slug.length === 1) {
    return <AdminRozliczenia searchParams={searchParams as never} />;
  }
  if (a === "wplaty" && slug.length === 1) {
    return <AdminWplaty searchParams={searchParams as never} />;
  }
  if (a === "wplaty" && b === "nowa" && slug.length === 2) {
    return <AdminWplatyNowa searchParams={searchParams as never} />;
  }
  if (a === "wplaty" && b && c === "pokwitowanie" && slug.length === 3) {
    return <AdminPokwitowanie id={b} />;
  }

  notFound();
}
