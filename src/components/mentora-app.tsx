"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Globe2,
  Table2,
  HelpCircle,
  FileSearch,
  Eye,
  EyeOff,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  Languages,
  Layers3,
  KeyRound,
  PlayCircle,
  Loader2,
  LogOut,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { copy } from "@/lib/i18n";
import { chunkCountForDocument, isGeneratorReadyDocument, normalizeMaterialType } from "@/lib/materials/readiness";
import { parseFlashcards } from "@/lib/study-content";
import type { DocumentRecord, GeneratedArtifact, LearningProfile, Locale, MaterialType, Profile, StudyNote, StudySpace, ToolKind } from "@/lib/types";
import { ChatMessage as ChatMessageComponent } from "./chat/chat-message";
import { ChatInput as ChatInputComponent } from "./chat/chat-input";
import { ChatModeBadge } from "./chat/chat-mode-badge";
import { MarkdownMessage } from "./chat/markdown-message";
import { StudyWorkspace } from "./study-workspace/study-workspace";

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ fileName: string; pageNumber: number | null; content: string }>;
};

type AppView = "home" | "tutor" | "documents" | "tools" | "profile";

type ModelOption = {
  id: string;
  name: string;
  contextLength: number | null;
  isFree: boolean;
  pricingLabel: string;
};

const learningProfileKeys = [
  "learningGoal",
  "sessionLength",
  "studyPreference",
  "explanationStyle",
  "focusSupport",
  "practiceStyle",
] as const;

type LearningProfileOptionKey = (typeof learningProfileKeys)[number];
type PersonalProfileKey = "birthDate" | "birthPlace" | "birthCountryCode" | "birthCity" | "birthTime" | "avatarUrl";
type LearningProfileDraft = Required<Pick<LearningProfile, LearningProfileOptionKey | PersonalProfileKey>>;
type BirthCountryOption = {
  code: string;
  labels: Record<Locale, string>;
  aliases: string[];
  cities: string[];
};
type SelectOption = {
  value: string;
  label: string;
};

function isLearningProfileComplete(draft: LearningProfileDraft) {
  return learningProfileKeys.every((key) => draft[key].trim().length > 0);
}

function learningProfileOptions(t: Record<string, string>): Record<LearningProfileOptionKey, string[]> {
  return {
    learningGoal: [t.goalExamPrep, t.goalUnderstandLectures, t.goalResearchWriting, t.goalOrganizeMaterials, t.goalImproveGrades],
    sessionLength: [t.session15, t.session25, t.session45, t.session60],
    explanationStyle: [t.explainStepByStep, t.explainVisual, t.explainExamplesFirst, t.explainSummaryFirst, t.explainAnalogies],
    focusSupport: [t.focusShortChunks, t.focusCalmLayout, t.focusChecklist, t.focusReminders, t.focusFlexiblePace],
    practiceStyle: [t.practiceExamQuestions, t.practiceFlashcards, t.practiceGuidedExercises, t.practiceTeachBack, t.practiceMixed],
    studyPreference: [t.preferenceActiveRecall, t.preferenceSpacedReview, t.preferenceReadingNotes, t.preferenceVideoAudio, t.preferenceCollaborative],
  };
}

const birthCountryCatalog: BirthCountryOption[] = [
  { code: "PE", labels: { es: "Peru", en: "Peru" }, aliases: ["peru", "pe"], cities: ["Lima", "Arequipa", "Cusco", "Trujillo", "Chiclayo"] },
  { code: "US", labels: { es: "Estados Unidos", en: "United States" }, aliases: ["estados unidos", "united states", "usa", "us"], cities: ["Miami", "New York", "Los Angeles", "Houston", "Chicago"] },
  { code: "NO", labels: { es: "Noruega", en: "Norway" }, aliases: ["noruega", "norway", "no"], cities: ["Oslo", "Bergen", "Trondheim", "Stavanger"] },
  { code: "ES", labels: { es: "Espana", en: "Spain" }, aliases: ["espana", "spain", "es"], cities: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Malaga"] },
  { code: "MX", labels: { es: "Mexico", en: "Mexico" }, aliases: ["mexico", "mx"], cities: ["Ciudad de Mexico", "Guadalajara", "Monterrey", "Puebla", "Tijuana"] },
  { code: "CO", labels: { es: "Colombia", en: "Colombia" }, aliases: ["colombia", "co"], cities: ["Bogota", "Medellin", "Cali", "Barranquilla", "Cartagena"] },
  { code: "AR", labels: { es: "Argentina", en: "Argentina" }, aliases: ["argentina", "ar"], cities: ["Buenos Aires", "Cordoba", "Rosario", "Mendoza", "La Plata"] },
  { code: "CL", labels: { es: "Chile", en: "Chile" }, aliases: ["chile", "cl"], cities: ["Santiago", "Valparaiso", "Concepcion", "La Serena", "Antofagasta"] },
  { code: "EC", labels: { es: "Ecuador", en: "Ecuador" }, aliases: ["ecuador", "ec"], cities: ["Quito", "Guayaquil", "Cuenca", "Manta", "Loja"] },
  { code: "VE", labels: { es: "Venezuela", en: "Venezuela" }, aliases: ["venezuela", "ve"], cities: ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay"] },
  { code: "BR", labels: { es: "Brasil", en: "Brazil" }, aliases: ["brasil", "brazil", "br"], cities: ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador", "Fortaleza"] },
];

function normalizeLocationText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toLocationTitle(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""))
    .join(" ");
}

function getBirthCountryOption(countryCode: string) {
  return birthCountryCatalog.find((country) => country.code === countryCode) ?? null;
}

function getBirthCountryLabel(countryCode: string, locale: Locale) {
  return getBirthCountryOption(countryCode)?.labels[locale] ?? "";
}

function getBirthCountryOptions(locale: Locale): SelectOption[] {
  return birthCountryCatalog.map((country) => ({
    value: country.code,
    label: country.labels[locale],
  }));
}

function findBirthCountryByText(value: string) {
  const normalized = normalizeLocationText(value);
  return (
    birthCountryCatalog.find((country) => {
      const labels = Object.values(country.labels).map(normalizeLocationText);
      return country.aliases.includes(normalized) || labels.includes(normalized);
    }) ?? null
  );
}

function formatBirthPlace(city: string, countryCode: string, locale: Locale) {
  const cleanCity = city.trim();
  const country = getBirthCountryLabel(countryCode, locale);

  if (cleanCity && country) {
    return `${cleanCity}, ${country}`;
  }

  return cleanCity || country;
}

function parseBirthLocation(learningProfile: LearningProfile) {
  const storedCountryCode = String(learningProfile.birthCountryCode ?? "").trim();
  const storedCity = String(learningProfile.birthCity ?? "").trim();

  if (storedCountryCode || storedCity) {
    return {
      birthCountryCode: storedCountryCode,
      birthCity: storedCity,
    };
  }

  const birthPlace = String(learningProfile.birthPlace ?? "").trim();
  if (!birthPlace) {
    return { birthCountryCode: "", birthCity: "" };
  }

  const parts = birthPlace
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 1) {
    const country = findBirthCountryByText(parts[0]);

    return {
      birthCountryCode: country?.code ?? "",
      birthCity: country ? "" : toLocationTitle(parts[0]),
    };
  }

  const [cityPart, ...countryParts] = parts;
  const country = findBirthCountryByText(countryParts.join(" "));

  return {
    birthCountryCode: country?.code ?? "",
    birthCity: cityPart ? toLocationTitle(cityPart) : "",
  };
}

function updateBirthLocationDraft(draft: LearningProfileDraft, patch: Partial<Pick<LearningProfileDraft, "birthCountryCode" | "birthCity">>, locale: Locale) {
  const next = { ...draft, ...patch };

  return {
    ...next,
    birthPlace: formatBirthPlace(next.birthCity, next.birthCountryCode, locale),
  };
}

const toolKinds: ToolKind[] = ["summary", "quiz", "flashcards", "apa_summary", "mind_map", "data_table", "study_guide", "diagram", "infographic"];
const CHAT_TIMEOUT_MS = 75_000;
const AVATAR_CANVAS_SIZE = 320;

function readAvatarFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Invalid image file."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      const source = String(reader.result ?? "");
      const image = new Image();
      image.onerror = () => reject(new Error("Could not process image file."));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_CANVAS_SIZE;
        canvas.height = AVATAR_CANVAS_SIZE;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not process image file."));
          return;
        }

        const cropSize = Math.min(image.width, image.height);
        const sourceX = Math.max(0, (image.width - cropSize) / 2);
        const sourceY = Math.max(0, (image.height - cropSize) / 2);
        context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

const toolMeta: Record<ToolKind, { icon: ReactNode }> = {
  summary: { icon: <BookOpen size={18} /> },
  quiz: { icon: <ClipboardList size={18} /> },
  flashcards: { icon: <Layers3 size={18} /> },
  apa_summary: { icon: <FileText size={18} /> },
  mind_map: { icon: <BrainCircuit size={18} /> },
  data_table: { icon: <Table2 size={18} /> },
  study_guide: { icon: <BookOpen size={18} /> },
  diagram: { icon: <BrainCircuit size={18} /> },
  infographic: { icon: <Sparkles size={18} /> },
};

type LandingVisual = "sources" | "tutor" | "tools" | "profile";

function landingCapabilities(t: Record<string, string>) {
  return [
    {
      eyebrow: t.landingUploadEyebrow,
      title: t.landingUploadTitle,
      body: t.landingUploadText,
      icon: <FileSearch size={18} />,
      visual: "sources",
    },
    {
      eyebrow: t.landingTutorEyebrow,
      title: t.landingTutorTitle,
      body: t.landingTutorText,
      icon: <MessageSquareText size={18} />,
      visual: "tutor",
    },
    {
      eyebrow: t.landingToolsEyebrow,
      title: t.landingToolsTitle,
      body: t.landingToolsText,
      icon: <WandSparkles size={18} />,
      visual: "tools",
    },
    {
      eyebrow: t.landingProfileEyebrow,
      title: t.landingProfileTitle,
      body: t.landingProfileText,
      icon: <BrainCircuit size={18} />,
      visual: "profile",
    },
  ] satisfies Array<{
    eyebrow: string;
    title: string;
    body: string;
    icon: ReactNode;
    visual: LandingVisual;
  }>;
}

function reportClientError(context: string, error: unknown) {
  console.warn(`[Mentora] ${context}:`, error);
}

function resolveAuthErrorMessage(
  error: { message?: string; code?: string; status?: number },
  t: Record<string, string>,
) {
  const code = String(error.code ?? "").toLowerCase();
  const message = String(error.message ?? "").toLowerCase();

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return t.emailNotConfirmed;
  }

  if (
    code === "user_already_registered" ||
    message.includes("user already registered") ||
    message.includes("already been registered")
  ) {
    return t.userAlreadyRegistered;
  }

  if (message.includes("invalid login credentials")) {
    return t.invalidCredentials;
  }

  return t.authError;
}

async function getAccessToken(client: SupabaseClient) {
  try {
    return (await client.auth.getSession()).data.session?.access_token ?? null;
  } catch (caught) {
    reportClientError("Session lookup failed", caught);
    return null;
  }
}

async function autoSignInDev(client: SupabaseClient, skipRef?: { current: boolean }) {
  const isDev = process.env.NODE_ENV !== "production";
  const enabled = process.env.NEXT_PUBLIC_MENTORA_DEV_AUTOLOGIN === "true";
  if (!isDev || !enabled) {
    return;
  }
  if (skipRef?.current) {
    // A user-initiated sign-out happened; don't bounce back into a session.
    skipRef.current = false;
    return;
  }
  const email = process.env.NEXT_PUBLIC_MENTORA_DEV_EMAIL;
  const password = process.env.NEXT_PUBLIC_MENTORA_DEV_PASSWORD;
  if (!email || !password) {
    return;
  }
  try {
    // Ensure dev user exists + is email-confirmed using the service role (bypasses confirmation requirement)
    // and get fresh tokens so we can set the session directly (more reliable than signInWithPassword + listener in some cases)
    let gotDirectSession = false;
    try {
      const res = await fetch("/api/dev/ensure-dev-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (payload?.session?.access_token && payload?.session?.refresh_token) {
        await client.auth.setSession({
          access_token: payload.session.access_token,
          refresh_token: payload.session.refresh_token,
        });
        gotDirectSession = true;
      }
    } catch {
      // non-fatal, fall through to sign in
    }

    if (gotDirectSession) {
      if (process.env.NEXT_PUBLIC_MENTORA_DEV_AUTOLOGIN === "true") {
        setTimeout(() => { window.location.reload(); }, 150);
      }
      return;
    }

    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (!signInError) {
      return;
    }

    // Fallback client-side signup
    const msg = String(signInError.message ?? "").toLowerCase();
    if (msg.includes("invalid login credentials") || msg.includes("user not found")) {
      const { error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: "Dev User", tenant_name: "Dev Workspace" },
        },
      });
      if (signUpError) {
        if (!String(signUpError.message ?? "").toLowerCase().includes("already")) {
          reportClientError("Dev auto sign-up failed", signUpError);
        }
      } else {
        const { error: retryError } = await client.auth.signInWithPassword({ email, password });
        if (retryError && !String(retryError.message ?? "").toLowerCase().includes("invalid login")) {
          reportClientError("Dev auto sign-in after signup", retryError);
        }
      }
    } else {
      reportClientError("Dev auto sign-in failed", signInError);
    }
  } catch (caught) {
    reportClientError("Dev auto sign-in failed", caught);
  }
}

