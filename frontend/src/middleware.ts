import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// TODO: add support for user specific permissions
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return NextResponse.next();
}

// Specify which paths this middleware should run on
export const config = {
  matcher: ["/"],
};
