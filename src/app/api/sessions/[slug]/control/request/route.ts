import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const RequestControlSchema = z.object({
  participantId: z.string(),
  participantName: z.string().default("Collaborator"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = RequestControlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid control request" }, { status: 400 });
    }

    const { participantId, participantName } = parsed.data;
    const requestId = `ctrl-${crypto.randomBytes(4).toString("hex")}`;

    return NextResponse.json({
      requestId,
      status: "requested",
      participantId,
      participantName,
      slug,
      message: "Screen control authorization requested from host",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
