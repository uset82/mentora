import { z } from "zod";
import { getAuthedProfile } from "@/lib/supabase/service";
import {
  errorResponse,
  jsonError,
  jsonResponse,
  parseJsonBody,
  requireOwnedStudySpace,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";

const createNoteSchema = z.object({
  studySpaceId: z.string().uuid(),
  title: z.string().trim().min(1).max(140).optional(),
  content: z.string().trim().min(1).max(20000),
  selectedDocumentIds: z.array(z.string().uuid()).max(20).default([]),
});

const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(140).optional(),
  content: z.string().trim().min(1).max(20000).optional(),
});

const deleteNoteSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const { profile, service } = await getAuthedProfile(request.headers.get("authorization"));
    const body = await parseJsonBody(request, createNoteSchema);
    await requireOwnedStudySpace(service, profile, body.studySpaceId);

    const title = body.title ?? buildNoteTitle(body.content);
    const { data: note, error } = await service
      .from("notes")
      .insert({
        tenant_id: profile.tenant_id,
        study_space_id: body.studySpaceId,
        user_id: profile.id,
        title,
        content: body.content,
        selected_document_ids: body.selectedDocumentIds,
      })
      .select("id, study_space_id, title, content, selected_document_ids, created_at, updated_at")
      .single();

    if (error || !note) {
      throw error ?? new Error("Unable to save note.");
    }

    return jsonResponse({ note });
  } catch (error) {
    return errorResponse(error, "Unable to save note.");
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, service } = await getAuthedProfile(request.headers.get("authorization"));
    const body = await parseJsonBody(request, updateNoteSchema);

    const { data: note, error } = await service
      .from("notes")
      .update({
        ...(body.title ? { title: body.title } : {}),
        ...(body.content ? { content: body.content } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("tenant_id", profile.tenant_id)
      .eq("user_id", profile.id)
      .select("id, study_space_id, title, content, selected_document_ids, created_at, updated_at")
      .single();

    if (error || !note) {
      throw error ?? new Error("Unable to update note.");
    }

    return jsonResponse({ note });
  } catch (error) {
    return errorResponse(error, "Unable to update note.");
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile, service } = await getAuthedProfile(request.headers.get("authorization"));
    const body = await parseJsonBody(request, deleteNoteSchema);

    const { error, count } = await service
      .from("notes")
      .delete({ count: "exact" })
      .eq("id", body.id)
      .eq("tenant_id", profile.tenant_id)
      .eq("user_id", profile.id);

    if (error) {
      throw error;
    }
    if (!count) {
      return jsonError("Note not found.", 404);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error, "Unable to delete note.");
  }
}

function buildNoteTitle(content: string) {
  return content
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70) || "Nota de estudio";
}
