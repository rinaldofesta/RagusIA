import { NextResponse } from "next/server";
import { getSource } from "@/lib/data/repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const source = await getSource(id);
  if (!source) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(source);
}
