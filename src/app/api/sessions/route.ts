import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";

const CreateSessionSchema = z.object({
  title: z.string().min(2).max(100).default("Untitled Session"),
  audioQuality: z.enum(["opus_standard", "opus_hq_stereo", "pcm_lossless"]).default("pcm_lossless"),
  sampleRate: z.union([z.literal(44100), z.literal(48000), z.literal(96000)]).default(48000),
  maxCollaborators: z.number().int().min(1).max(8).default(4),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid session configuration", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { title, audioQuality, sampleRate, maxCollaborators } = parsed.data;

    // Generate URL-friendly slug and secure VST3 bridge token
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "session";
    const uniqueSuffix = crypto.randomBytes(3).toString("hex");
    const slug = `${baseSlug}-${uniqueSuffix}`;
    const vst3Token = `s2dio_${crypto.randomBytes(16).toString("hex")}`;
    const sessionId = crypto.randomUUID();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseServer
        .from("sessions")
        .insert({
          id: sessionId,
          title,
          slug,
          status: "active",
          audio_quality: audioQuality,
          sample_rate: sampleRate,
          max_collaborators: maxCollaborators,
          vst3_session_token: vst3Token,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        id: data.id,
        slug: data.slug,
        title: data.title,
        vst3Token: data.vst3_session_token,
        sampleRate: data.sample_rate,
      }, { status: 201 });
    }

    // In local demo mode (when Supabase env vars are pending setup)
    return NextResponse.json({
      id: sessionId,
      slug,
      title,
      vst3Token,
      sampleRate,
      status: "active",
      message: "Session initialized successfully",
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
