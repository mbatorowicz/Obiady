import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAuthPage = pathname.startsWith("/logowanie");
  const isAdmin = pathname.startsWith("/admin");
  const isParent = pathname.startsWith("/rodzic");

  if ((isAdmin || isParent) && !isLoggedIn) {
    const url = new URL("/logowanie", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin && role && role !== "ADMIN") {
    return NextResponse.redirect(
      new URL(role === "PARENT" ? "/rodzic" : "/logowanie", req.nextUrl.origin),
    );
  }

  if (isParent && role && role !== "PARENT") {
    return NextResponse.redirect(
      new URL(role === "ADMIN" ? "/admin" : "/logowanie", req.nextUrl.origin),
    );
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(
      new URL(role === "ADMIN" ? "/admin" : "/rodzic", req.nextUrl.origin),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/rodzic/:path*", "/logowanie"],
};
