import { api } from "./api";

/** Matches the DB `document_type` enum in the Supabase schema. */
export const DOCUMENT_TYPES = [
  "id",
  "passport",
  "matric_certificate",
  "results",
  "proof_of_residence",
  "study_permit",
  "cv",
  "other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const documentTypeLabels: Record<DocumentType, string> = {
  id: "ID Document",
  passport: "Passport",
  matric_certificate: "Matric Certificate",
  results: "Results",
  proof_of_residence: "Proof of Residence",
  study_permit: "Study Permit",
  cv: "CV / Résumé",
  other: "Other",
};

export type DocumentDetail = {
  id: string;
  studentId?: string;
  name: string;
  type: string;
  storagePath: string;
  sizeBytes: number;
  createdAt: string;
};

type UploadUrlResponse = { uploadUrl: string; storagePath: string };

/** Best-guess a document type from the filename (user can override). */
export function inferDocumentType(filename: string): DocumentType {
  const l = filename.toLowerCase();
  if (l.includes("cv") || l.includes("resume") || l.includes("résumé") || l.includes("curriculum")) return "cv";
  if (l.includes("passport")) return "passport";
  if (l.includes("matric") || l.includes("nsc") || l.includes("certificate")) return "matric_certificate";
  if (l.includes("result") || l.includes("transcript")) return "results";
  if (l.includes("residence") || l.includes("address") || l.includes("proof")) return "proof_of_residence";
  if (l.includes("permit") || l.includes("visa")) return "study_permit";
  if (l.includes("id")) return "id";
  return "other";
}

/**
 * Upload a document end-to-end:
 *   1. ask the API for a signed upload URL + storage path,
 *   2. PUT the binary straight to storage (signed URL — no app auth header),
 *   3. create the metadata record and return it.
 */
export async function uploadDocument(file: File, type: DocumentType | string): Promise<DocumentDetail> {
  const { uploadUrl, storagePath } = await api.post<UploadUrlResponse>("/api/Documents/upload-url", {
    filename: file.name,
  });

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);

  return api.post<DocumentDetail>("/api/Documents", {
    name: file.name,
    type,
    storagePath,
    sizeBytes: file.size,
  });
}
