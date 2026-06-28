export type Locale = "es" | "en";

export type Profile = {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin";
  learning_profile: LearningProfile;
};

export type LearningProfile = {
  learningGoal?: string;
  sessionLength?: string;
  studyPreference?: string;
  explanationStyle?: string;
  focusSupport?: string;
  practiceStyle?: string;
  birthDate?: string;
  birthPlace?: string;
  birthCountry?: string;
  birthCountryCode?: string;
  birthCity?: string;
  birthTime?: string;
  avatarUrl?: string;
  onboardingComplete?: boolean;
  updatedAt?: string;
};

export type StudySpace = {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
};

export type DocumentRecord = {
  id: string;
  study_space_id: string;
  tenant_id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  material_type: MaterialType;
  mime_type: string | null;
  source_url: string | null;
  processing_status:
    | "pending"
    | "processing"
    | "ready"
    | "failed"
    | "intake_validating"
    | "reading_pdf"
    | "chunking"
    | "embedding"
    | "verifying"
    | "summarizing"
    | "generating_diagrams"
    | "generating_study_tools";
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Citation = {
  chunkId: string;
  documentId: string;
  fileName: string;
  pageNumber: number | null;
  content: string;
};

export type MaterialType = "pdf" | "image" | "document" | "link" | "text";

export type ToolKind =
  | "summary"
  | "quiz"
  | "flashcards"
  | "apa_summary"
  | "mind_map"
  | "data_table"
  | "study_guide"
  | "diagram"
  | "infographic";

export type GeneratedArtifact = {
  id: string;
  study_space_id: string;
  kind: ToolKind;
  title: string;
  content: string;
  citations: Citation[];
  created_at: string;
};

export type StudyNote = {
  id: string;
  study_space_id: string;
  title: string;
  content: string;
  selected_document_ids: string[];
  created_at: string;
  updated_at: string;
};
