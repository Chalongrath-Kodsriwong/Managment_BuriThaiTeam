import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = (process.env.BACKEND_API_URL || "http://158.173.159.107:5001").replace(/\/+$/, "");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildTargetUrl(path: string[], searchParams: URLSearchParams): string {
  const joinedPath = path.join("/");
  const qs = searchParams.toString();
  return `${BACKEND_API_URL}/api/${joinedPath}${qs ? `?${qs}` : ""}`;
}

function createForwardHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");
  return headers;
}

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const url = buildTargetUrl(path, req.nextUrl.searchParams);
  const method = req.method;

  const init: RequestInit = {
    method,
    headers: createForwardHeaders(req),
    redirect: "manual",
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = req.body;
    (init as RequestInit & { duplex?: "half" }).duplex = "half";
  }

  try {
    const res = await fetch(url, init);
    const body = await res.arrayBuffer();

    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("API proxy error:", method, url, error);
    return NextResponse.json(
      {
        message: "Backend API unreachable",
        targetUrl: url,
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function OPTIONS(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(req, path);
}
