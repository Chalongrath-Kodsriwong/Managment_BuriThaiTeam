import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/account",
  "/banner",
  "/order",
  "/product",
  "/role",
  "/stock",
  "/category",
  "/payment",
  "/line-notification",
  "/achievement", // ✅ เพิ่มบรรทัดนี้
];

export const middleware = async (req: NextRequest) => {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // Do not guard API proxy routes with page auth middleware.
  // API auth should be handled by backend responses instead.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isProtected = PROTECTED_PREFIXES.some((path) =>
    pathname.startsWith(path)
  );

  if (!token) {
    if (isProtected) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64)) as {
      exp?: number;
      roles?: string[];
    };

    const now = Math.floor(Date.now() / 1000);
    const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
    const isManagementRole =
      roles.includes("admin") || roles.includes("operator");

    if (decoded.exp && decoded.exp < now) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("token");
      return response;
    }

    // If token belongs to frontend customer role, clear it for management site.
    if (!isManagementRole) {
      const response = isProtected
        ? NextResponse.redirect(new URL("/login", req.url))
        : NextResponse.next();
      response.cookies.delete("token");
      return response;
    }

    if (isPublic) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  } catch {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