async function loadDocumentChunkCounts(client: SupabaseClient, documentIds: string[]) {
  const counts = new Map<string, number>();
  if (documentIds.length === 0) {
    return counts;
  }

  const { data, error } = await client
    .from("document_chunks")
    .select("document_id")
    .in("document_id", documentIds)
    .limit(10000);

  if (error) {
    reportClientError("Document chunk count load failed", error);
    return counts;
  }

  for (const row of data ?? []) {
    const documentId = String(row.document_id ?? "");
    if (documentId) {
      counts.set(documentId, (counts.get(documentId) ?? 0) + 1);
    }
  }

  return counts;
}

function normalizeLoadedDocument(
  document: DocumentRecord & Record<string, unknown>,
  actualChunkCount: number,
): DocumentRecord {
  const metadata = isPlainRecord(document.metadata) ? document.metadata : {};
  const metadataChunkCount = chunkCountForDocument({ metadata });
  const chunkCount = Math.max(metadataChunkCount, actualChunkCount);
  const fileName = String(document.file_name ?? "Uploaded material");

  return {
    ...document,
    file_name: fileName,
    material_type: normalizeMaterialType(document.material_type ?? metadata.material_type, fileName),
    mime_type: typeof document.mime_type === "string" ? document.mime_type : nullableString(metadata.mime_type),
    source_url: typeof document.source_url === "string" ? document.source_url : nullableString(metadata.source_url),
    metadata: {
      ...metadata,
      chunk_count: chunkCount,
      generator_ready: chunkCount > 0,
    },
  };
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function MentoraApp() {
  const [locale, setLocale] = useState<Locale>("es");
  const supabaseSetup = useMemo(() => {
    try {
      return { client: createClient(), error: null };
    } catch (caught) {
      return {
        client: null,
        error: caught instanceof Error ? caught.message : "Supabase is not configured.",
      };
    }
  }, []);
  const supabase = supabaseSetup.client;
  const setupError = supabaseSetup.error;
  const manualSignOutRef = useRef(false);
  const [session, setSession] = useState<Session | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileDraft, setProfileDraft] = useState<LearningProfileDraft>({
    learningGoal: "",
    sessionLength: "",
    studyPreference: "",
    explanationStyle: "",
    focusSupport: "",
    practiceStyle: "",
    birthDate: "",
    birthPlace: "",
    birthCountryCode: "",
    birthCity: "",
    birthTime: "",
    avatarUrl: "",
  });
  const [spaces, setSpaces] = useState<StudySpace[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>("home");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("openrouter/free");
  const [selectedMode, setSelectedMode] = useState<"fast" | "tutor" | "agent">("fast");
  const [paidModelPrompt, setPaidModelPrompt] = useState<ModelOption | null>(null);
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [openRouterConnected, setOpenRouterConnected] = useState(false);
  const [openRouterServerConnected, setOpenRouterServerConnected] = useState(false);
  const [openRouterConnectionError, setOpenRouterConnectionError] = useState<string | null>(null);
  const t = copy[locale];

  const handleManualSignOut = useCallback(() => {
    manualSignOutRef.current = true;
    void supabase?.auth.signOut();
    setSession(null);
  }, [supabase]);

  const loadWorkspace = useCallback(async (client = supabase) => {
    if (!client) {
      return;
    }

    let workspaceResult: unknown[];

    const isDevAuto = process.env.NEXT_PUBLIC_MENTORA_DEV_AUTOLOGIN === "true";

    try {
      workspaceResult = await Promise.all([
        client.from("profiles").select("id, tenant_id, email, full_name, role, learning_profile").single(),
        client.from("study_spaces").select("*").eq("is_archived", false).order("created_at", { ascending: true }),
        client.from("documents").select("*").order("created_at", { ascending: false }),
        client
          .from("generated_artifacts")
          .select("id, study_space_id, kind, title, content, citations, created_at")
          .order("created_at", { ascending: false }),
        client
          .from("notes")
          .select("id, study_space_id, title, content, selected_document_ids, created_at, updated_at")
          .order("updated_at", { ascending: false }),
        client
          .from("document_processing_jobs")
          .select("document_id, status, current_step, error_message")
          .in("status", ["pending", "processing"]),
      ]);
    } catch (caught) {
      reportClientError("Workspace network request failed", caught);
      if (!isDevAuto) {
        setError(t.authNetworkError);
        try {
          await client.auth.signOut();
        } catch {}
        setSession(null);
        void autoSignInDev(client, manualSignOutRef);
      }
      return;
    }

    const [
      { data: rawProfile, error: profileError },
      { data: spaceRows, error: spaceError },
      { data: documentRows, error: documentsError },
      { data: artifactRows, error: artifactsError },
      { data: noteRows, error: notesError },
      { data: jobRows, error: jobsError },
    ] = workspaceResult as [
      { data: unknown; error: unknown },
      { data: unknown; error: unknown },
      { data: unknown; error: unknown },
      { data: unknown; error: unknown },
      { data: unknown; error: unknown },
      { data: unknown; error: unknown },
    ];

    let profileRow = rawProfile;
    if (profileError) {
      reportClientError("Profile load failed", profileError);
      if (isDevAuto) {
        // Dev stub so we don't get stuck behind auth panel when grants/RLS are not fully set for anon
        profileRow = {
          id: "dev-stub",
          tenant_id: "dev-tenant",
          email: "carlo.dev@mentora.local",
          full_name: "Dev User",
          role: "student",
          learning_profile: { onboardingComplete: true },
        };
      } else {
        setError(t.workspaceLoadError);
        return;
      }
    }

    let loadedSpaceRows = spaceRows;
    if (spaceError) {
      reportClientError("Study space load failed", spaceError);
      if (isDevAuto) {
        loadedSpaceRows = [];
      } else {
        setError(t.workspaceLoadError);
        return;
      }
    }

    if (isDevAuto && (documentsError || artifactsError || notesError || jobsError)) {
      if (documentsError) reportClientError("Documents load failed (dev)", documentsError);
      if (artifactsError) reportClientError("Artifacts load failed (dev)", artifactsError);
      if (notesError) reportClientError("Notes load failed (dev)", notesError);
      if (jobsError) reportClientError("Jobs load failed (dev)", jobsError);
    }

    const loadedProfile = profileRow as Profile;
    const learningProfile = loadedProfile.learning_profile ?? {};
    const birthLocation = parseBirthLocation(learningProfile);
    const loadedSpaces = (loadedSpaceRows ?? []) as StudySpace[];
    const nextActiveSpaceId = activeSpaceId ?? loadedSpaces[0]?.id ?? null;
    let loadedMessages: ChatMessage[] = [];

    if (nextActiveSpaceId) {
      const { data: conversationRows, error: conversationError } = await client
        .from("conversations")
        .select("id")
        .eq("study_space_id", nextActiveSpaceId)
        .order("created_at", { ascending: true })
        .limit(20);

      if (conversationError) {
        reportClientError("Conversation load failed", conversationError);
      } else if (conversationRows && conversationRows.length > 0) {
        const conversationIds = conversationRows.map((conversation) => conversation.id);
        const { data: messageRows, error: messageError } = await client
          .from("messages")
          .select("id, role, content, citations, created_at")
          .in("conversation_id", conversationIds)
          .in("role", ["user", "assistant"])
          .order("created_at", { ascending: true });

        if (messageError) {
          reportClientError("Message load failed", messageError);
        } else {
          loadedMessages = (messageRows ?? []).map((message) => ({
            id: String(message.id),
            role: message.role as "user" | "assistant",
            content: String(message.content ?? ""),
            citations: Array.isArray(message.citations) ? message.citations : [],
          }));
        }
      }
    }

    setProfile(loadedProfile);
    setProfileDraft({
      learningGoal: String(learningProfile.learningGoal ?? ""),
      sessionLength: String(learningProfile.sessionLength ?? ""),
      studyPreference: String(learningProfile.studyPreference ?? ""),
      explanationStyle: String(learningProfile.explanationStyle ?? ""),
      focusSupport: String(learningProfile.focusSupport ?? ""),
      practiceStyle: String(learningProfile.practiceStyle ?? ""),
      birthDate: String(learningProfile.birthDate ?? ""),
      birthCountryCode: birthLocation.birthCountryCode,
      birthCity: birthLocation.birthCity,
      birthPlace: formatBirthPlace(birthLocation.birthCity, birthLocation.birthCountryCode, locale) || String(learningProfile.birthPlace ?? ""),
      birthTime: String(learningProfile.birthTime ?? ""),
      avatarUrl: String(learningProfile.avatarUrl ?? ""),
    });
    setSpaces(loadedSpaces);

    const rawDocs = (documentRows ?? []) as Array<DocumentRecord & Record<string, unknown>>;
    const chunkCounts = await loadDocumentChunkCounts(client, rawDocs.map((document) => document.id).filter(Boolean));
    const jobs = (Array.isArray(jobRows) ? jobRows : []) as {
      document_id: string;
      status: string;
      current_step: string;
      error_message: string | null;
    }[];

    const documentsWithJobs = rawDocs.map((rawDoc) => {
      const doc = normalizeLoadedDocument(rawDoc, chunkCounts.get(rawDoc.id) ?? 0);
      const activeJob = jobs.find((j) => j && j.document_id === doc.id);
      if (activeJob) {
        return {
          ...doc,
          processing_status: (activeJob.status === "processing"
            ? activeJob.current_step
            : activeJob.status) as DocumentRecord["processing_status"],
          error_message: activeJob.error_message || doc.error_message,
        };
      }
      return doc;
    });

    setDocuments(documentsWithJobs);
    setArtifacts((artifactRows ?? []) as GeneratedArtifact[]);
    setNotes((noteRows ?? []) as StudyNote[]);
    setMessages(loadedMessages);

    if (!activeSpaceId && nextActiveSpaceId) {
      setActiveSpaceId(nextActiveSpaceId);
    }
  }, [activeSpaceId, locale, supabase, t]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (cancelled) {
          return;
        }
        if (error || !data.session) {
          // A stale/revoked refresh token (e.g. after a password reset) surfaces
          // here as "Invalid Refresh Token". Always clear the stored session so
          // the bad cookie doesn't replay on the next load.
          const isStaleRefresh =
            !!error && /refresh token|auth session missing/i.test(error.message ?? "");
          if (error && !isStaleRefresh) {
            reportClientError("Session initialization failed", error);
          }
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore — cookies are cleared locally regardless
          }
          setSession(null);
          await autoSignInDev(supabase, manualSignOutRef);
          return;
        }
        // Validate the cached session against the server. A stale refresh
        // token passes getSession() but fails here, so we clear and re-sign-in.
        const { error: userError } = await supabase.auth.getUser();
        if (cancelled) {
          return;
        }
        if (userError) {
          // In dev auto-login mode, be more lenient — the auto login will recover anyway
          const isDevAuto = process.env.NEXT_PUBLIC_MENTORA_DEV_AUTOLOGIN === "true";
          reportClientError("Session validation failed", userError);
          if (!isDevAuto) {
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            setSession(null);
            await autoSignInDev(supabase, manualSignOutRef);
            return;
          }
          // For dev: still set the session from getSession and let auto recover or queries fail gracefully
          setSession(data.session);
          return;
        }
        setSession(data.session);
      })
      .catch(async (caught) => {
        reportClientError("Session initialization failed", caught);
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        setSession(null);
        await autoSignInDev(supabase, manualSignOutRef);
      });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        void autoSignInDev(supabase, manualSignOutRef);
        return;
      }
      if (event === "TOKEN_REFRESHED" && !nextSession) {
        // Refresh failed (revoked/expired token). Clear the stale cookie so it
        // doesn't error again on the next reload.
        void supabase.auth.signOut();
        setSession(null);
        return;
      }
      setSession(nextSession);
      if (!nextSession) {
        void autoSignInDev(supabase, manualSignOutRef);
      }
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [supabase, t.authNetworkError]);

  useEffect(() => {
    if (!supabase || !session) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadWorkspace(supabase);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWorkspace, supabase, session]);



  useEffect(() => {
    if (!session) {
      return;
    }

    fetch("/api/models")
      .then((response) => response.json())
      .then((payload: { models?: ModelOption[]; serverConnected?: boolean }) => {
        const nextModels = payload.models ?? [];
        setModels(nextModels);
        setOpenRouterServerConnected(Boolean(payload.serverConnected));
        const firstFree = nextModels.find((model) => model.isFree);
        if (firstFree) {
          setSelectedModel((current) => nextModels.some((model) => model.id === current && model.isFree) ? current : firstFree.id);
        }
      })
      .catch((caught) => reportClientError("Model list load failed", caught));
  }, [session]);

  const activeSpace = useMemo(
    () => spaces.find((space) => space.id === activeSpaceId) ?? spaces[0] ?? null,
    [activeSpaceId, spaces],
  );
  const activeArtifacts = useMemo(
    () => artifacts.filter((artifact) => !activeSpace || artifact.study_space_id === activeSpace.id),
    [activeSpace, artifacts],
  );
  const activeNotes = useMemo(
    () => notes.filter((note) => !activeSpace || note.study_space_id === activeSpace.id),
    [activeSpace, notes],
  );
  const activeDocuments = useMemo(
    () => documents.filter((document) => !activeSpace || document.study_space_id === activeSpace.id),
    [activeSpace, documents],
  );

  const readyDocuments = activeDocuments.filter((document) => document.processing_status === "ready");
  const generatorReadyDocuments = readyDocuments.filter(isGeneratorReadyDocument);
  const processingDocuments = activeDocuments.filter(
    (document) => document.processing_status !== "ready" && document.processing_status !== "failed"
  );
  const hasReadySources = generatorReadyDocuments.length > 0;

  useEffect(() => {
    if (!supabase || !session || processingDocuments.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadWorkspace(supabase);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [loadWorkspace, supabase, session, processingDocuments.length]);

  if (setupError) {
    return <SetupScreen message={setupError} />;
  }

  if (!session || !supabase) {
    return (
      <AuthScreen
        locale={locale}
        setLocale={setLocale}
        supabase={supabase}
        setupPending={!supabase}
      />
    );
  }

  if (passwordRecovery) {
    return (
      <PasswordRecoveryScreen
        locale={locale}
        setLocale={setLocale}
        supabase={supabase}
        t={t}
        onComplete={() => setPasswordRecovery(false)}
      />
    );
  }

  const needsLearningProfile = Boolean(profile && !profile.learning_profile?.onboardingComplete);

  if (needsLearningProfile) {
    return (
      <main className="mentora-shell onboarding-stage min-h-screen p-3 text-slate-50 sm:p-5">
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center">
          <LearningProfileOnboarding
            busy={busy === "profile"}
            draft={profileDraft}
            locale={locale}
            onChange={setProfileDraft}
            onSave={saveProfile}
            onSignOut={handleManualSignOut}
            setLocale={setLocale}
            t={t}
            userEmail={profile?.email ?? session.user.email ?? ""}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mentora-shell liquid-app-shell min-h-[100dvh] overflow-hidden">
      <div className="student-notice-stack liquid-notice-stack">
        <AnimatePresence>
          {error && (
            <Notice tone="error" icon={<AlertCircle size={18} />} onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {uploadNotice && (
            <Notice tone="info" icon={<Upload size={18} />}>
              {uploadNotice}
            </Notice>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {paidModelPrompt && (
          <OpenRouterConnectDialog
            busy={busy === "openrouter-connect"}
            error={openRouterConnectionError}
            locale={locale}
            model={paidModelPrompt}
            onCancel={() => {
              setPaidModelPrompt(null);
              setOpenRouterConnectionError(null);
            }}
            onConnect={connectOpenRouter}
          />
        )}
      </AnimatePresence>

      <div className="liquid-app-grid is-focus">
        <section className="liquid-main-scroll">
          <section className="liquid-content-panel">
            <div className="min-h-0 flex-1 overflow-visible px-3 pb-5 sm:px-5 sm:pb-6">
              <AnimatePresence mode="wait">
                {activeView === "home" && (
                  <MotionView key="home">
                    <StudyWorkspace
                      activeDocuments={activeDocuments}
                      activeArtifacts={activeArtifacts}
                      activeNotes={activeNotes}
                      activeSpace={activeSpace}
                      busy={busy}
                      error={error}
                      messages={messages}
                      onAddLink={uploadLink}
                      onCreateSpace={(name) => createStudySpace(name)}
                      onCreateNote={saveStudyNote}
                      onDeleteNote={deleteStudyNote}
                      onGenerate={(kind, selectedDocumentIds) => {
                        if (activeSpace) {
                          void generateTool(activeSpace.id, kind, selectedDocumentIds);
                        }
                      }}
                      onOpenProfile={() => setActiveView("profile")}
                      onOpenProgress={() => setError(locale === "es" ? "Progreso estara disponible cuando haya datos reales de estudio." : "Progress will be available when real study data exists.")}
                      onSelectSpace={setActiveSpaceId}
                      onSend={sendTutorMessage}
                      onSignOut={handleManualSignOut}
                      onUpdateNote={updateStudyNote}
                      onUpload={uploadDocument}
                      profile={profile}
                      generatorReadyDocuments={generatorReadyDocuments}
                      readyDocuments={readyDocuments}
                      spaces={spaces}
                      t={t}
                    />
                  </MotionView>
                )}

                {activeView === "tutor" && (
                  <MotionView key="tutor">
                    <TutorStudio
                      activeDocuments={activeDocuments}
                      busy={busy}
                      disabled={busy === "chat"}
                      loading={busy === "chat"}
                      messages={messages}
                      models={models}
                      openRouterConnected={openRouterConnected}
                      openRouterServerConnected={openRouterServerConnected}
                      onAddLink={uploadLink}
                      onCreateNote={createNoteMaterial}
                      onSelectModel={handleModelSelect}
                      onSend={sendTutorMessage}
                      onUpload={uploadDocument}
                      readyDocuments={readyDocuments}
                      selectedModel={selectedModel}
                      selectedMode={selectedMode}
                      onSelectMode={setSelectedMode}
                      t={t}
                      locale={locale}
                    />
                  </MotionView>
                )}

                {activeView === "documents" && (
                  <MotionView key="documents">
                    <DocumentStudio
                      activeDocuments={activeDocuments}
                      busy={busy}
                      onPractice={() => setActiveView("tools")}
                      onTutor={() => setActiveView("tutor")}
                      onUpload={uploadDocument}
                      t={t}
                    />
                  </MotionView>
                )}

                {activeView === "tools" && (
                  <MotionView key="tools">
                    <ToolStudio
                      activeArtifacts={activeArtifacts}
                      activeSpace={activeSpace}
                      busy={busy}
                      hasReadySources={hasReadySources}
                      models={models}
                      openRouterConnected={openRouterConnected}
                      openRouterServerConnected={openRouterServerConnected}
                      onGenerate={(kind) => activeSpace && generateTool(activeSpace.id, kind)}
                      onSelectModel={handleModelSelect}
                      onTutor={() => setActiveView("tutor")}
                      onUpload={uploadDocument}
                      selectedModel={selectedModel}
                      t={t}
                    />
                  </MotionView>
                )}

                {activeView === "profile" && (
                  <MotionView key="profile">
                    <div className="grid h-full min-h-0 gap-3">
                      <header className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
                        <div className="flex min-w-0 items-center gap-2">
                          <button
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => setActiveView("home")}
                            type="button"
                          >
                            <BookOpen size={15} />
                            Estudio
                          </button>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Perfil</p>
                            <h1 className="truncate text-base font-bold leading-tight text-slate-950 sm:text-lg">{profile?.full_name ?? t.student}</h1>
                          </div>
                        </div>
                        <button
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                          onClick={handleManualSignOut}
                          type="button"
                        >
                          <LogOut size={15} />
                          <span className="hidden sm:inline">{t.signOut}</span>
                        </button>
                      </header>
                      <ProfileStudio
                        busy={busy}
                        draft={profileDraft}
                        locale={locale}
                        onChange={setProfileDraft}
                        onError={setError}
                        onSaveLearning={() => saveProfile({ requireLearning: true, requirePersonal: false })}
                        onSaveProfile={() => saveProfile({ requireLearning: false, requirePersonal: true })}
                        profile={profile}
                        t={t}
                      />
                    </div>
                  </MotionView>
                )}
              </AnimatePresence>
            </div>
          </section>
        </section>
      </div>
    </main>
  );

  async function saveProfile(options: { requireLearning?: boolean; requirePersonal?: boolean } = {}) {
    if (!supabase || !session) {
      return;
    }

    const requireLearning = options.requireLearning ?? activeView !== "profile";
    const requirePersonal = options.requirePersonal ?? activeView === "profile";

    if (requireLearning && !isLearningProfileComplete(profileDraft)) {
      setError(t.profileIncomplete);
      return;
    }

    if (requirePersonal && (!profileDraft.birthDate.trim() || !profileDraft.birthCountryCode.trim() || !profileDraft.birthCity.trim())) {
      setError(t.profilePersonalIncomplete);
      return;
    }

    setBusy("profile");
    setError(null);
    const birthCountry = getBirthCountryLabel(profileDraft.birthCountryCode, locale);
    const birthPlace = formatBirthPlace(profileDraft.birthCity, profileDraft.birthCountryCode, locale);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        learning_profile: {
          learningGoal: profileDraft.learningGoal,
          sessionLength: profileDraft.sessionLength,
          studyPreference: profileDraft.studyPreference,
          explanationStyle: profileDraft.explanationStyle,
          focusSupport: profileDraft.focusSupport,
          practiceStyle: profileDraft.practiceStyle,
          birthDate: profileDraft.birthDate,
          birthCountry,
          birthCountryCode: profileDraft.birthCountryCode,
          birthCity: profileDraft.birthCity,
          birthPlace,
          birthTime: profileDraft.birthTime,
          avatarUrl: profileDraft.avatarUrl,
          onboardingComplete: isLearningProfileComplete(profileDraft) || Boolean(profile?.learning_profile?.onboardingComplete),
          updatedAt: new Date().toISOString(),
        },
      })
      .eq("id", session.user.id);

    setBusy(null);
    if (profileError) {
      reportClientError("Profile update failed", profileError);
      setError(t.saveProfileError);
      return;
    }

    await loadWorkspace();
  }

  async function createStudySpace(name: string) {
    if (!supabase || !session) {
      return null;
    }

    setBusy("space");
    setError(null);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      reportClientError("Study space profile lookup failed", profileError);
      setBusy(null);
      setError(t.createSpaceError);
      return null;
    }

    const { data: createdSpace, error: insertError } = await supabase
      .from("study_spaces")
      .insert({
        tenant_id: profile.tenant_id,
        user_id: session.user.id,
        name,
        description: t.personalWorkspace,
      })
      .select("id")
      .single();

    setBusy(null);
    if (insertError) {
      reportClientError("Study space creation failed", insertError);
      setError(t.createSpaceError);
      return null;
    }

    if (createdSpace?.id) {
      setActiveSpaceId(createdSpace.id);
    }

    await loadWorkspace();
    return createdSpace?.id ?? null;
  }

  async function sendTutorMessage(message: string, selectedDocumentIds: string[] = []) {
    const studySpaceId = activeSpace?.id ?? (await createStudySpace(t.personalWorkspace));
    if (!studySpaceId) {
      return;
    }

    await askTutor(studySpaceId, message, selectedDocumentIds);
  }

  async function uploadDocument(file: File, materialType: MaterialType = "pdf") {
    const studySpaceId = activeSpace?.id ?? (await createStudySpace(t.personalWorkspace));

    if (!studySpaceId) {
      return false;
    }

    return uploadMaterial({ file, materialType, studySpaceId });
  }

  async function uploadLink(url: string) {
    const studySpaceId = activeSpace?.id ?? (await createStudySpace(t.personalWorkspace));

    if (!studySpaceId) {
      return false;
    }

    return uploadMaterial({ materialType: "link", studySpaceId, url });
  }

  async function createNoteMaterial(text: string) {
    const studySpaceId = activeSpace?.id ?? (await createStudySpace(t.personalWorkspace));

    if (!studySpaceId) {
      return false;
    }

    return uploadMaterial({ materialType: "text", studySpaceId, text });
  }

  async function saveStudyNote(text: string, selectedDocumentIds: string[] = []) {
    if (!supabase) {
      return false;
    }

    const studySpaceId = activeSpace?.id ?? (await createStudySpace(t.personalWorkspace));
    if (!studySpaceId) {
      return false;
    }

    setBusy("note");
    setError(null);
    const token = await getAccessToken(supabase);
    if (!token) {
      setBusy(null);
      setError(t.authError);
      return false;
    }

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studySpaceId,
          content: text,
          selectedDocumentIds,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { note?: StudyNote; error?: string };
      if (!response.ok || !payload.note) {
        setError(payload.error ?? "No se pudo guardar la nota.");
        return false;
      }
      setNotes((current) => [payload.note as StudyNote, ...current]);
      return true;
    } catch (caught) {
      reportClientError("Note save failed", caught);
      setError(t.authNetworkError);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function updateStudyNote(noteId: string, patch: { title?: string; content?: string }) {
    if (!supabase) {
      return false;
    }

    const token = await getAccessToken(supabase);
    if (!token) {
      setError(t.authError);
      return false;
    }

    try {
      const response = await fetch("/api/notes", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: noteId, ...patch }),
      });
      const payload = (await response.json().catch(() => ({}))) as { note?: StudyNote; error?: string };
      if (!response.ok || !payload.note) {
        setError(payload.error ?? "No se pudo actualizar la nota.");
        return false;
      }
      setNotes((current) => current.map((note) => (note.id === noteId ? payload.note as StudyNote : note)));
      return true;
    } catch (caught) {
      reportClientError("Note update failed", caught);
      setError(t.authNetworkError);
      return false;
    }
  }

  async function deleteStudyNote(noteId: string) {
    if (!supabase) {
      return false;
    }

    const token = await getAccessToken(supabase);
    if (!token) {
      setError(t.authError);
      return false;
    }

    try {
      const response = await fetch("/api/notes", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: noteId }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "No se pudo eliminar la nota.");
        return false;
      }
      setNotes((current) => current.filter((note) => note.id !== noteId));
      return true;
    } catch (caught) {
      reportClientError("Note delete failed", caught);
      setError(t.authNetworkError);
      return false;
    }
  }

  function handleModelSelect(modelId: string) {
    const model = models.find((item) => item.id === modelId);

    if (model && !model.isFree && !openRouterConnected) {
      setOpenRouterConnectionError(null);
      setPaidModelPrompt(model);
      return;
    }

    setPaidModelPrompt(null);
    setSelectedModel(modelId);
  }

  async function connectOpenRouter(apiKey: string) {
    if (!supabase || !paidModelPrompt) {
      return;
    }

    setBusy("openrouter-connect");
    setOpenRouterConnectionError(null);
    const token = await getAccessToken(supabase);
    if (!token) {
      setBusy(null);
      setOpenRouterConnectionError(t.authError);
      return;
    }

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });
      const payload = (await response.json().catch(() => ({}))) as { connected?: boolean; error?: string };
      if (!response.ok || !payload.connected) {
        setOpenRouterConnectionError(payload.error ?? t.openRouterConnectError);
        return;
      }

      setOpenRouterApiKey(apiKey);
      setOpenRouterConnected(true);
      setSelectedModel(paidModelPrompt.id);
      setPaidModelPrompt(null);
    } catch (caught) {
      reportClientError("OpenRouter connection failed", caught);
      setOpenRouterConnectionError(t.authNetworkError);
    } finally {
      setBusy(null);
    }
  }

  function selectedOpenRouterApiKey() {
    const model = models.find((item) => item.id === selectedModel);
    return model && !model.isFree && openRouterConnected ? openRouterApiKey : undefined;
  }

  async function uploadMaterial(input: {
    file?: File;
    materialType: MaterialType;
    studySpaceId: string;
    text?: string;
    url?: string;
  }) {
    if (!supabase) {
      return false;
    }

    const materialLabel = input.file?.name ?? input.url ?? t.createNote;
    setBusy("upload");
    setError(null);
    setUploadNotice(`${t.processingFile} ${materialLabel.slice(0, 80)}`);
    const token = await getAccessToken(supabase);
    if (!token) {
      setBusy(null);
      setUploadNotice(null);
      setError(t.authError);
      return false;
    }

    const isFileUpload = Boolean(input.file);
    const body = isFileUpload
      ? (() => {
          const formData = new FormData();
          formData.append("studySpaceId", input.studySpaceId);
          formData.append("materialType", input.materialType);
          formData.append("file", input.file as File);
          return formData;
        })()
      : JSON.stringify({
          studySpaceId: input.studySpaceId,
          materialType: input.materialType,
          text: input.text,
          url: input.url,
        });

    let response: Response;
    try {
      response = await fetch("/api/materials", {
        method: "POST",
        headers: isFileUpload
          ? { Authorization: `Bearer ${token}` }
          : { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body,
      });
    } catch (caught) {
      reportClientError("Material upload request failed", caught);
      setBusy(null);
      setUploadNotice(null);
      setError(t.authNetworkError);
      return false;
    }

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    setUploadNotice(null);
    if (!response.ok) {
      setError(payload.error ?? "Upload failed.");
      return false;
    }

    setUploadNotice(`${materialLabel.slice(0, 80)} ${t.uploadReadyNotice}`);
    await loadWorkspace();
    setActiveView("home");
    window.setTimeout(() => setUploadNotice(null), 6000);
    return true;
  }

  async function askTutor(studySpaceId: string, message: string, selectedDocumentIds: string[] = []) {
    if (!supabase) {
      return;
    }

    const assistantId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setBusy("chat");
    setError(null);
    const token = await getAccessToken(supabase);
    if (!token) {
      setError(t.authError);
      setMessages((current) => current.filter((item) => item.id !== assistantId));
      setBusy(null);
      return;
    }

    let response: Response;
    const chatController = new AbortController();
    const chatTimeout = window.setTimeout(() => chatController.abort(), CHAT_TIMEOUT_MS);
    const fallbackChatAnswer =
      locale === "es"
        ? "Me quede sin una respuesta completa del modelo. El documento ya esta disponible; intenta de nuevo o cambia al modelo gratuito por defecto."
        : "I could not get a complete answer from the model. The document is available; try again or switch to the default free model.";

    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studySpaceId,
          message,
          locale,
          model: selectedModel,
          openRouterApiKey: selectedOpenRouterApiKey(),
          mode: selectedMode,
          selectedDocumentIds,
        }),
        signal: chatController.signal,
      });
    } catch (caught) {
      reportClientError("Tutor request network failed", caught);
      setError(t.authNetworkError);
      setMessages((current) =>
        current.map((item) => (item.id === assistantId ? { ...item, content: fallbackChatAnswer } : item)),
      );
      setBusy(null);
      window.clearTimeout(chatTimeout);
      return;
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      const errorMessage = payload.error ?? "Tutor request failed.";
      setError(errorMessage);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content:
                  locale === "es"
                    ? `No pude responder: ${errorMessage}`
                    : `I could not reply: ${errorMessage}`,
              }
            : item,
        ),
      );
      setBusy(null);
      window.clearTimeout(chatTimeout);
      return;
    }

    if (!response.body) {
      setError("Tutor stream did not return a response body.");
      setMessages((current) =>
        current.map((item) => (item.id === assistantId ? { ...item, content: fallbackChatAnswer } : item)),
      );
      setBusy(null);
      window.clearTimeout(chatTimeout);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answerReceived = false;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          const payload = JSON.parse(line) as {
            event: "meta" | "delta" | "done" | "error";
            data: string | { error?: string; citations?: ChatMessage["citations"]; answer?: string };
          };

          if (payload.event === "delta" && typeof payload.data === "string") {
            answerReceived = true;
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId ? { ...item, content: item.content + payload.data } : item,
              ),
            );
          }

          if (payload.event === "done" && typeof payload.data === "object") {
            const doneData = payload.data;
            answerReceived = Boolean(doneData.answer?.trim()) || answerReceived;
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId
                  ? {
                      ...item,
                      content: doneData.answer?.trim() ? doneData.answer : item.content || fallbackChatAnswer,
                      citations: doneData.citations,
                    }
                  : item,
              ),
            );
          }

          if (payload.event === "error" && typeof payload.data === "object") {
            const errorData = payload.data;
            setError(errorData.error ?? "Tutor request failed.");
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId
                  ? {
                      ...item,
                      content: errorData.answer?.trim() ? errorData.answer : item.content || fallbackChatAnswer,
                      citations: errorData.citations ?? item.citations,
                    }
                  : item,
              ),
            );
          }
        }
      }

      if (!answerReceived) {
        setMessages((current) =>
          current.map((item) => (item.id === assistantId ? { ...item, content: item.content || fallbackChatAnswer } : item)),
        );
      }
    } catch (caught) {
      reportClientError("Tutor stream failed", caught);
      setMessages((current) =>
        current.map((item) => (item.id === assistantId ? { ...item, content: item.content || fallbackChatAnswer } : item)),
      );
    } finally {
      window.clearTimeout(chatTimeout);
      setBusy(null);
    }
  }

  async function generateTool(studySpaceId: string, kind: ToolKind, selectedDocumentIds: string[] = []) {
    if (!supabase) {
      return;
    }

    setBusy(kind);
    setError(null);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studySpaceId,
          kind,
          locale,
          model: selectedModel,
          openRouterApiKey: selectedOpenRouterApiKey(),
          selectedDocumentIds,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        artifact?: GeneratedArtifact;
        error?: string;
      };

      if (!response.ok) {
        setError(
          response.status === 409
            ? "No ready source chunks found. Wait for processing or upload another readable source."
            : payload.error ?? "Generation failed.",
        );
        return;
      }

      if (!payload.artifact) {
        setError("Generation finished without a Studio output.");
        return;
      }

      const artifact = payload.artifact;
      setArtifacts((current) => [artifact, ...current]);
    } catch (caught) {
      reportClientError("Study tool generation failed", caught);
      setError("Generation failed. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }
}

function MotionView({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function SetupScreen({ message }: { message: string }) {
  return (
    <main className="mentora-shell flex min-h-screen items-center justify-center p-4 text-white">
      <section className="auth-card grid w-full max-w-5xl gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_420px]">
        <div className="flex min-h-[460px] flex-col justify-between">
          <div>
            <div className="brand-mark mb-7 h-14 w-14">
              <Settings2 size={24} />
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white sm:text-6xl">Configure Mentora</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{message}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Feature icon={<BrainCircuit size={18} />} text="Grounded tutor" />
            <Feature icon={<FolderOpen size={18} />} text="Study spaces" />
            <Feature icon={<Sparkles size={18} />} text="Active tools" />
          </div>
        </div>

        <div className="setup-terminal">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <span className="ml-2">.env.local</span>
          </div>
          <pre className="overflow-x-auto text-xs leading-6 text-cyan-100 sm:text-sm">
            NEXT_PUBLIC_SUPABASE_URL=...{"\n"}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=...{"\n"}
            SUPABASE_SERVICE_ROLE_KEY=...{"\n"}
            OPENAI_API_KEY=...{"\n"}
            AI_PROVIDER=openrouter{"\n"}
            OPENROUTER_API_KEY=...{"\n"}
            OPENROUTER_MODEL=openrouter/free
          </pre>
        </div>
      </section>
    </main>
  );
}

function AuthScreen({
  locale,
  setLocale,
  supabase,
  setupPending,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  supabase: SupabaseClient | null;
  setupPending: boolean;
}) {
  const t = copy[locale];
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [tenantName, setTenantName] = useState("Personal Mentora");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const devAutoLogin = process.env.NEXT_PUBLIC_MENTORA_DEV_AUTOLOGIN === "true";
  const devEmail = process.env.NEXT_PUBLIC_MENTORA_DEV_EMAIL || "";
  const devPassword = process.env.NEXT_PUBLIC_MENTORA_DEV_PASSWORD || "";
  const devAutoLoginAttempted = useRef(false);

  function fillDevCredentials() {
    if (devEmail) setEmail(devEmail);
    if (devPassword) setPassword(devPassword);
    if (mode !== "signin") setMode("signin");
  }

  async function devSignInNow() {
    if (devAutoLogin && devEmail) {
      try {
        const res = await fetch("/api/dev/ensure-dev-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: devEmail, password: devPassword }),
        });
        const payload = await res.json().catch(() => ({}));
        if (payload?.session?.access_token && payload?.session?.refresh_token) {
          await supabase?.auth.setSession({
            access_token: payload.session.access_token,
            refresh_token: payload.session.refresh_token,
          });
          if (devAutoLogin) {
            setTimeout(() => { window.location.reload(); }, 150);
          }
          return;
        }
      } catch {
        // ignore — fall back to normal sign in flow
      }
    }
    fillDevCredentials();
    // small delay for state + submit
    setTimeout(() => {
      void submit();
    }, 30);
  }

  // In dev with auto-login enabled, automatically attempt dev sign-in as soon as the auth panel is shown
  useEffect(() => {
    if (devAutoLoginAttempted.current || !devAutoLogin || !devEmail || busy) {
      return;
    }

    devAutoLoginAttempted.current = true;
    // Small delay to let the UI settle and avoid double attempts with the top-level autoSignInDev
    const timeout = setTimeout(() => {
      void devSignInNow();
    }, 150);

    return () => clearTimeout(timeout);
    // This dev-only auto-login is intentionally one-shot; devSignInNow reads the latest form helpers through this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, devAutoLogin, devEmail]);

  async function submit() {
    if (!supabase) {
      return;
    }

    setBusy(true);
    setMessage(null);

    if (mode === "reset") {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });

        setBusy(false);
        setMessage(error ? t.authError : t.resetEmailSent);
      } catch (caught) {
        reportClientError("Password reset request failed", caught);
        setBusy(false);
        setMessage(t.authNetworkError);
      }

      return;
    }

    let result;

    try {
      result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: { data: { full_name: fullName, tenant_name: tenantName } },
            })
          : await supabase.auth.signInWithPassword({ email, password });
    } catch (caught) {
      reportClientError("Authentication network request failed", caught);
      setBusy(false);
      setMessage(t.authNetworkError);
      return;
    }

    setBusy(false);
    if (result.error) {
      setMessage(resolveAuthErrorMessage(result.error, t));
    } else if (mode === "signup" && !result.data.session) {
      setMessage(t.checkEmail);
    }
  }

  return (
    <main className="mentora-landing min-h-screen text-[#071038]">
      <nav className="landing-nav" aria-label="Mentora">
        <MentoraLogo />
        <div className="landing-nav-links">
          <a href="#how">{t.landingHowNav}</a>
          <a href="#features">{t.landingFeaturesNav}</a>
          <a href="#plans">{t.landingPlansNav}</a>
          <a href="#blog">{t.landingBlogNav}</a>
          <a href="#universities">{t.landingUniversitiesNav}</a>
        </div>
        <div className="landing-nav-actions">
          <button className="landing-language" aria-label={t.switchLanguage} onClick={() => setLocale(locale === "es" ? "en" : "es")} type="button">
            <Globe2 size={17} />
            {locale.toUpperCase()}
            <ChevronRight size={14} />
          </button>
          <a className="landing-help" href="#blog" aria-label="Help">
            <HelpCircle size={18} />
          </a>
          <a className="landing-primary-small" href="#auth-panel">
            {t.landingStartFree}
            <ArrowUpRight size={16} />
          </a>
        </div>
      </nav>

      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="landing-eyebrow">
              <Sparkles size={17} />
              {t.landingKicker}
            </span>
            <h1>
              {t.landingHeroMain} <span>{t.landingHeroAccent}</span>
            </h1>
            <p>{t.landingHeroText}</p>
            <div className="landing-hero-actions">
              <a className="landing-primary-cta" href="#auth-panel">
                {t.signUp}
                <ChevronRight size={20} />
              </a>
              <a className="landing-secondary-cta" href="#demo">
                {t.landingDemo}
                <PlayCircle size={20} />
              </a>
            </div>
            <div className="landing-rating" aria-label={t.landingRatingLabel}>
              <div className="landing-avatars">
                <span>DR</span>
                <span>VM</span>
                <span>SG</span>
                <span>CT</span>
              </div>
              <span className="landing-stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={15} fill="currentColor" />
                ))}
              </span>
              <strong>4.9/5</strong>
              <small>{t.landingStudentCount}</small>
            </div>
          </motion.div>
        </div>
        <HeroProductMockup t={t} />
      </section>

      <section className="landing-auth-panel" id="auth-panel">
        <div className="landing-auth-copy">
          <span className="landing-eyebrow">
            <ShieldCheck size={17} />
            {t.landingAccessEyebrow}
          </span>
          <h2>{t.landingAccessTitle}</h2>
          <p>{mode === "signin" ? t.signInPrompt : mode === "signup" ? t.signUpPrompt : t.resetPasswordText}</p>
        </div>
        <div className="landing-form-card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="segmented-control">
              {(["signin", "signup"] as const).map((item) => (
                <button
                  key={item}
                  className={mode === item ? "is-active" : ""}
                  onClick={() => setMode(item)}
                  type="button"
                >
                  {item === "signin" ? t.signIn : t.signUp}
                </button>
              ))}
            </div>
            <button
              className="icon-button shrink-0"
              aria-label={t.switchLanguage}
              onClick={() => setLocale(locale === "es" ? "en" : "es")}
              type="button"
            >
              <Languages size={18} />
              <span className="text-xs font-bold">{locale.toUpperCase()}</span>
            </button>
          </div>
          <div className="space-y-3">
            {devAutoLogin && devEmail && (
              <div className="rounded-lg border border-emerald-400/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
                Dev mode: <span className="font-mono">{devEmail}</span>
                <button
                  type="button"
                  className="ml-2 rounded border border-emerald-400/50 px-2 py-0.5 hover:bg-emerald-900/50"
                  onClick={devSignInNow}
                >
                  Sign in as dev now
                </button>
                <button
                  type="button"
                  className="ml-1 rounded border border-emerald-400/30 px-1.5 py-0.5 text-[10px] hover:bg-emerald-900/40"
                  onClick={fillDevCredentials}
                >
                  Fill only
                </button>
                <div className="mt-1 text-[10px] opacity-70">Still blocked? Disable &quot;Confirm email&quot; in Supabase → Authentication → Providers → Email.</div>
              </div>
            )}
            {mode === "signup" && (
              <>
                <TextField label={t.fullName} value={fullName} onChange={setFullName} />
                <TextField label={t.tenantName} value={tenantName} onChange={setTenantName} />
              </>
            )}
            <TextField label={t.email} value={email} onChange={setEmail} type="email" />
            {mode !== "reset" && <TextField label={t.password} value={password} onChange={setPassword} t={t} type="password" />}
            <button className="primary-button h-12 w-full justify-center" disabled={busy || setupPending} onClick={submit} type="button">
              {busy ? <Loader2 className="animate-spin" size={18} /> : mode === "signin" ? t.signIn : mode === "signup" ? t.signUp : t.resetPassword}
              {!busy && <ChevronRight size={18} />}
            </button>
            {mode === "signin" && (
              <button className="secondary-button h-10 w-full justify-center text-sm" onClick={() => setMode("reset")} type="button">
                {t.forgotPassword}
              </button>
            )}
            {mode === "reset" && (
              <button className="secondary-button h-10 w-full justify-center text-sm" onClick={() => setMode("signin")} type="button">
                {t.backToSignIn}
              </button>
            )}
            {message && <p className="landing-form-message">{message}</p>}
          </div>
        </div>
      </section>

      <UniversityStrip t={t} />
      <LandingFeatureGrid t={t} />
      <LandingHowItWorks t={t} />
      <LandingTestimonials t={t} />
      <LandingFooter t={t} />
    </main>
  );
}

