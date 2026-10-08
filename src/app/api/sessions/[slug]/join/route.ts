import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";

const JoinSessionSchema = z.object({
  name: z.string().trim().min(1).max(50),
  role: z.enum(["collaborator", "guest"]).default("guest"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = JoinSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid participant name", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, role } = parsed.data;
    const participantId = `p-${crypto.randomBytes(4).toString("hex")}`;

    if (isSupabaseConfigured) {
      // Find session ID
      const { data: session, error: sessionErr } = await supabaseServer
        .from("sessions")
        .select("id, status")
        .eq("slug", slug)
        .single();

      if (sessionErr || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (session.status === "ended") {
        return NextResponse.json({ error: "Session has ended" }, { status: 410 });
      }

      const { data: participant, error: partErr } = await supabaseServer
        .from("session_participants")
        .insert({
          session_id: session.id,
          guest_name: name,
          role,
          screen_control: "none",
        })
        .select()
        .single();

      if (partErr) {
        return NextResponse.json({ error: partErr.message }, { status: 500 });
      }

      return NextResponse.json({
        participantId: participant.id,
        name: participant.guest_name,
        role: participant.role,
        sessionId: session.id,
      }, { status: 201 });
    }

    return NextResponse.json({
      participantId,
      name,
      role,
      slug,
      message: "Joined session roster",
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
