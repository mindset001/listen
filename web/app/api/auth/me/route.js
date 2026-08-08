import { NextResponse } from "next/server";
import { getCurrentUser, toPublicUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized", message: "Not signed in." }, { status: 401 });
  }
  return NextResponse.json(toPublicUser(user));
}
