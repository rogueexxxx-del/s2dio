import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Missing session slug" }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const { data: session, error } = await supabaseServer
        .from("sessions")
        .select(`
          id,
          title,
          slug,
          status,
          sample_rate,
          audio_quality,
          max_collaborators,
          session_participants (
            id,
            guest_name,
            role,
            is_talkback_muted,
            has_vst3_connected,
            screen_control
          ),
          session_messages (
            id,
            sender_name,
            message,
            is_system,
            created_at
          ),
          session_files (
            id,
            file_name,
            file_size_bytes,
            mime_type,
            storage_path,
            uploader_name,
            created_at
          )
        `)
        .eq("slug", slug)
        .single();

      if (error || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json({ session });
    }

    // Local fallback response
    return NextResponse.json({
      session: {
        id: "local-session-id",
        title: slug.replace(/-/g, " ").toUpperCase(),
        slug,
        status: "active",
        sample_rate: 48000,
        audio_quality: "pcm_lossless",
        max_collaborators: 4,
        participants: [
          { id: "p-host", name: "Producer", role: "host", has_vst3_connected: true },
          { id: "p-guest", name: "Collaborator", role: "collaborator", has_vst3_connected: false },
        ],
        files: [],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
