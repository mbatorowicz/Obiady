import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  exportChildSubject,
  exportParentSubject,
} from "@/lib/privacy/export-subject";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id") || "";

  let payload: unknown = null;
  let filename = "export.json";

  if (type === "me") {
    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    payload = await exportParentSubject(session.user.id);
    filename = `moje-dane-${session.user.id}.json`;
  } else if (type === "parent") {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    payload = await exportParentSubject(id);
    filename = `rodzic-${id}.json`;
  } else if (type === "child") {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    payload = await exportChildSubject(id);
    filename = `dziecko-${id}.json`;
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (!payload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
