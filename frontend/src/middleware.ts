import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { supportedLocales } from "./i18n/locales";

// TODO: add support for user specific permissions
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Ignore /api/auth/*
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Authentication
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) {
    const callbackUrl = new URL(pathname, request.url);
    const url = new URL("/api/auth/signin", request.url);
    url.searchParams.set("callbackUrl", callbackUrl.toString());
    return NextResponse.redirect(url);
  }

  // Update locale
  const newLocale = searchParams.get("updateLocale");
  if (newLocale && supportedLocales.includes(newLocale)) {
    const url = new URL(pathname, request.url);
    url.searchParams.delete("updateLocale");
    const response = NextResponse.redirect(url);
    response.cookies.set("USER_LOCALE", newLocale);
    return response;
  }

  return NextResponse.next();
}
