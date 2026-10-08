import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

// Allowed audio/music production formats
const ALLOWED_MIME_TYPES = [
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/flac",
  "audio/x-flac",
  "audio/aiff",
  "audio/x-aiff",
  "audio/midi",
  "audio/x-midi",
  "audio/mpeg",
  "audio/mp3",
  "application/zip",
  "application/x-zip-compressed",
];

// 250 MB maximum per stem file
const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;

const PresignUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().min(1).max(MAX_FILE_SIZE_BYTES),
  mimeType: z.string().refine((val) => ALLOWED_MIME_TYPES.includes(val), {
    message: "Invalid file type. Only WAV, FLAC, AIFF, MIDI, MP3, and ZIP archives are accepted.",
  }),
  uploaderName: z.string().default("Producer"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const parsed = PresignUploadSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Upload validation failed: Unsupported file type or size";
      return NextResponse.json(
        { error: firstIssue, details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { fileName, fileSizeBytes, mimeType, uploaderName } = parsed.data;

    // Sanitize filename and create secure storage path
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileId = crypto.randomUUID();
    const storagePath = `${slug}/${fileId}-${sanitizedName}`;

    if (isSupabaseConfigured) {
      // Create presigned upload URL from Supabase Storage bucket 'session-files'
      const { data, error } = await supabaseAdmin.storage
        .from("session-files")
        .createSignedUploadUrl(storagePath);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        fileId,
        storagePath,
        uploadUrl: data.signedUrl,
        token: data.token,
      });
    }

    // Local development fallback
    return NextResponse.json({
      fileId,
      storagePath,
      uploadUrl: `/api/sessions/${slug}/files/upload-mock`,
      fileName: sanitizedName,
      fileSizeBytes,
      mimeType,
      uploaderName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
