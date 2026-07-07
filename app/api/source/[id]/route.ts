import { NextResponse } from "next/server";
import { getSource } from "@/lib/data/repository";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Source ids are short slugs — reject anything else before touching the DB.
  if (!/^[a-z0-9_-]{1,64}$/i.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  if (!(await rateLimit("source", clientIp(req.headers), 60, 60))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const source = await getSource(id);
  if (!source) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(source);
}
