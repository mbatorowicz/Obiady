import { notFound } from "next/navigation";
import ParentHome from "@/screens/rodzic/home";
import ParentJadlospis from "@/screens/rodzic/jadlospis";
import ParentHistoria from "@/screens/rodzic/historia";
import ParentPlatnosci from "@/screens/rodzic/platnosci";

type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParentRouter({ params, searchParams }: Props) {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    return <ParentHome searchParams={searchParams as never} />;
  }

  const [a] = slug;
  if (a === "jadlospis" && slug.length === 1) return <ParentJadlospis />;
  if (a === "historia" && slug.length === 1) {
    return <ParentHistoria searchParams={searchParams as never} />;
  }
  if (a === "platnosci" && slug.length === 1) {
    return <ParentPlatnosci searchParams={searchParams as never} />;
  }

  notFound();
}
