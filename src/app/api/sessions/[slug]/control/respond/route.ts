import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RespondControlSchema = z.object({
  requestId: z.string(),
  granted: z.boolean(),
  participantId: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = RespondControlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid control response" }, { status: 400 });
    }

    const { requestId, granted, participantId } = parsed.data;

    return NextResponse.json({
      requestId,
      participantId,
      status: granted ? "granted" : "none",
      slug,
      message: granted ? "Host granted DAW screen control" : "Host declined control request",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
