import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";

const CompleteUploadSchema = z.object({
  fileId: z.string().uuid().or(z.string().min(5)),
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().min(1),
  mimeType: z.string(),
  storagePath: z.string(),
  uploaderName: z.string().default("Producer"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = CompleteUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid upload confirmation payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { fileId, fileName, fileSizeBytes, mimeType, storagePath, uploaderName } = parsed.data;
    const isStem = fileName.toLowerCase().endsWith(".wav") || fileName.toLowerCase().endsWith(".flac");

    if (isSupabaseConfigured) {
      // Find session
      const { data: session, error: sessErr } = await supabaseServer
        .from("sessions")
        .select("id")
        .eq("slug", slug)
        .single();

      if (sessErr || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const { data: record, error: fileErr } = await supabaseServer
        .from("session_files")
        .insert({
          id: fileId,
          session_id: session.id,
          file_name: fileName,
          file_size_bytes: fileSizeBytes,
          mime_type: mimeType,
          storage_path: storagePath,
          uploader_name: uploaderName,
          is_stem: isStem,
        })
        .select()
        .single();

      if (fileErr) {
        return NextResponse.json({ error: fileErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, file: record }, { status: 201 });
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileId,
        fileName,
        fileSizeBytes,
        mimeType,
        storagePath,
        uploaderName,
        isStem,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