function MentoraLogo({ onClick, href = "/" }: { onClick?: () => void; href?: string }) {
  return (
    <a
      className="mentora-logo"
      href={onClick ? undefined : href}
      aria-label="Mentora"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={
        onClick
          ? (event) => {
              event.preventDefault();
              onClick();
            }
          : undefined
      }
    >
      <span className="mentora-logo-mark" aria-hidden="true" />
      <span>Mentora</span>
    </a>
  );
}

function HeroProductMockup({ t }: { t: Record<string, string> }) {
  return (
    <motion.div
      className="hero-product-stage"
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
    >
      <div className="hero-laptop">
        <div className="hero-laptop-top">
          <MentoraLogo />
          <span>ML</span>
        </div>
        <div className="hero-laptop-grid">
          <aside>
            {["Inicio", "Materiales", "Tutor IA", "Practica"].map((item, index) => (
              <span key={item} className={index === 2 ? "is-active" : ""}>{item}</span>
            ))}
          </aside>
          <main>
            <h3>Hola, Maria</h3>
            <p>{t.landingLaptopSubtitle}</p>
            <div className="hero-search-bar">{t.landingAskPlaceholder}<ChevronRight size={16} /></div>
            <div className="hero-mini-stats">
              <span><strong>24</strong>{t.flashcards}</span>
              <span><strong>76%</strong>{t.readiness}</span>
              <span><strong>5</strong>{t.quiz}</span>
            </div>
            <div className="hero-material-list">
              {["Fisiologia Humana.pdf", "Apuntes Clase 8.pdf", "Lectura Obligatoria.pdf", "Banco de preguntas.pdf"].map((item) => (
                <span key={item}>{item}<small>{t.ready}</small></span>
              ))}
            </div>
          </main>
        </div>
      </div>
      <div className="floating-upload-card">
        <Upload size={28} />
        <strong>{t.landingUploadMini}</strong>
        <small>PDFs con texto</small>
      </div>
      <div className="floating-chat-card">
        <strong>{t.tutor}</strong>
        <p>{t.landingTutorMini}</p>
        <span>{t.sourcesReady}</span>
      </div>
      <div className="floating-flashcard-card">
        <strong>{t.flashcards}</strong>
        <p>{t.landingFlashcardMini}</p>
        <small>1/24</small>
      </div>
      <div className="floating-progress-card">
        <strong>{t.landingProgressMini}</strong>
        <span>76%</span>
        <div><i /></div>
      </div>
      <MentoraMascot />
      <div className="hero-trust-badges">
        <span><BrainCircuit size={16} />{t.landingBadgeCareer}</span>
        <span><ShieldCheck size={16} />{t.landingBadgeSources}</span>
        <span><LockIcon />{t.landingBadgePrivate}</span>
      </div>
    </motion.div>
  );
}

