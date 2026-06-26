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
  birthTime?: string;
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

export type ToolKind = "quiz" | "flashcards" | "apa_summary";

export type GeneratedArtifact = {
  id: string;
  study_space_id: string;
  kind: ToolKind;
  title: string;
  content: string;
  citations: Citation[];
  created_at: string;
};
