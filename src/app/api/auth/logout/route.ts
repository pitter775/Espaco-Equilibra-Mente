import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  clearSessionCookies(response);
  return response;
}