function LockIcon() {
  return <span className="tiny-lock" aria-hidden="true" />;
}

function MentoraMascot() {
  return (
    <div className="mentora-mascot" aria-hidden="true">
      <span />
      <i />
    </div>
  );
}

function UniversityStrip({ t }: { t: Record<string, string> }) {
  return (
    <section className="university-strip" id="universities">
      <p>{t.landingUniversitiesText}</p>
      <div>
        {["TEC", "PUCP", "Los Andes", "ITAM", "UCR", "UNAM", "UdeC", t.landingManyMore].map((logo) => (
          <span key={logo}>{logo}</span>
        ))}
      </div>
    </section>
  );
}

function LandingFeatureGrid({ t }: { t: Record<string, string> }) {
  const extra = [
    { icon: <FileText size={22} />, title: t.landingFeatureSummaries, text: t.landingFeatureSummariesText, tone: "coral" },
    { icon: <ClipboardList size={22} />, title: t.landingFeatureQuiz, text: t.landingFeatureQuizText, tone: "blue" },
  ];
  const cards = [
    ...landingCapabilities(t).map((item, index) => ({
      icon: item.icon,
      title: item.title,
      text: item.body,
      tone: ["blue", "violet", "mint", "coral"][index] ?? "blue",
    })),
    ...extra,
  ];

  return (
    <section className="landing-section" id="features">
      <h2>{t.landingAllYouNeed}</h2>
      <div className="landing-feature-grid">
        {cards.map((card, index) => (
          <motion.article
            key={card.title}
            className={`landing-feature-card tone-${card.tone}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.28, delay: index * 0.04 }}
          >
            <span>{card.icon}</span>
            <strong>{index + 1}. {card.title}</strong>
            <p>{card.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function LandingHowItWorks({ t }: { t: Record<string, string> }) {
  const steps = [
    [t.landingStepUpload, t.landingStepUploadText, <Upload key="upload" size={28} />],
    [t.landingStepProfile, t.landingStepProfileText, <BrainCircuit key="profile" size={28} />],
    [t.landingStepTutor, t.landingStepTutorText, <MessageSquareText key="tutor" size={28} />],
    [t.landingStepResults, t.landingStepResultsText, <Flame key="results" size={28} />],
  ] as const;

  return (
    <section className="landing-section" id="how">
      <h2>{t.landingHowTitle}</h2>
      <div className="landing-steps">
        {steps.map(([title, text, icon], index) => (
          <article key={title}>
            <span>{index + 1}</span>
            <div>{icon}</div>
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LandingTestimonials({ t }: { t: Record<string, string> }) {
  const testimonials = [
    ["Diego R.", "Ingeniería, ITAM", t.testimonialDiego],
    ["Valentina M.", "Psicología, U. de los Andes", t.testimonialValentina],
    ["Sebastián G.", "Administración, PUCP", t.testimonialSebastian],
    ["Camila T.", "Derecho, UCR", t.testimonialCamila],
  ];

  return (
    <section className="landing-section landing-testimonials">
      <h2>{t.landingTestimonialsTitle}</h2>
      <div>
        {testimonials.map(([name, school, quote]) => (
          <article key={name}>
            <span>{name.slice(0, 2)}</span>
            <p>“{quote}”</p>
            <strong>{name}</strong>
            <small>{school}</small>
            <i>★★★★★ 5.0</i>
          </article>
        ))}
      </div>
    </section>
  );
}

function LandingFooter({ t }: { t: Record<string, string> }) {
  return (
    <footer className="landing-footer" id="plans">
      <div>
        <MentoraLogo />
        <p>{t.landingFooterText}</p>
      </div>
      <div>
        <strong>Producto</strong>
        <a href="#how">{t.landingHowNav}</a>
        <a href="#features">{t.landingFeaturesNav}</a>
        <a href="#plans">{t.landingPlansNav}</a>
      </div>
      <div id="blog">
        <strong>Recursos</strong>
        <a href="#blog">Blog</a>
        <a href="#features">Guías de estudio</a>
        <a href="#auth-panel">Centro de ayuda</a>
      </div>
      <div>
        <strong>{t.landingNewsletterTitle}</strong>
        <p>{t.landingNewsletterText}</p>
        <label>
          <input placeholder={t.email} />
          <button type="button">{t.landingSubscribe}</button>
        </label>
      </div>
    </footer>
  );
}

function PasswordRecoveryScreen({
  locale,
  onComplete,
  setLocale,
  supabase,
  t,
}: {
  locale: Locale;
  onComplete: () => void;
  setLocale: (locale: Locale) => void;
  supabase: SupabaseClient;
  t: Record<string, string>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setBusy(false);
        setMessage(t.recoverySessionMissing);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      setBusy(false);

      if (error) {
        setMessage(error.message || t.authError);
        return;
      }

      setMessage(t.passwordUpdated);
      window.history.replaceState({}, document.title, window.location.origin);
      onComplete();
    } catch (caught) {
      reportClientError("Password update failed", caught);
      setBusy(false);
      setMessage(t.authNetworkError);
    }
  }

  return (
    <main className="mentora-shell auth-stage flex min-h-screen items-center justify-center p-3 text-white sm:p-5">
      <section className="auth-card recovery-card w-full max-w-xl p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="brand-mark h-14 w-14">
            <UserRound size={24} />
          </div>
          <button
            className="icon-button"
            aria-label={t.switchLanguage}
            onClick={() => setLocale(locale === "es" ? "en" : "es")}
            type="button"
          >
            <Languages size={18} />
          </button>
        </div>
        <h1 className="text-3xl font-semibold text-white">{t.updatePassword}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{t.updatePasswordText}</p>
        <div className="mt-5 space-y-3">
          <TextField label={t.newPassword} value={password} onChange={setPassword} t={t} type="password" />
          <button className="primary-button h-12 w-full justify-center" disabled={busy || password.length < 6} onClick={submit} type="button">
            {busy ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {t.updatePassword}
          </button>
          {message && (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-300">
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function ChatModeSelector({
  mode,
  onChange,
  t,
}: {
  mode: "fast" | "tutor" | "agent";
  onChange: (mode: "fast" | "tutor" | "agent") => void;
  t: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 select-none">
      {(["fast", "tutor", "agent"] as const).map((m) => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              isActive
                ? "bg-cyan-300 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
            }`}
            onClick={() => onChange(m)}
          >
            {m === "fast" ? t.fastChat : m === "tutor" ? t.pdfTutor : t.smartAgent}
          </button>
        );
      })}
    </div>
  );
}

function TutorStudio({
  activeDocuments,
  busy,
  disabled,
  loading,
  messages,
  models,
  openRouterConnected,
  openRouterServerConnected,
  onAddLink,
  onCreateNote,
  onSelectModel,
  onSend,
  onUpload,
  readyDocuments,
  selectedModel,
  selectedMode,
  onSelectMode,
  t,
  locale,
}: {
  activeDocuments: DocumentRecord[];
  busy: string | null;
  disabled: boolean;
  loading: boolean;
  messages: ChatMessage[];
  models: ModelOption[];
  openRouterConnected: boolean;
  openRouterServerConnected: boolean;
  onAddLink: (url: string) => Promise<boolean> | boolean;
  onCreateNote: (text: string) => Promise<boolean> | boolean;
  onSelectModel: (modelId: string) => void;
  onSend: (message: string) => void;
  onUpload: (file: File, materialType: MaterialType) => Promise<boolean> | boolean;
  readyDocuments: DocumentRecord[];
  selectedModel: string;
  selectedMode: "fast" | "tutor" | "agent";
  onSelectMode: (mode: "fast" | "tutor" | "agent") => void;
  t: Record<string, string>;
  locale: "es" | "en";
}) {
  const preparingCount = activeDocuments.filter(
    (document) => document.processing_status !== "ready" && document.processing_status !== "failed",
  ).length;
  const materialChip =
    activeDocuments.length === 0
      ? t.noReadyDocs
      : preparingCount > 0 && readyDocuments.length === 0
        ? t.waitingForSources
        : readyDocuments.length === 1
          ? t.oneMaterial
          : `${readyDocuments.length} ${t.materialsLower}`;

  return (
    <div className="student-tutor-workspace is-chat-first">
      <section className="student-chat-panel">
        <div className="student-chat-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="student-section-kicker">
              <BrainCircuit size={16} />
              {t.aiTutor}
            </span>
            <h2>{t.tutorConsole}</h2>
            <p className="mb-2">{t.tutorConsoleSubcopy}</p>
            <ChatModeBadge
              hasSources={readyDocuments.length > 0}
              readyCount={readyDocuments.length}
              locale={locale}
              mode={selectedMode}
            />
          </div>
          <div className="student-chat-actions tutor-chat-actions">
            <span className={`status-pill ${readyDocuments.length > 0 ? "is-ready" : "is-muted"}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {materialChip}
            </span>
            <details className="tutor-settings-panel">
              <summary>
                <Settings2 size={16} />
                {t.advancedSettings}
              </summary>
              <div>
                <span>{t.modelAndMode}</span>
                <ChatModeSelector
                  mode={selectedMode}
                  onChange={onSelectMode}
                  t={t}
                />
                <ModelSelector
                  models={models}
                  openRouterConnected={openRouterConnected}
                  openRouterServerConnected={openRouterServerConnected}
                  selectedModel={selectedModel}
                  t={t}
                  onSelect={onSelectModel}
                />
              </div>
            </details>
          </div>
        </div>

        <div className="panel-scroll-shell">
          <div className="student-chat-scroll panel-scroll-area">
            {messages.length === 0 ? (
              <EmptyState
                icon={<BrainCircuit size={30} />}
                title={t.tutorEmptyTitle}
                text={t.tutorEmptyText}
              />
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <ChatMessageComponent key={message.id ?? `${message.role}-${index}`} message={message} t={t} />
                ))}
              </div>
            )}
          </div>
        </div>

        <ChatInputComponent
          disabled={disabled}
          loading={loading}
          placeholder={t.ask}
          buttonLabel={t.send}
          onAddLink={onAddLink}
          onCreateNote={onCreateNote}
          onSend={onSend}
          onUpload={onUpload}
          uploadDisabled={busy === "upload"}
          uploadLoading={busy === "upload"}
        />
      </section>
    </div>
  );
}

function DocumentStudio({
  activeDocuments,
  busy,
  onPractice,
  onTutor,
  onUpload,
  t,
}: {
  activeDocuments: DocumentRecord[];
  busy: string | null;
  onPractice: () => void;
  onTutor: () => void;
  onUpload: (file: File, materialType?: MaterialType) => void;
  t: Record<string, string>;
}) {
  return (
    <section className="materials-workspace">
      <header className="materials-header">
        <div>
          <span className="student-section-kicker"><FolderOpen size={16} /> {t.myMaterials}</span>
          <h2>{t.documentsTitle}</h2>
        </div>
        <UploadControl
          disabled={busy === "upload"}
          loading={busy === "upload"}
          label={t.uploadLibrary}
          onUpload={(file) => onUpload(file, "pdf")}
        />
      </header>

      {activeDocuments.length > 0 ? (
        <div className="materials-grid">
          {activeDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onPractice={onPractice}
              onTutor={onTutor}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="materials-empty">
          <EmptyState icon={<FileText size={28} />} title={t.emptyLibraryTitle} text={t.emptyLibraryText} />
          <UploadControl
            disabled={busy === "upload"}
            highlight
            loading={busy === "upload"}
            label={t.uploadLibrary}
            onUpload={(file) => onUpload(file, "pdf")}
          />
        </div>
      )}
    </section>
  );
}

function ToolStudio({
  activeArtifacts,
  activeSpace,
  busy,
  hasReadySources,
  models,
  openRouterConnected,
  openRouterServerConnected,
  onGenerate,
  onSelectModel,
  onTutor,
  onUpload,
  selectedModel,
  t,
}: {
  activeArtifacts: GeneratedArtifact[];
  activeSpace: StudySpace | null;
  busy: string | null;
  hasReadySources: boolean;
  models: ModelOption[];
  openRouterConnected: boolean;
  openRouterServerConnected: boolean;
  onGenerate: (kind: ToolKind) => void;
  onSelectModel: (modelId: string) => void;
  onTutor: () => void;
  onUpload: (file: File, materialType?: MaterialType) => void;
  selectedModel: string;
  t: Record<string, string>;
}) {
  return (
    <div className="practice-studio-grid h-full min-h-[560px] gap-4">
      <section className="practice-generator-panel">
        <header>
          <span><WandSparkles size={16} /> {t.studyTools}</span>
          <h2>{t.toolsTitle}</h2>
          <p>{hasReadySources ? t.practicePreviewText : t.toolsNeedSources}</p>
        </header>

        <div className="practice-tool-grid">
          {toolKinds.map((kind) => {
            const selectedBusy = busy === kind;
            const disabled = !hasReadySources || !activeSpace || selectedBusy;
            return (
              <article key={kind} className={`practice-tool-card ${disabled ? "is-disabled" : ""}`}>
                <span>{selectedBusy ? <Loader2 className="animate-spin" size={20} /> : toolMeta[kind].icon}</span>
                <div>
                  <strong>{t[kind]}</strong>
                  <p>{t[`${kind}Description`]}</p>
                  {!hasReadySources && <small>{t.practiceToolLocked}</small>}
                </div>
                <button disabled={disabled} onClick={() => onGenerate(kind)} type="button">
                  {selectedBusy ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
                  {t.generate}
                </button>
              </article>
            );
          })}
        </div>

        {!hasReadySources && (
          <div className="practice-empty-actions">
            <UploadControl
              disabled={busy === "upload"}
              highlight
              loading={busy === "upload"}
              label={t.uploadLibrary}
              onUpload={(file) => onUpload(file, "pdf")}
              wide
            />
            <button className="secondary-button h-11 justify-center" onClick={onTutor} type="button">
              <MessageSquareText size={16} />
              {t.openTutor}
            </button>
          </div>
        )}

        <details className="practice-model-control">
          <summary>
            <Sparkles size={15} />
            <span>{t.aiModel}</span>
            <small>{selectedModel}</small>
          </summary>
          <ModelSelector
            models={models}
            openRouterConnected={openRouterConnected}
            openRouterServerConnected={openRouterServerConnected}
            selectedModel={selectedModel}
            t={t}
            onSelect={onSelectModel}
          />
        </details>
      </section>

      <section className="generated-panel mentora-glass-strong min-h-0 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--mentora-text)]">{t.generatedOutput}</h2>
            <p className="mt-1 text-sm text-[var(--mentora-muted)]">{t.generatedOutputText}</p>
          </div>
          <span className="status-pill is-ready">{activeArtifacts.length} {t.items}</span>
        </div>

        <div className="panel-scroll-shell">
          <div className="panel-scroll-area max-h-[520px] space-y-3">
            {activeArtifacts.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} t={t} />
            ))}
            {activeArtifacts.length === 0 && (
              <EmptyState icon={<Sparkles size={28} />} title={t.noArtifactsTitle} text={t.noArtifactsText} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function LearningProfileOnboarding({
  busy,
  draft,
  locale,
  onChange,
  onSave,
  onSignOut,
  setLocale,
  t,
  userEmail,
}: {
  busy: boolean;
  draft: LearningProfileDraft;
  locale: Locale;
  onChange: (draft: LearningProfileDraft) => void;
  onSave: () => void;
  onSignOut: () => void;
  setLocale: (locale: Locale) => void;
  t: Record<string, string>;
  userEmail: string;
}) {
  const options = learningProfileOptions(t);
  const complete = isLearningProfileComplete(draft);
  const selectedCount = learningProfileKeys.filter((key) => draft[key].trim().length > 0).length;
  const progress = Math.round((selectedCount / learningProfileKeys.length) * 100);
  const setupLabels =
    locale === "es"
      ? ["Crear cuenta", "Tu perfil", "Como te gusta aprender", "Configura tu carrera", "Listo"]
      : ["Create account", "Your profile", "How you learn", "Study context", "Done"];
  const optionGroups: Array<{
    key: LearningProfileOptionKey;
    label: string;
    description: string;
    icon: ReactNode;
    options: string[];
    featured?: boolean;
  }> = [
    {
      key: "explanationStyle",
      label: t.explanationStyle,
      description: locale === "es" ? "Elige el formato que mejor te ayuda a entender." : "Choose the format that helps you understand fastest.",
      icon: <BrainCircuit size={18} />,
      options: options.explanationStyle,
      featured: true,
    },
    {
      key: "practiceStyle",
      label: t.practiceStyle,
      description: locale === "es" ? "Define como quieres practicar despues de estudiar." : "Define how you want to practice after studying.",
      icon: <ClipboardList size={18} />,
      options: options.practiceStyle,
      featured: true,
    },
    {
      key: "learningGoal",
      label: t.learningGoal,
      description: locale === "es" ? "Tu meta principal para las proximas sesiones." : "Your main goal for the next sessions.",
      icon: <GraduationCap size={18} />,
      options: options.learningGoal,
    },
    {
      key: "sessionLength",
      label: t.sessionLength,
      description: locale === "es" ? "Ajusta el ritmo a tu energia diaria." : "Match the pace to your daily energy.",
      icon: <Clock3 size={18} />,
      options: options.sessionLength,
    },
    {
      key: "focusSupport",
      label: t.focusSupport,
      description: locale === "es" ? "Dinos que te ayuda a mantener constancia." : "Tell us what keeps you consistent.",
      icon: <Flame size={18} />,
      options: options.focusSupport,
    },
    {
      key: "studyPreference",
      label: t.studyPreference,
      description: locale === "es" ? "Personaliza la forma de repasar cada material." : "Personalize how each material is reviewed.",
      icon: <BookOpen size={18} />,
      options: options.studyPreference,
    },
  ];
  const previewRows = [
    { label: t.explanationStyle, value: draft.explanationStyle ? 92 : 36, tone: "visual" },
    { label: t.practiceStyle, value: draft.practiceStyle ? 84 : 30, tone: "practice" },
    { label: t.learningGoal, value: draft.learningGoal ? 78 : 24, tone: "goal" },
    { label: t.focusSupport, value: draft.focusSupport ? 68 : 18, tone: "focus" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="onboarding-workspace"
    >
      <aside className="onboarding-progress-rail">
        <MentoraLogo />
        <div className="onboarding-progress-copy">
          <strong>{locale === "es" ? "Bienvenida a Mentora" : "Welcome to Mentora"}</strong>
          <p>{locale === "es" ? "Cuentanos sobre ti para personalizar tu experiencia de estudio." : "Tell us about you so Mentora can personalize your study experience."}</p>
        </div>

        <ol className="onboarding-steps-list">
          {setupLabels.map((label, index) => {
            const status = index < 2 ? "is-done" : index === 2 ? "is-active" : "";
            return (
              <li key={label} className={status}>
                <span>{index < 2 ? <CheckCircle2 size={16} /> : index + 1}</span>
                <div>
                  <strong>{label}</strong>
                  <small>{index < 2 ? (locale === "es" ? "Listo" : "Done") : index === 2 ? t.profileTitle : ""}</small>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="onboarding-companion-card">
          <MentoraMascot />
          <strong>{locale === "es" ? "Tu asistente IA te acompana en cada paso" : "Your AI assistant follows each step"}</strong>
          <p>{locale === "es" ? "Te recomendare recursos, quizzes y recordatorios segun tu perfil." : "Mentora will recommend resources, quizzes, and reminders based on your profile."}</p>
        </div>
      </aside>

      <section className="onboarding-question-panel">
        <header className="onboarding-question-hero">
          <div>
            <span className="onboarding-step-badge">
              <Sparkles size={14} />
              {locale === "es" ? "Paso 3 de 5" : "Step 3 of 5"}
            </span>
            <h1>{locale === "es" ? "Como te gusta aprender?" : "How do you like to learn?"}</h1>
            <p>{t.onboardingFormText}</p>
          </div>
          <div className="onboarding-hero-art" aria-hidden="true">
            <MentoraMascot />
            <span className="art-chip art-chip-one">{t.onboardingMiniSummaries}</span>
            <span className="art-chip art-chip-two">{t.onboardingMiniFlashcards}</span>
            <span className="art-chip art-chip-three">{t.onboardingMiniTutor}</span>
          </div>
          <div className="onboarding-header-actions">
            <button
              className="icon-button"
              aria-label={t.switchLanguage}
              onClick={() => setLocale(locale === "es" ? "en" : "es")}
              type="button"
            >
              <Languages size={18} />
              <span className="text-xs font-bold">{locale.toUpperCase()}</span>
            </button>
            <button className="secondary-button h-10 px-3 text-xs" onClick={onSignOut} type="button">
              <LogOut size={16} />
              {t.signOut}
            </button>
          </div>
        </header>

        <div className="onboarding-option-board">
          {optionGroups.map((group) => (
            <ProfileOptionGroup
              key={group.key}
              description={group.description}
              featured={group.featured}
              icon={group.icon}
              label={group.label}
              onSelect={(value) => onChange({ ...draft, [group.key]: value })}
              options={group.options}
              value={draft[group.key]}
            />
          ))}
        </div>

        <div className="onboarding-bottom-bar">
          <div>
            <p>
              <CheckCircle2 size={16} />
              {selectedCount}/6 {locale === "es" ? "respuestas seleccionadas" : "answers selected"}
            </p>
            <small>
              {t.onboardingLoggedInAs} {userEmail}
            </small>
          </div>
          <button className="primary-button onboarding-cta h-12 justify-center" disabled={busy || !complete} onClick={onSave} type="button">
            {busy ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {t.onboardingAction}
          </button>
        </div>
        {!complete && <p className="onboarding-incomplete-note">{t.profileIncomplete}</p>}
      </section>

      <aside className="onboarding-preview-panel">
        <div className="onboarding-preview-card">
          <span>{locale === "es" ? "Asi personalizaremos tu experiencia" : "How Mentora will personalize your experience"}</span>
          <h2>{t.profileTitle}</h2>
          <strong>{progress}%</strong>
          <div className="onboarding-profile-meter" aria-label={`${t.profileTitle} ${progress}%`}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="onboarding-preview-bars">
            {previewRows.map((row) => (
              <div key={row.label} className={`preview-row tone-${row.tone}`}>
                <div>
                  <small>{row.label}</small>
                  <em>{row.value}%</em>
                </div>
                <span><i style={{ width: `${row.value}%` }} /></span>
              </div>
            ))}
          </div>
        </div>

        <div className="onboarding-preview-card">
          <span>{locale === "es" ? "Te recomendaremos" : "Mentora will recommend"}</span>
          <ul className="onboarding-recommendation-list">
            {[
              [t.onboardingMiniSummaries, <FileText key="summary" size={16} />],
              [t.onboardingMiniExam, <ClipboardList key="quiz" size={16} />],
              [t.onboardingMiniFlashcards, <Layers3 key="cards" size={16} />],
              [t.onboardingMiniTutor, <BrainCircuit key="tutor" size={16} />],
            ].map(([label, icon]) => (
              <li key={String(label)}>
                {icon}
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="onboarding-preview-card is-plan">
          <span>{locale === "es" ? "Tu primer plan de estudio" : "Your first study plan"}</span>
          <h3>{draft.learningGoal || t.learningGoal}</h3>
          <p>{complete ? t.onboardingContinueHint : t.profileIncomplete}</p>
        </div>
      </aside>
    </motion.section>
  );
}

function ProfileOptionGroup({
  description,
  featured = false,
  icon,
  label,
  onSelect,
  options,
  value,
}: {
  description: string;
  featured?: boolean;
  icon: ReactNode;
  label: string;
  onSelect: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <section className={`profile-option-group ${featured ? "is-featured" : ""}`}>
      <div className="profile-option-heading">
        <span>{icon}</span>
        <div>
          <h2>{label}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="profile-option-grid">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              aria-pressed={selected}
              className={selected ? "is-selected" : ""}
              onClick={() => onSelect(option)}
              type="button"
            >
              <span>{selected ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}</span>
              <strong>{option}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProfileStudio({
  busy,
  draft,
  locale,
  onChange,
  onError,
  onSaveLearning,
  onSaveProfile,
  profile,
  t,
}: {
  busy: string | null;
  draft: LearningProfileDraft;
  locale: Locale;
  onChange: (draft: LearningProfileDraft) => void;
  onError: (message: string | null) => void;
  onSaveLearning: () => void;
  onSaveProfile: () => void;
  profile: Profile | null;
  t: Record<string, string>;
}) {
  const options = learningProfileOptions(t);
  const learningReady = isLearningProfileComplete(draft);
  const profileReady = draft.birthDate.trim().length > 0 && draft.birthCountryCode.trim().length > 0 && draft.birthCity.trim().length > 0;
  const countryOptions = getBirthCountryOptions(locale);
  const selectedCountry = getBirthCountryOption(draft.birthCountryCode);
  const cityOptions = selectedCountry?.cities ?? [];
  const displayBirthPlace = formatBirthPlace(draft.birthCity, draft.birthCountryCode, locale) || draft.birthPlace || t.notSet;
  const [learningGoalOpen, setLearningGoalOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setAvatarBusy(true);
    try {
      const avatarUrl = await readAvatarFile(file);
      onChange({ ...draft, avatarUrl });
      onError(null);
    } catch (caught) {
      reportClientError("Avatar upload failed", caught);
      onError(t.avatarUploadError);
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="mentora-studio-grid h-full min-h-[560px] gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="profile-hero-card mentora-glass-strong p-5">
        <div className="profile-avatar-stack">
          <div className="profile-avatar-frame" aria-label={t.avatar}>
            {draft.avatarUrl ? (
              <span aria-hidden className="profile-avatar-image" style={{ backgroundImage: `url(${draft.avatarUrl})` }} />
            ) : (
              <UserRound size={30} />
            )}
          </div>
          <input className="sr-only" id="profile-avatar-upload" accept="image/*" type="file" onChange={handleAvatarUpload} />
          <div className="profile-avatar-actions">
            <label className="profile-avatar-upload" htmlFor="profile-avatar-upload">
              {avatarBusy ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
              {draft.avatarUrl ? t.changeAvatar : t.uploadAvatar}
            </label>
            {draft.avatarUrl && (
              <button className="profile-avatar-remove" onClick={() => onChange({ ...draft, avatarUrl: "" })} type="button">
                <X size={14} />
                {t.removeAvatar}
              </button>
            )}
          </div>
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-[var(--mentora-text)]">{profile?.full_name ?? t.student}</h2>
        <p className="mt-2 break-words text-sm text-[var(--mentora-muted)]">{profile?.email}</p>
        <div className="mt-6 grid gap-3">
          <ProfileFact label={t.birthDate} value={draft.birthDate || t.notSet} />
          <ProfileFact label={t.birthPlace} value={displayBirthPlace} />
          <ProfileFact label={t.role} value={profile?.role ?? t.student} />
        </div>
      </section>

      <section className="profile-settings-card mentora-glass-strong p-4 sm:p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[var(--mentora-text)]">{t.profileSettings}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--mentora-muted)]">{t.profileSettingsText}</p>
        </div>

        <div className="profile-settings-stack">
          <section className="profile-section-card">
            <div className="profile-section-heading">
              <span className="profile-section-icon">
                <UserRound size={16} />
              </span>
              <span>
                <h3>{t.personalContext}</h3>
                <p>{t.personalContextText}</p>
              </span>
            </div>
            <div className="profile-personal-fields mt-4">
              <TextField label={t.birthDate} value={draft.birthDate} onChange={(birthDate) => onChange({ ...draft, birthDate })} type="date" />
              <TextField label={t.birthTime} value={draft.birthTime} onChange={(birthTime) => onChange({ ...draft, birthTime })} type="time" />
              <SelectInputField
                label={t.birthCountry}
                options={countryOptions}
                value={draft.birthCountryCode}
                onChange={(birthCountryCode) => onChange(updateBirthLocationDraft(draft, { birthCountryCode, birthCity: "" }, locale))}
                placeholder={t.birthCountryPlaceholder}
              />
              <TextField
                autoComplete="address-level2"
                disabled={!draft.birthCountryCode}
                label={t.birthCity}
                list="birth-city-options"
                value={draft.birthCity}
                onChange={(birthCity) => onChange(updateBirthLocationDraft(draft, { birthCity }, locale))}
                placeholder={draft.birthCountryCode ? t.birthCityPlaceholder : t.birthCityCountryFirst}
                spellCheck={false}
              />
              <datalist id="birth-city-options">
                {cityOptions.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
            <button
              className="profile-save-button"
              disabled={busy === "profile" || !profileReady}
              onClick={onSaveProfile}
              type="button"
            >
              {busy === "profile" ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              <span>{t.saveStudentData}</span>
            </button>
          </section>

          <section className={`profile-section-card profile-learning-accordion ${learningGoalOpen ? "is-open" : ""}`}>
            <button
              aria-expanded={learningGoalOpen}
              className="profile-learning-trigger"
              onClick={() => setLearningGoalOpen((current) => !current)}
              type="button"
            >
              <span className="profile-select-icon">
                <GraduationCap size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <strong>{t.learningGoal}</strong>
                <small>{draft.learningGoal || t.learningGoalPlaceholder}</small>
              </span>
              <ChevronRight size={16} />
            </button>

            <AnimatePresence initial={false}>
              {learningGoalOpen && (
                <motion.div
                  animate={{ height: "auto", opacity: 1 }}
                  className="profile-learning-content"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="profile-learning-inner">
                    <div className="profile-learning-fields">
                      <SelectField
                        icon={<GraduationCap size={15} />}
                        label={t.learningGoal}
                        options={options.learningGoal}
                        value={draft.learningGoal}
                        onChange={(learningGoal) => onChange({ ...draft, learningGoal })}
                        placeholder={t.learningGoalPlaceholder}
                      />
                      <SelectField
                        icon={<Clock3 size={15} />}
                        label={t.sessionLength}
                        options={options.sessionLength}
                        value={draft.sessionLength}
                        onChange={(sessionLength) => onChange({ ...draft, sessionLength })}
                        placeholder={t.sessionLengthPlaceholder}
                      />
                      <SelectField
                        icon={<BookOpen size={15} />}
                        label={t.studyPreference}
                        options={options.studyPreference}
                        value={draft.studyPreference}
                        onChange={(studyPreference) => onChange({ ...draft, studyPreference })}
                        placeholder={t.studyPreferencePlaceholder}
                      />
                      <SelectField
                        icon={<BrainCircuit size={15} />}
                        label={t.explanationStyle}
                        options={options.explanationStyle}
                        value={draft.explanationStyle}
                        onChange={(explanationStyle) => onChange({ ...draft, explanationStyle })}
                        placeholder={t.explanationStylePlaceholder}
                      />
                      <SelectField
                        icon={<Flame size={15} />}
                        label={t.focusSupport}
                        options={options.focusSupport}
                        value={draft.focusSupport}
                        onChange={(focusSupport) => onChange({ ...draft, focusSupport })}
                        placeholder={t.focusSupportPlaceholder}
                      />
                      <SelectField
                        icon={<ClipboardList size={15} />}
                        label={t.practiceStyle}
                        options={options.practiceStyle}
                        value={draft.practiceStyle}
                        onChange={(practiceStyle) => onChange({ ...draft, practiceStyle })}
                        placeholder={t.practiceStylePlaceholder}
                      />
                    </div>

                    <button className="primary-button h-12 justify-center" disabled={busy === "profile" || !learningReady} onClick={onSaveLearning} type="button">
                      {busy === "profile" ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      {t.saveLearningSettings}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </section>
    </div>
  );
}

function TextField({
  autoComplete,
  disabled = false,
  label,
  list,
  value,
  onChange,
  placeholder,
  spellCheck,
  t,
  type = "text",
}: {
  autoComplete?: string;
  disabled?: boolean;
  label: string;
  list?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  spellCheck?: boolean;
  t?: Record<string, string>;
  type?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <label className="mentora-field-label">
      <span className="mb-2 block">{label}</span>
      <span className="relative block">
        <input
          className={`text-input h-12 ${isPassword ? "pr-12" : ""}`}
          autoComplete={autoComplete}
          disabled={disabled}
          list={list}
          spellCheck={spellCheck}
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        {isPassword && (
          <button
            aria-label={showPassword ? t?.hidePassword ?? "Hide password" : t?.showPassword ?? "Show password"}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-[transform,background-color,color] hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
    </label>
  );
}

function SelectInputField({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="mentora-field-label">
      <span className="mb-2 block">{label}</span>
      <span className="relative block">
        <select
          className="text-input h-12 appearance-none bg-white pr-10 leading-normal"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronRight className="profile-select-chevron" size={16} />
      </span>
    </label>
  );
}

function SelectField({
  icon,
  label,
  options,
  suggestions = [],
  value,
  onChange,
  placeholder,
}: {
  icon?: ReactNode;
  label: string;
  options: string[];
  suggestions?: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="profile-select-group">
      <label className="mentora-field-label">
        <span className="mb-2 flex items-center gap-2">
          {icon && <span className="profile-select-icon">{icon}</span>}
          {label}
        </span>
        <span className="relative block">
          <select
            className="text-input h-12 appearance-none bg-white pr-10 leading-normal"
            required
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronRight className="profile-select-chevron" size={16} />
        </span>
      </label>
      {suggestions.length > 0 && (
        <div className="profile-chip-row" aria-label={`${label} suggestions`}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className={`profile-chip ${value === suggestion ? "is-selected" : ""}`}
              onClick={() => onChange(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Feature({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm font-medium text-slate-200">
      <div className="mb-2 text-cyan-200">{icon}</div>
      {text}
    </div>
  );
}

function UploadControl({
  disabled,
  highlight = false,
  loading,
  label,
  onUpload,
  wide = false,
}: {
  disabled: boolean;
  highlight?: boolean;
  loading: boolean;
  label: string;
  onUpload: (file: File) => void;
  wide?: boolean;
}) {
  return (
    <label className={`mentora-upload-button ${wide ? "w-full justify-center" : ""} ${highlight ? "is-priority" : ""}`}>
      {loading ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}
      {label}
      <input
        className="sr-only"
        disabled={disabled}
        type="file"
        accept="application/pdf"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onUpload(file);
          }
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function ModelSelector({
  models,
  onSelect,
  openRouterConnected,
  openRouterServerConnected,
  selectedModel,
  t,
}: {
  models: ModelOption[];
  onSelect: (modelId: string) => void;
  openRouterConnected: boolean;
  openRouterServerConnected: boolean;
  selectedModel: string;
  t: Record<string, string>;
}) {
  const availableModels = models.length > 0 ? models : [{ id: "openrouter/free", name: "OpenRouter Free Router", contextLength: null, isFree: true, pricingLabel: "Free" }];
  const freeModels = availableModels.filter((model) => model.isFree);
  const paidModels = availableModels.filter((model) => !model.isFree);
  const activeModel = availableModels.find((model) => model.id === selectedModel);
  const connectionLabel = activeModel?.isFree
    ? openRouterServerConnected ? t.openRouterMentoraConnected : t.openRouterPublicModels
    : openRouterConnected ? t.openRouterOwnAccount : t.openRouterConnectionRequired;

  return (
    <label className="model-selector">
      <span className="model-selector-heading">
        <span>
          <Sparkles size={14} />
          {t.aiModel}
        </span>
        <small className={openRouterConnected || openRouterServerConnected ? "is-connected" : ""}>
          {connectionLabel}
        </small>
      </span>
      <select aria-label={t.aiModel} value={selectedModel} onChange={(event) => onSelect(event.target.value)}>
        <optgroup label={t.freeModelsGroup}>
          {freeModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} - {t.freeModel}
            </option>
          ))}
        </optgroup>
        {paidModels.length > 0 && (
          <optgroup label={t.paidModelsGroup}>
            {paidModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {t.paidModel}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </label>
  );
}

function OpenRouterConnectDialog({
  busy,
  error,
  locale,
  model,
  onCancel,
  onConnect,
}: {
  busy: boolean;
  error: string | null;
  locale: Locale;
  model: ModelOption;
  onCancel: () => void;
  onConnect: (apiKey: string) => Promise<void>;
}) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const t = copy[locale];

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="openrouter-dialog-backdrop"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      role="presentation"
    >
      <motion.section
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        aria-labelledby="openrouter-dialog-title"
        aria-modal="true"
        className="openrouter-dialog"
        exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        role="dialog"
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      >
        <button aria-label={t.close} className="openrouter-dialog-close" onClick={onCancel} type="button">
          <X size={18} />
        </button>
        <div className="openrouter-dialog-icon"><KeyRound size={24} /></div>
        <span className="openrouter-dialog-kicker">OpenRouter BYOK</span>
        <h2 id="openrouter-dialog-title">{t.paidModelTitle}</h2>
        <p>{t.openRouterDialogText}</p>
        <div className="openrouter-dialog-model">
          <span>{t.selectedPaidModel}</span>
          <strong>{model.name}</strong>
        </div>
        <label className="openrouter-key-field">
          <span>{t.openRouterApiKey}</span>
          <span className="relative block">
            <input
              autoComplete="off"
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-or-v1-..."
              spellCheck={false}
              type={showKey ? "text" : "password"}
              value={apiKey}
            />
            <button
              aria-label={showKey ? t.hidePassword : t.showPassword}
              onClick={() => setShowKey((current) => !current)}
              type="button"
            >
              {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>
        <p className="openrouter-dialog-security"><ShieldCheck size={15} />{t.openRouterKeySecurity}</p>
        {error && <p className="openrouter-dialog-error" role="alert">{error}</p>}
        <div className="openrouter-dialog-actions">
          <button className="secondary-button" disabled={busy} onClick={onCancel} type="button">{t.keepFreeModel}</button>
          <button
            className="primary-button"
            disabled={busy || apiKey.trim().length < 20}
            onClick={() => void onConnect(apiKey.trim())}
            type="button"
          >
            {busy ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
            {t.connectOpenRouter}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

function EmptyState({
  compact = false,
  icon,
  title,
  text,
}: {
  compact?: boolean;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className={`empty-state ${compact ? "is-compact" : ""}`}>
      <div className="mentora-empty-icon">
        {icon}
      </div>
      <p className="mentora-empty-title">{title}</p>
      <p className="mentora-empty-text">{text}</p>
    </div>
  );
}

function Notice({
  children,
  icon,
  onDismiss,
  tone,
}: {
  children: ReactNode;
  icon: ReactNode;
  onDismiss?: () => void;
  tone: "error" | "info";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`notice notice-${tone}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
      {onDismiss && (
        <button className="text-xs font-bold uppercase text-current opacity-75 hover:opacity-100" onClick={onDismiss} type="button">
          OK
        </button>
      )}
    </motion.div>
  );
}

// Legacy chat components removed in favor of modular components in src/components/chat/

function DocumentCard({
  document,
  onPractice,
  onTutor,
  t,
}: {
  document: DocumentRecord;
  onPractice?: () => void;
  onTutor?: () => void;
  t: Record<string, string>;
}) {
  const type = document.material_type ?? "pdf";

  return (
    <article className="document-card">
      <div className="flex items-start justify-between gap-3">
        <span className="document-type-icon">
          {materialTypeIcon(type)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--mentora-text)]">{document.file_name}</p>
          <p className="mt-1 text-xs text-[var(--mentora-muted)]">{formatDate(document.created_at)}</p>
        </div>
        <StatusBadge status={document.processing_status} t={t} />
      </div>
      {document.error_message && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2 text-xs leading-5 text-red-700">
          {document.error_message}
        </p>
      )}
      <div className="document-card-actions">
        <button onClick={onTutor} type="button">
          <MessageSquareText size={15} />
          {t.askTutorCta}
        </button>
        <button disabled={document.processing_status !== "ready"} onClick={onPractice} type="button">
          <WandSparkles size={15} />
          {t.createPractice}
        </button>
      </div>
    </article>
  );
}

function ArtifactCard({ artifact, t }: { artifact: GeneratedArtifact; t: Record<string, string> }) {
  return (
    <article className="artifact-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--mentora-primary)]">{t[artifact.kind] ?? artifact.kind}</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--mentora-text)]">{artifact.title}</h3>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-[var(--mentora-muted)]">{formatDate(artifact.created_at)}</span>
      </div>
      <ArtifactBody artifact={artifact} t={t} />
    </article>
  );
}

function ArtifactBody({ artifact, t }: { artifact: GeneratedArtifact; t: Record<string, string> }) {
  if (artifact.kind === "flashcards") {
    const cards = parseFlashcards(artifact.content);
    if (cards.length > 0) {
      return <FlashcardDeck cards={cards} t={t} />;
    }
  }

  return (
    <div className="artifact-rich-body">
      <MarkdownMessage content={artifact.content} />
    </div>
  );
}

function FlashcardDeck({
  cards,
  t,
}: {
  cards: Array<{ front: string; back: string; hint?: string; source?: string }>;
  t: Record<string, string>;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  return (
    <div className="flashcard-deck">
      <div className="flashcard-deck-toolbar">
        <span className="flashcard-deck-badge">
          {t.flashcards} {index + 1}/{cards.length}
        </span>
        <div className="flashcard-deck-actions">
          <button
            className="secondary-button h-10 px-3 text-xs"
            disabled={index === 0}
            onClick={() => {
              setIndex((current) => Math.max(0, current - 1));
              setFlipped(false);
            }}
            type="button"
          >
            {t.previous}
          </button>
          <button
            className="secondary-button h-10 px-3 text-xs"
            disabled={index === cards.length - 1}
            onClick={() => {
              setIndex((current) => Math.min(cards.length - 1, current + 1));
              setFlipped(false);
            }}
            type="button"
          >
            {t.next}
          </button>
        </div>
      </div>

      <button
        aria-label={`${t.flashcards} ${index + 1}: ${flipped ? t.flashcardBack : t.flashcardFront}`}
        aria-pressed={flipped}
        className="flashcard-stage"
        onClick={() => setFlipped((current) => !current)}
        type="button"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${index}-${flipped ? "back" : "front"}`}
            animate={{ opacity: 1, rotateY: 0, scale: 1, filter: "blur(0px)" }}
            className={`flashcard-face ${flipped ? "is-back" : "is-front"}`}
            exit={{ opacity: 0, rotateY: flipped ? -90 : 90, scale: 0.98, filter: "blur(4px)" }}
            initial={{ opacity: 0, rotateY: flipped ? 90 : -90, scale: 0.98, filter: "blur(4px)" }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            <span className="flashcard-label">{flipped ? t.flashcardBack : t.flashcardFront}</span>
            <h4>{flipped ? card.back : card.front}</h4>
            <p>{flipped ? card.hint || card.source || "" : card.hint || t.flashcardHint}</p>
            {card.source && <small>{card.source}</small>}
          </motion.div>
        </AnimatePresence>
      </button>
    </div>
  );
}

function StatusBadge({ status, t }: { status: DocumentRecord["processing_status"]; t: Record<string, string> }) {
  return (
    <span className={`status-badge status-${status}`}>
      <StatusDot status={status} />
      {studentStatusLabel(status, t)}
    </span>
  );
}

function studentStatusLabel(status: DocumentRecord["processing_status"], t: Record<string, string>) {
  if (status === "ready") {
    return t.ready;
  }
  if (status === "failed") {
    return t.failed;
  }
  return t.processing;
}

function materialTypeIcon(type: DocumentRecord["material_type"]) {
  switch (type) {
    case "image":
      return <FileSearch size={16} />;
    case "document":
      return <PaperDocumentIcon />;
    case "link":
      return <Globe2 size={16} />;
    case "text":
      return <ClipboardList size={16} />;
    case "pdf":
    default:
      return <FileText size={16} />;
  }
}

function PaperDocumentIcon() {
  return <FileText size={16} />;
}

function StatusDot({ status }: { status: DocumentRecord["processing_status"] }) {
  const isReady = status === "ready";
  const isFailed = status === "failed";
  const isPending = status === "pending";
  const isProcessing = !isReady && !isFailed && !isPending;

  const color = isReady
    ? "bg-emerald-300"
    : isFailed
    ? "bg-red-300"
    : isPending
    ? "bg-slate-400"
    : "bg-amber-300";

  return <span className={`h-2 w-2 shrink-0 rounded-full ${color} ${isProcessing ? "animate-pulse" : ""}`} />;
}

function ProfileFact({
  compact = false,
  label,
  value,
}: {
  compact?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className={`profile-fact-card ${compact ? "is-compact" : ""}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}
