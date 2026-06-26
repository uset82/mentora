"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  PanelRightOpen,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { copy } from "@/lib/i18n";
import { parseFlashcards } from "@/lib/study-content";
import type { DocumentRecord, GeneratedArtifact, LearningProfile, Locale, Profile, StudySpace, ToolKind } from "@/lib/types";
import { ChatMessage as ChatMessageComponent } from "./chat/chat-message";
import { ChatInput as ChatInputComponent } from "./chat/chat-input";
import { ChatModeBadge } from "./chat/chat-mode-badge";
import { MarkdownMessage } from "./chat/markdown-message";

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
type PersonalProfileKey = "birthDate" | "birthPlace" | "birthCountryCode" | "birthCity" | "birthTime";
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

const toolKinds: ToolKind[] = ["quiz", "flashcards", "apa_summary"];
const CHAT_TIMEOUT_MS = 75_000;

const toolMeta: Record<ToolKind, { icon: ReactNode; tone: string }> = {
  quiz: { icon: <ClipboardList size={18} />, tone: "from-cyan-300/20 to-blue-400/10 text-cyan-100" },
  flashcards: { icon: <Layers3 size={18} />, tone: "from-amber-300/20 to-orange-400/10 text-amber-100" },
  apa_summary: { icon: <FileText size={18} />, tone: "from-violet-300/20 to-fuchsia-400/10 text-violet-100" },
};

const viewIcons: Record<AppView, ReactNode> = {
  home: <BookOpen size={18} />,
  tutor: <MessageSquareText size={18} />,
  documents: <FolderOpen size={18} />,
  tools: <WandSparkles size={18} />,
  profile: <UserRound size={18} />,
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
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[Mentora] ${context}: ${message}`);
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

async function autoSignInDev(client: SupabaseClient) {
  const isDev = process.env.NODE_ENV !== "production";
  const enabled = process.env.NEXT_PUBLIC_MENTORA_DEV_AUTOLOGIN === "true";
  if (!isDev || !enabled) {
    return;
  }
  const email = process.env.NEXT_PUBLIC_MENTORA_DEV_EMAIL;
  const password = process.env.NEXT_PUBLIC_MENTORA_DEV_PASSWORD;
  if (!email || !password) {
    return;
  }
  try {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      reportClientError("Dev auto sign-in failed", error);
    }
  } catch (caught) {
    reportClientError("Dev auto sign-in failed", caught);
  }
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
  });
  const [spaces, setSpaces] = useState<StudySpace[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>("home");
  const [busy, setBusy] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
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

  const loadWorkspace = useCallback(async (client = supabase) => {
    if (!client) {
      return;
    }

    setWorkspaceLoading(true);
    let workspaceResult: unknown[];

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
          .from("document_processing_jobs")
          .select("document_id, status, current_step, error_message")
          .in("status", ["pending", "processing"]),
      ]);
    } catch (caught) {
      reportClientError("Workspace network request failed", caught);
      setWorkspaceLoading(false);
      setError(t.authNetworkError);
      // A stale/invalid session often surfaces here. Force a clean re-auth.
      try {
        await client.auth.signOut();
      } catch {
        // ignore
      }
      setSession(null);
      void autoSignInDev(client);
      return;
    }

    const [
      { data: profileRow, error: profileError },
      { data: spaceRows, error: spaceError },
      { data: documentRows },
      { data: artifactRows },
      { data: jobRows },
    ] = workspaceResult as [
      { data: unknown; error: unknown },
      { data: unknown; error: unknown },
      { data: unknown; error: unknown },
      { data: unknown; error: unknown },
      { data: unknown; error: unknown },
    ];

    setWorkspaceLoading(false);

    if (profileError) {
      reportClientError("Profile load failed", profileError);
      setError(t.workspaceLoadError);
      return;
    }

    if (spaceError) {
      reportClientError("Study space load failed", spaceError);
      setError(t.workspaceLoadError);
      return;
    }

    const loadedProfile = profileRow as Profile;
    const learningProfile = loadedProfile.learning_profile ?? {};
    const birthLocation = parseBirthLocation(learningProfile);
    const loadedSpaces = (spaceRows ?? []) as StudySpace[];
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
    });
    setSpaces(loadedSpaces);

    const rawDocs = (documentRows ?? []) as DocumentRecord[];
    const jobs = (Array.isArray(jobRows) ? jobRows : []) as {
      document_id: string;
      status: string;
      current_step: string;
      error_message: string | null;
    }[];

    const documentsWithJobs = rawDocs.map((doc) => {
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
          if (error) {
            void supabase.auth.signOut();
          }
          setSession(null);
          await autoSignInDev(supabase);
          return;
        }
        // Validate the cached session against the server. A stale refresh
        // token passes getSession() but fails here, so we clear and re-sign-in.
        const { error: userError } = await supabase.auth.getUser();
        if (cancelled) {
          return;
        }
        if (userError) {
          reportClientError("Session validation failed", userError);
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
          setSession(null);
          await autoSignInDev(supabase);
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
        await autoSignInDev(supabase);
      });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        if (event === "SIGNED_OUT") {
          setSession(null);
          void autoSignInDev(supabase);
          return;
        }
      }
      setSession(nextSession);
      if (!nextSession) {
        void autoSignInDev(supabase);
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
  const activeDocuments = useMemo(
    () => documents.filter((document) => !activeSpace || document.study_space_id === activeSpace.id),
    [activeSpace, documents],
  );

  const readyDocuments = activeDocuments.filter((document) => document.processing_status === "ready");
  const failedDocuments = activeDocuments.filter((document) => document.processing_status === "failed");
  const processingDocuments = activeDocuments.filter(
    (document) => document.processing_status !== "ready" && document.processing_status !== "failed"
  );
  const readiness = activeDocuments.length > 0 ? Math.round((readyDocuments.length / activeDocuments.length) * 100) : 0;
  const hasReadySources = readyDocuments.length > 0;

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
            onSignOut={() => supabase.auth.signOut()}
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

      <div className={`liquid-app-grid ${activeView === "home" ? "has-insights" : "is-focus"}`}>
        <NavigationRail
          activeSpace={activeSpace}
          activeView={activeView}
          busy={busy}
          documents={activeDocuments}
          onCreate={(name) => createStudySpace(name)}
          onSelectSpace={setActiveSpaceId}
          onSelectView={setActiveView}
          onSignOut={() => supabase.auth.signOut()}
          profile={profile}
          spaces={spaces}
          t={t}
        />

        <section className="liquid-main-scroll">
          {activeView !== "profile" && (
            <header className="liquid-command-bar" aria-label="Workspace command bar">
              <div className="liquid-command-context">
                <span>{activeSpace?.name ?? t.dashboard}</span>
                <strong>{activeView === "home" ? t.dashboard : t[`${activeView}Title`]}</strong>
              </div>
              <div className="liquid-command-actions">
                <LiquidButton className="liquid-start-button" onClick={() => setActiveView("tutor")}>
                  <Sparkles size={17} />
                  <span>{t.startStudy}</span>
                </LiquidButton>
                <button className="liquid-icon-button" aria-label={t.switchLanguage} onClick={() => setLocale(locale === "es" ? "en" : "es")} type="button">
                  <Globe2 size={18} />
                  <span>{locale.toUpperCase()}</span>
                </button>
                <button className="liquid-icon-button" aria-label="Help" type="button">
                  <HelpCircle size={18} />
                </button>
                <button className="liquid-icon-button" onClick={() => supabase.auth.signOut()} type="button">
                  <LogOut size={18} />
                  <span className="liquid-signout-label">{t.signOut}</span>
                </button>
              </div>
            </header>
          )}

          <section className="liquid-content-panel">
            {activeView !== "profile" && (
              <WorkspaceHeader
                activeSpace={activeSpace}
                activeView={activeView}
                artifacts={activeArtifacts}
                documents={activeDocuments}
                failedDocuments={failedDocuments}
                loading={workspaceLoading}
                models={models}
                openRouterConnected={openRouterConnected}
                openRouterServerConnected={openRouterServerConnected}
                onSelectModel={handleModelSelect}
                onUpload={uploadDocument}
                processingDocuments={processingDocuments}
                readyDocuments={readyDocuments}
                readiness={readiness}
                selectedModel={selectedModel}
                uploadBusy={busy === "upload"}
                t={t}
              />
            )}

            <div className="min-h-0 flex-1 overflow-visible px-3 pb-5 sm:px-5 sm:pb-6">
              <AnimatePresence mode="wait">
                {activeView === "home" && (
                  <MotionView key="home">
                    <RealStudentDashboard
                      activeDocuments={activeDocuments}
                      activeSpace={activeSpace}
                      artifacts={activeArtifacts}
                      busy={busy}
                      onAsk={() => setActiveView("tutor")}
                      onSelectView={setActiveView}
                      onUpload={uploadDocument}
                      profile={profile}
                      readyDocuments={readyDocuments}
                      t={t}
                    />
                  </MotionView>
                )}

                {activeView === "tutor" && (
                  <MotionView key="tutor">
                    <TutorStudio
                      busy={busy}
                      disabled={busy === "chat"}
                      loading={busy === "chat"}
                      messages={messages}
                      models={models}
                      openRouterConnected={openRouterConnected}
                      openRouterServerConnected={openRouterServerConnected}
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
                      onGenerate={(kind) => activeSpace && generateTool(activeSpace.id, kind)}
                      selectedModel={selectedModel}
                      t={t}
                    />
                  </MotionView>
                )}

                {activeView === "profile" && (
                  <MotionView key="profile">
                    <ProfileStudio
                      busy={busy}
                      draft={profileDraft}
                      locale={locale}
                      onChange={setProfileDraft}
                      onSave={saveProfile}
                      profile={profile}
                      t={t}
                    />
                  </MotionView>
                )}
              </AnimatePresence>
            </div>
          </section>
        </section>

        {activeView === "home" && (
          <aside className="liquid-right-rail">
            <InsightPanel
              artifacts={activeArtifacts}
              documents={activeDocuments}
              loading={workspaceLoading}
              profile={profile}
              readyDocuments={readyDocuments}
              t={t}
            />
          </aside>
        )}
      </div>
    </main>
  );

  async function saveProfile() {
    if (!supabase || !session) {
      return;
    }

    if (!isLearningProfileComplete(profileDraft)) {
      setError(t.profileIncomplete);
      return;
    }

    if (activeView === "profile" && (!profileDraft.birthDate.trim() || !profileDraft.birthCountryCode.trim() || !profileDraft.birthCity.trim())) {
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
          onboardingComplete: true,
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

  async function sendTutorMessage(message: string) {
    const studySpaceId = activeSpace?.id ?? (await createStudySpace(t.personalWorkspace));
    if (!studySpaceId) {
      return;
    }

    await askTutor(studySpaceId, message);
  }

  async function uploadDocument(file: File) {
    const studySpaceId = activeSpace?.id ?? (await createStudySpace(t.personalWorkspace));

    if (!studySpaceId) {
      return;
    }

    await uploadPdf(studySpaceId, file);
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

  async function uploadPdf(studySpaceId: string, file: File) {
    if (!supabase) {
      return;
    }

    setBusy("upload");
    setError(null);
    setUploadNotice(`${t.processingFile} ${file.name}`);
    const token = await getAccessToken(supabase);
    if (!token) {
      setBusy(null);
      setUploadNotice(null);
      setError(t.authError);
      return;
    }

    const formData = new FormData();
    formData.append("studySpaceId", studySpaceId);
    formData.append("file", file);

    let response: Response;
    try {
      response = await fetch("/api/ingest", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch (caught) {
      reportClientError("Document upload request failed", caught);
      setBusy(null);
      setUploadNotice(null);
      setError(t.authNetworkError);
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    setUploadNotice(null);
    if (!response.ok) {
      setError(payload.error ?? "Upload failed.");
      return;
    }

    setUploadNotice(`${file.name} ${t.uploadReadyNotice}`);
    await loadWorkspace();
    setActiveView("tutor");
    window.setTimeout(() => setUploadNotice(null), 6000);
  }

  async function askTutor(studySpaceId: string, message: string) {
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

  async function generateTool(studySpaceId: string, kind: ToolKind) {
    if (!supabase) {
      return;
    }

    setBusy(kind);
    setError(null);
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
      }),
    });
    const payload = await response.json();
    setBusy(null);

    if (!response.ok) {
      setError(payload.error ?? "Generation failed.");
      return;
    }

    setArtifacts((current) => [payload.artifact, ...current]);
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
            {["Inicio", "Chat Tutor IA", "Mis materiales", "Resúmenes", "Flashcards", "Quizzes"].map((item, index) => (
              <span key={item} className={index === 1 ? "is-active" : ""}>{item}</span>
            ))}
          </aside>
          <main>
            <h3>¡Hola, María! 👋</h3>
            <p>{t.landingLaptopSubtitle}</p>
            <div className="hero-search-bar">{t.landingAskPlaceholder}<ChevronRight size={16} /></div>
            <div className="hero-mini-stats">
              <span><strong>24</strong>{t.flashcards}</span>
              <span><strong>76%</strong>{t.readiness}</span>
              <span><strong>5</strong>{t.quiz}</span>
            </div>
            <div className="hero-material-list">
              {["Fisiología Humana.pdf", "Apuntes Clase 8.docx", "Presentación.pptx", "Video - Teorías.mp4"].map((item) => (
                <span key={item}>{item}<small>{t.ready}</small></span>
              ))}
            </div>
          </main>
        </div>
      </div>
      <div className="floating-upload-card">
        <Upload size={28} />
        <strong>{t.landingUploadMini}</strong>
        <small>PDF, PPTX, DOCX, MP4, enlaces...</small>
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

function LiquidButton({
  children,
  className = "",
  disabled,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      className={`liquid-button ${className}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
      whileHover={disabled || prefersReducedMotion ? undefined : { y: -1, scale: 1.01 }}
      whileTap={disabled || prefersReducedMotion ? undefined : { y: 1, scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
    >
      <span className="liquid-button-shine" aria-hidden="true" />
      <span className="liquid-button-content">{children}</span>
    </motion.button>
  );
}

function NavigationRail({
  activeSpace,
  activeView,
  busy,
  documents,
  onCreate,
  onSelectSpace,
  onSelectView,
  onSignOut,
  profile,
  spaces,
  t,
}: {
  activeSpace: StudySpace | null;
  activeView: AppView;
  busy: string | null;
  documents: DocumentRecord[];
  onCreate: (name: string) => Promise<string | null>;
  onSelectSpace: (id: string) => void;
  onSelectView: (view: AppView) => void;
  onSignOut: () => void;
  profile: Profile | null;
  spaces: StudySpace[];
  t: Record<string, string>;
}) {
  const navItems: Array<{ id: Exclude<AppView, "profile">; label: string; detail: string }> = [
    { id: "home", label: t.home, detail: t.homeNav },
    { id: "documents", label: t.myMaterials, detail: `${documents.length} ${t.sources}` },
    { id: "tutor", label: t.aiTutor, detail: t.tutorNav },
    { id: "tools", label: t.studyTools, detail: t.toolsNav },
  ];
  const initials = (profile?.full_name ?? profile?.email ?? "M").slice(0, 2).toUpperCase();
  const isProfileActive = activeView === "profile";

  return (
    <aside className="liquid-nav" aria-label="Student navigation">
      <div className="liquid-nav-inner">
        <div className="liquid-nav-logo">
          <MentoraLogo onClick={() => onSignOut()} />
        </div>

        <button
          aria-current={isProfileActive ? "page" : undefined}
          className={`liquid-profile-chip ${isProfileActive ? "is-active" : ""}`}
          onClick={() => onSelectView("profile")}
          title={`${t.settings} - ${profile?.full_name ?? profile?.email ?? t.student}`}
          type="button"
        >
          <span className="liquid-avatar">{initials}</span>
          <span className="liquid-profile-copy">
            <strong>{profile?.full_name ?? profile?.email ?? t.student}</strong>
            <small>{t.student}</small>
          </span>
          <ChevronRight size={15} />
        </button>

        <nav className="liquid-nav-tabs" aria-label="Workspace sections">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                aria-current={isActive ? "page" : undefined}
                className={`liquid-tab ${isActive ? "is-active" : ""}`}
                onClick={() => onSelectView(item.id)}
                title={`${item.label} - ${item.detail}`}
                type="button"
              >
                <span className="liquid-tab-icon">{viewIcons[item.id]}</span>
                <span className="liquid-tab-copy">
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <section className="liquid-space-card" aria-label={t.currentSpace}>
          <div>
            <span>{t.currentSpace}</span>
            <strong>{activeSpace?.name ?? t.noSpaceTitle}</strong>
            <small>{activeSpace?.description ?? t.noSpaceDescription}</small>
          </div>
          <CreateSpaceButton busy={busy === "space"} label={t.newSpace} onCreate={onCreate} t={t} />
        </section>

        <div className="liquid-space-list" aria-label={t.spaces}>
          {spaces.slice(0, 4).map((space) => (
            <button
              key={space.id}
              className={`liquid-space-option ${activeSpace?.id === space.id ? "is-active" : ""}`}
              onClick={() => onSelectSpace(space.id)}
              type="button"
            >
              <BookOpen size={16} />
              <span>{space.name}</span>
            </button>
          ))}
          {spaces.length === 0 && <p>{t.noSpaceDescription}</p>}
        </div>

        <div className="liquid-nav-footer">
          <button className="liquid-signout" onClick={onSignOut} type="button">
            <LogOut size={16} />
            <span>{t.signOut}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function WorkspaceHeader({
  activeSpace,
  activeView,
  artifacts,
  documents,
  failedDocuments,
  loading,
  models,
  openRouterConnected,
  openRouterServerConnected,
  onSelectModel,
  onUpload,
  processingDocuments,
  readyDocuments,
  readiness,
  selectedModel,
  uploadBusy,
  t,
}: {
  activeSpace: StudySpace | null;
  activeView: AppView;
  artifacts: GeneratedArtifact[];
  documents: DocumentRecord[];
  failedDocuments: DocumentRecord[];
  loading: boolean;
  models: ModelOption[];
  openRouterConnected: boolean;
  openRouterServerConnected: boolean;
  onSelectModel: (modelId: string) => void;
  onUpload: (file: File) => void;
  processingDocuments: DocumentRecord[];
  readyDocuments: DocumentRecord[];
  readiness: number;
  selectedModel: string;
  uploadBusy: boolean;
  t: Record<string, string>;
}) {
  const viewTitle = activeView === "home" ? t.dashboard : t[`${activeView}Title`];

  if (activeView === "home") {
    return null;
  }

  return (
    <div className="liquid-workspace-header">
      <div className="liquid-workspace-title">
        <span>
          {viewIcons[activeView]}
          {activeSpace?.name ?? t.dashboard}
        </span>
        <h1>{viewTitle}</h1>
      </div>

      <div className="liquid-workspace-tools">
        <ModelSelector
          models={models}
          openRouterConnected={openRouterConnected}
          openRouterServerConnected={openRouterServerConnected}
          selectedModel={selectedModel}
          t={t}
          onSelect={onSelectModel}
        />
        <UploadControl disabled={uploadBusy} loading={uploadBusy} label={t.uploadPdf} onUpload={onUpload} />
        {loading && (
          <span className="liquid-status-chip">
            <Loader2 className="animate-spin" size={16} />
            {t.syncing}
          </span>
        )}
      </div>

      <section className="liquid-metric-strip" aria-label={t.learningPulse}>
        <Metric icon={<FileText size={17} />} label={t.documents} value={documents.length.toString()} />
        <Metric icon={<CheckCircle2 size={17} />} label={t.ready} value={readyDocuments.length.toString()} tone="success" />
        <Metric icon={<Clock3 size={17} />} label={t.processing} value={processingDocuments.length.toString()} tone="warning" />
        <Metric icon={<Sparkles size={17} />} label={t.generated} value={artifacts.length.toString()} tone={failedDocuments.length > 0 ? "danger" : "accent"} />
        <div className="liquid-readiness-mini" aria-label={`${t.readiness} ${readiness}%`}>
          <span>{readiness > 0 ? t.readyToStudy : t.buildingIndex}</span>
          <div><i style={{ width: `${readiness}%` }} /></div>
          <strong>{readiness}%</strong>
        </div>
      </section>
    </div>
  );
}

function RealStudentDashboard({
  activeDocuments,
  activeSpace,
  artifacts,
  busy,
  onAsk,
  onSelectView,
  onUpload,
  profile,
  readyDocuments,
  t,
}: {
  activeDocuments: DocumentRecord[];
  activeSpace: StudySpace | null;
  artifacts: GeneratedArtifact[];
  busy: string | null;
  onAsk: () => void;
  onSelectView: (view: AppView) => void;
  onUpload: (file: File) => void;
  profile: Profile | null;
  readyDocuments: DocumentRecord[];
  t: Record<string, string>;
}) {
  const firstName = (profile?.full_name ?? t.student).split(" ")[0] || t.student;
  const materials = activeDocuments.slice(0, 4);
  const processingDocuments = activeDocuments.filter((document) =>
    ["pending", "processing"].includes(document.processing_status),
  );
  const failedDocuments = activeDocuments.filter((document) => document.processing_status === "failed");
  const readiness = activeDocuments.length > 0 ? Math.round((readyDocuments.length / activeDocuments.length) * 100) : 0;
  const nextAction = readyDocuments.length > 0 ? t.askFirstQuestion : t.uploadLibrary;
  const nextActionDetail = readyDocuments.length > 0 ? t.readyToStudy : t.emptyLibraryText;
  const readinessLabel = readiness >= 80 ? t.readyToStudy : readiness > 0 ? t.buildingIndex : t.emptyLibraryTitle;
  const cockpitStats = [
    { label: t.ready, value: readyDocuments.length.toString() },
    { label: t.processing, value: processingDocuments.length.toString() },
    { label: t.generated, value: artifacts.length.toString() },
  ];
  const studyPlan = [
    {
      id: "upload",
      title: activeDocuments.length === 0 ? t.uploadLibrary : t.recentMaterials,
      detail: activeDocuments.length === 0 ? t.emptyLibraryText : `${activeDocuments.length} ${t.documents}`,
      icon: <Upload size={17} />,
      view: "documents" as const,
    },
    {
      id: "review",
      title: t.askFirstQuestion,
      detail: readyDocuments.length > 0 ? `${readyDocuments.length} ${t.sourcesReady}` : t.askFirstQuestionText,
      icon: <MessageSquareText size={17} />,
      view: "tutor" as const,
    },
    {
      id: "tools",
      title: artifacts.length > 0 ? t.generatedOutput : t.quickTools,
      detail: artifacts.length > 0 ? `${artifacts.length} ${t.items}` : t.toolsNeedSources,
      icon: <Sparkles size={17} />,
      view: "tools" as const,
    },
  ];
  const recommendedSessions =
    readyDocuments.length > 0
      ? [
          { title: t.createSummary, detail: `${readyDocuments.length} ${t.sourcesReady}`, tone: "mint", view: "tools" as const },
          { title: t.createFlashcards, detail: t.practiceFlashcards, tone: "violet", view: "tools" as const },
          { title: t.generateQuiz, detail: t.practiceExamQuestions, tone: "blue", view: "tools" as const },
        ]
      : [
          { title: t.uploadLibrary, detail: t.emptyLibraryText, tone: "coral", view: "documents" as const },
        ];
  const recommendations = [
    readyDocuments.length > 0 ? t.readyToStudy : t.buildingIndex,
    activeDocuments.length === 0 ? t.emptyLibraryText : `${activeDocuments.length} ${t.documents}`,
    processingDocuments.length > 0 ? `${processingDocuments.length} ${t.processing}` : null,
    failedDocuments.length > 0 ? `${failedDocuments.length} ${t.failed}` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="liquid-dashboard cockpit-dashboard">
      <section className="liquid-hero-card cockpit-hero-card">
        <div className="cockpit-hero-orb" aria-hidden="true" />
        <div className="liquid-hero-copy cockpit-hero-copy">
          <span className="liquid-kicker"><BrainCircuit size={16} /> {t.studyPulse}</span>
          <h2>{t.dashboard}, {firstName}</h2>
          <p>{readyDocuments.length > 0 ? t.askFirstQuestionText : t.dashboardWelcome}</p>
          <div className="cockpit-signal-strip" aria-label={t.learningPulse}>
            {cockpitStats.map((stat) => (
              <span key={stat.label}>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </span>
            ))}
          </div>
          <div className="liquid-hero-actions cockpit-hero-actions">
            <LiquidButton className="liquid-primary-action cockpit-primary-action" onClick={onAsk}>
              <MessageSquareText size={19} />
              <span>{t.startStudy}</span>
              <ChevronRight size={18} />
            </LiquidButton>
            <UploadControl disabled={busy === "upload"} loading={busy === "upload"} label={t.uploadPdf} onUpload={onUpload} />
            <button className="liquid-secondary-chip" onClick={() => onSelectView("tools")} type="button">{t.quickTools}</button>
          </div>
        </div>
        <aside className="liquid-next-panel cockpit-next-panel" aria-label={t.recommendedSessions}>
          <div className="cockpit-next-marker" aria-hidden="true" />
          <span>{t.recommendedSessions}</span>
          <strong>{nextAction}</strong>
          <p>{nextActionDetail}</p>
          <div className="cockpit-next-footer">
            <div
              className="liquid-readiness-ring"
              aria-label={`${t.readiness} ${readiness}%`}
              style={{ "--readiness": `${readiness}%` } as React.CSSProperties}
            >
              <b>{readiness}%</b>
            </div>
            <button onClick={() => onSelectView(readyDocuments.length > 0 ? "tutor" : "documents")} type="button">
              {readyDocuments.length > 0 ? t.askFirstQuestion : t.uploadLibrary}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </aside>
      </section>

      <section className="cockpit-topology" aria-label={t.learningPulse}>
        <article className="liquid-card cockpit-course-card">
          <header>
            <span><BookOpen size={17} /> {t.myCourses}</span>
            <button onClick={() => onSelectView("documents")} type="button">{t.viewAll}</button>
          </header>
          <div className="cockpit-course-main">
            <div>
              <small>{t.currentSpace}</small>
              <strong>{activeSpace?.name ?? t.noSpaceTitle}</strong>
              <p>{activeSpace?.description ?? t.personalWorkspace}</p>
            </div>
            <em>{readyDocuments.length}/{Math.max(activeDocuments.length, 1)}</em>
          </div>
          <div className="liquid-progress-track"><i style={{ width: `${readiness}%` }} /></div>
          <div className="liquid-course-meta cockpit-metric-row">
            <span>{activeDocuments.length} {t.documents}</span>
            <span>{artifacts.length} {t.generated}</span>
            <span>{processingDocuments.length} {t.processing}</span>
          </div>
        </article>

        <article className="liquid-card cockpit-pulse-card">
          <span>{t.readiness}</span>
          <strong>{readiness}%</strong>
          <p>{readinessLabel}</p>
          <div className="liquid-progress-track"><i style={{ width: `${readiness}%` }} /></div>
        </article>
      </section>

      <section className="liquid-dashboard-grid cockpit-grid">
        <article className="liquid-card cockpit-materials-card">
          <header>
            <span><FileText size={17} /> {t.recentMaterials}</span>
            <button onClick={() => onSelectView("documents")} type="button">{t.viewAll}</button>
          </header>
          <div className="liquid-list cockpit-material-list">
            {materials.map((document, index) => (
              <button key={document.id} onClick={() => onSelectView("documents")} type="button">
                <span className={`material-thumb material-thumb-${index % 4}`} />
                <span>{document.file_name}</span>
                <small>{document.processing_status === "ready" ? t.ready : t.processing}</small>
              </button>
            ))}
            {materials.length === 0 && (
              <EmptyState compact icon={<FileText size={18} />} title={t.emptyLibraryTitle} text={t.emptyLibraryText} />
            )}
          </div>
        </article>

        <article className="liquid-card cockpit-plan-card">
          <header>
            <span><Clock3 size={17} /> {t.upcomingExams}</span>
            <button onClick={() => onSelectView("tools")} type="button">{t.viewAll}</button>
          </header>
          <div className="liquid-plan-list cockpit-plan-list">
            {studyPlan.map((item, index) => (
              <button key={item.id} onClick={() => onSelectView(item.view)} type="button">
                <span>{index + 1}</span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                {item.icon}
              </button>
            ))}
          </div>
        </article>

        <article className="liquid-card liquid-card-tutor cockpit-tutor-card">
          <header>
            <span><Sparkles size={17} /> {t.tutorRecommendations}</span>
            <button onClick={() => onSelectView("tutor")} type="button">{t.viewMoreRecommendations}</button>
          </header>
          <div className="liquid-tutor-body">
            <MentoraMascot />
            <ul>
              {recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </div>
          <button className="cockpit-tutor-action" onClick={() => onSelectView("tutor")} type="button">
            {t.startStudy}
            <ChevronRight size={16} />
          </button>
        </article>

        <article className="liquid-card cockpit-tools-card">
          <header>
            <span><WandSparkles size={17} /> {t.quickTools}</span>
          </header>
          <div className="liquid-tools-grid cockpit-tools-grid">
            {[
              [t.createSummary, <FileText key="summary" size={20} />, "tools"],
              [t.createFlashcards, <Layers3 key="cards" size={20} />, "tools"],
              [t.generateQuiz, <ClipboardList key="quiz" size={20} />, "tools"],
              [t.uploadLibrary, <Upload key="upload" size={20} />, "documents"],
            ].map(([label, icon, view]) => (
              <button key={String(label)} onClick={() => onSelectView(view as AppView)} type="button">
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="liquid-card liquid-card-sessions cockpit-sessions-card">
          <header>
            <span><PlayCircle size={17} /> {t.recommendedSessions}</span>
            <button onClick={() => onSelectView("tools")} type="button">{t.viewAll}</button>
          </header>
          <div className="liquid-session-list cockpit-session-list">
            {recommendedSessions.map((session) => (
              <button key={session.title} className={`tone-${session.tone}`} onClick={() => onSelectView(session.view)} type="button">
                <Sparkles size={17} />
                <span>{session.title}</span>
                <small>{session.detail}</small>
                <PlayCircle size={18} />
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
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
  busy,
  disabled,
  loading,
  messages,
  models,
  openRouterConnected,
  openRouterServerConnected,
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
  busy: string | null;
  disabled: boolean;
  loading: boolean;
  messages: ChatMessage[];
  models: ModelOption[];
  openRouterConnected: boolean;
  openRouterServerConnected: boolean;
  onSelectModel: (modelId: string) => void;
  onSend: (message: string) => void;
  onUpload: (file: File) => void;
  readyDocuments: DocumentRecord[];
  selectedModel: string;
  selectedMode: "fast" | "tutor" | "agent";
  onSelectMode: (mode: "fast" | "tutor" | "agent") => void;
  t: Record<string, string>;
  locale: "es" | "en";
}) {
  const needsSources = readyDocuments.length === 0;

  return (
    <div className="student-tutor-workspace">
      <section className="student-chat-panel">
        <div className="student-chat-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="student-section-kicker">
              <BrainCircuit size={16} />
              Tutor IA
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
          <div className="student-chat-actions">
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
            <UploadControl
              disabled={busy === "upload"}
              highlight={needsSources}
              loading={busy === "upload"}
              label={t.uploadPdf}
              onUpload={onUpload}
            />
            <span className={`status-pill ${readyDocuments.length > 0 ? "is-ready" : "is-muted"}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {readyDocuments.length > 0 ? t.sourcesReady : t.waitingForSources}
            </span>
          </div>
        </div>

        <div className="panel-scroll-shell">
          <div className="student-chat-scroll panel-scroll-area">
            {messages.length === 0 ? (
              <EmptyState
                icon={<BrainCircuit size={30} />}
                title={t.askFirstQuestion}
                text={t.askFirstQuestionText}
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
          onSend={onSend}
        />
      </section>

      <aside className="student-context-panel">
        <div className="student-context-title">
          <PanelRightOpen size={17} />
          {t.liveContext}
        </div>
        <div className="space-y-3">
          {readyDocuments.slice(0, 5).map((document) => (
            <DocumentMini key={document.id} document={document} t={t} />
          ))}
          {readyDocuments.length === 0 && (
            <EmptyState compact icon={<FileText size={18} />} title={t.noReadyDocs} text={t.noReadyDocsText} />
          )}
          {busy === "chat" && (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">
              <Loader2 className="mr-2 inline animate-spin" size={16} />
              {t.tutorThinking}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function DocumentStudio({
  activeDocuments,
  busy,
  onUpload,
  t,
}: {
  activeDocuments: DocumentRecord[];
  busy: string | null;
  onUpload: (file: File) => void;
  t: Record<string, string>;
}) {
  return (
    <div className="miro-studio-grid h-full min-h-[560px] gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="upload-dropzone miro-side-panel">
        <div className="brand-mark h-12 w-12">
          {busy === "upload" ? <Loader2 className="animate-spin" size={22} /> : <Upload size={22} />}
        </div>
        <span className="miro-panel-kicker">{t.documents}</span>
        <h2 className="mt-4 text-2xl font-semibold text-white">{t.uploadLibrary}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">{t.uploadLibraryText}</p>
        <div className="miro-upload-orbit" aria-hidden="true">
          <span>{t.uploadPdf}</span>
          <span>{t.sourceLibrary}</span>
          <span>{t.sourcesReady}</span>
        </div>
        <p className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-xs leading-5 text-cyan-100">
          {t.uploadStartsAutomatically}
        </p>
        <UploadControl
          disabled={busy === "upload"}
          loading={busy === "upload"}
          label={t.uploadPdf}
          onUpload={onUpload}
          wide
        />
      </section>

      <section className="source-library-panel rounded-3xl border border-white/10 bg-slate-950/55 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{t.sourceLibrary}</h2>
            <p className="mt-1 text-sm text-slate-400">{t.sourceLibraryText}</p>
          </div>
          <span className="status-pill is-muted">{activeDocuments.length} {t.sources}</span>
        </div>

        <div className="panel-scroll-shell">
          <div className="panel-scroll-area grid gap-3 md:grid-cols-2">
            {activeDocuments.map((document) => (
              <DocumentCard key={document.id} document={document} t={t} />
            ))}
            {activeDocuments.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState icon={<FileText size={28} />} title={t.emptyLibraryTitle} text={t.emptyLibraryText} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ToolStudio({
  activeArtifacts,
  activeSpace,
  busy,
  hasReadySources,
  onGenerate,
  selectedModel,
  t,
}: {
  activeArtifacts: GeneratedArtifact[];
  activeSpace: StudySpace | null;
  busy: string | null;
  hasReadySources: boolean;
  onGenerate: (kind: ToolKind) => void;
  selectedModel: string;
  t: Record<string, string>;
}) {
  return (
    <div className="miro-studio-grid h-full min-h-[560px] gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <section className="space-y-3">
        {toolKinds.map((kind) => (
          <button
            key={kind}
            className={`tool-card bg-gradient-to-br ${toolMeta[kind].tone}`}
            disabled={!activeSpace || !hasReadySources || busy === kind}
            onClick={() => onGenerate(kind)}
            type="button"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              {busy === kind ? <Loader2 className="animate-spin" size={18} /> : toolMeta[kind].icon}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-base font-semibold text-white">{t[kind]}</span>
              <span className="mt-1 block text-sm leading-5 text-slate-300">{t[`${kind}Description`]}</span>
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
        {!hasReadySources && (
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
            {t.toolsNeedSources}
          </div>
        )}
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-xs leading-5 text-cyan-100">
          {t.aiModel}: {selectedModel}
        </div>
      </section>

      <section className="generated-panel min-h-0 rounded-3xl border border-white/10 bg-slate-950/55 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{t.generatedOutput}</h2>
            <p className="mt-1 text-sm text-slate-400">{t.generatedOutputText}</p>
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
  onSave,
  profile,
  t,
}: {
  busy: string | null;
  draft: LearningProfileDraft;
  locale: Locale;
  onChange: (draft: LearningProfileDraft) => void;
  onSave: () => void;
  profile: Profile | null;
  t: Record<string, string>;
}) {
  const options = learningProfileOptions(t);
  const complete = isLearningProfileComplete(draft);
  const profileReady = complete && draft.birthDate.trim().length > 0 && draft.birthCountryCode.trim().length > 0 && draft.birthCity.trim().length > 0;
  const countryOptions = getBirthCountryOptions(locale);
  const selectedCountry = getBirthCountryOption(draft.birthCountryCode);
  const cityOptions = selectedCountry?.cities ?? [];
  const displayBirthPlace = formatBirthPlace(draft.birthCity, draft.birthCountryCode, locale) || draft.birthPlace || t.notSet;
  const [learningGoalOpen, setLearningGoalOpen] = useState(false);

  return (
    <div className="miro-studio-grid h-full min-h-[560px] gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="profile-hero-card rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-cyan-300/[0.04] p-5">
        <div className="brand-mark h-14 w-14">
          <UserRound size={24} />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">{profile?.full_name ?? t.student}</h2>
        <p className="mt-2 break-words text-sm text-slate-300">{profile?.email}</p>
        <div className="mt-6 grid gap-3">
          <ProfileFact label={t.birthDate} value={draft.birthDate || t.notSet} />
          <ProfileFact label={t.birthPlace} value={displayBirthPlace} />
          <ProfileFact label={t.learningGoal} value={draft.learningGoal || t.notSet} />
        </div>
      </section>

      <section className="profile-settings-card rounded-3xl border border-white/10 bg-slate-950/55 p-4 sm:p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">{t.profileTuning}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{t.profileTuningText}</p>
        </div>

        <section className={`profile-learning-accordion ${learningGoalOpen ? "is-open" : ""}`}>
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
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <h3 className="text-sm font-semibold text-white">{t.personalContext}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{t.personalContextText}</p>
                    <div className="profile-personal-fields mt-3">
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
                  </div>

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

                  <button
                    className="primary-button h-12 justify-center"
                    disabled={busy === "profile" || !profileReady}
                    onClick={onSave}
                    type="button"
                  >
                    {busy === "profile" ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    {t.saveProfile}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </section>
    </div>
  );
}

function InsightPanel({
  artifacts,
  documents,
  loading,
  profile,
  readyDocuments,
  t,
}: {
  artifacts: GeneratedArtifact[];
  documents: DocumentRecord[];
  loading: boolean;
  profile: Profile | null;
  readyDocuments: DocumentRecord[];
  t: Record<string, string>;
}) {
  const readiness = documents.length > 0 ? Math.round((readyDocuments.length / documents.length) * 100) : 0;
  const recentItems = [
    ...documents.slice(0, 3).map((document) => ({ id: document.id, kind: "document" as const, node: <DocumentMini document={document} t={t} /> })),
    ...artifacts.slice(0, 2).map((artifact) => ({ id: artifact.id, kind: "artifact" as const, node: <ArtifactMini artifact={artifact} t={t} /> })),
  ];

  return (
    <section className="liquid-study-pulse" aria-label={t.studyPulse}>
      <div className="liquid-pulse-header">
        <div>
          <span>{t.studyPulse}</span>
          <h2>{profile?.full_name ?? profile?.email ?? t.student}</h2>
        </div>
        <span className="liquid-pulse-icon">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Flame size={18} />}
        </span>
      </div>

      <div className="liquid-pulse-score">
        <strong>{readiness}%</strong>
        <span>{readiness > 0 ? t.readyToStudy : t.buildingIndex}</span>
        <div><i style={{ width: `${readiness}%` }} /></div>
      </div>

      <div className="liquid-pulse-metrics">
        <ProgressRow label={t.sourcesReady} value={readyDocuments.length} total={Math.max(documents.length, 1)} />
        <ProgressRow label={t.generatedOutput} value={artifacts.length} total={Math.max(artifacts.length + 2, 3)} />
      </div>

      <div className="liquid-recent-activity">
        <h3>{t.recentActivity}</h3>
        <div className="liquid-activity-list">
          {recentItems.map((item) => (
            <div key={`${item.kind}-${item.id}`}>{item.node}</div>
          ))}
          {recentItems.length === 0 && (
            <EmptyState compact icon={<Sparkles size={18} />} title={t.emptyActivityTitle} text={t.emptyActivityText} />
          )}
        </div>
      </div>
    </section>
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
    <label className="block text-sm font-medium text-slate-300">
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
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-[transform,background-color,color] hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
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
    <label className="block text-sm font-medium text-slate-300">
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
      <label className="block text-sm font-medium text-slate-300">
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

function CreateSpaceButton({
  busy,
  label,
  onCreate,
  t,
}: {
  busy: boolean;
  label: string;
  onCreate: (name: string) => Promise<string | null>;
  t: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError(t.spaceNameRequired);
      return;
    }

    setLocalError(null);
    const created = await onCreate(trimmedName);
    if (created) {
      setName("");
      setOpen(false);
    }
  }

  return (
    <div className="space-creator-shell relative">
      <button
        aria-expanded={open}
        className="space-creator-trigger inline-flex h-8 items-center gap-1.5 rounded-full bg-cyan-300 px-3 text-xs font-bold text-slate-950 transition-[transform,background-color,opacity] hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:opacity-60"
        disabled={busy}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {busy ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
        <span className="space-creator-trigger-label hidden sm:inline lg:hidden 2xl:inline">{label}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate={{ opacity: 1 }}
            className="space-creator-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                setLocalError(null);
              }
            }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) {
                setOpen(false);
                setLocalError(null);
              }
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <motion.form
              animate={{ opacity: 1, y: 0, scale: 1 }}
              aria-label={label}
              aria-modal="true"
              className="space-creator-popover"
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              onSubmit={submit}
              role="dialog"
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                {label}
                <input
                  autoFocus
                  className="text-input mt-2 h-11"
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t.newSpacePlaceholder}
                  value={name}
                />
              </label>
              {localError && <p className="mt-2 text-xs font-medium text-rose-600">{localError}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="secondary-button h-10 px-4 text-xs"
                  onClick={() => {
                    setOpen(false);
                    setLocalError(null);
                  }}
                  type="button"
                >
                  {t.cancel}
                </button>
                <button className="primary-button h-10 px-4 text-xs" disabled={busy} type="submit">
                  {busy ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  {t.create}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
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
    <label className={`upload-button ${wide ? "w-full justify-center" : ""} ${highlight ? "is-priority" : ""}`}>
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

function Metric({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger" | "accent";
}) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">{icon}{label}</div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
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
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-cyan-100">
        {icon}
      </div>
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-400">{text}</p>
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

function DocumentCard({ document, t }: { document: DocumentRecord; t: Record<string, string> }) {
  return (
    <article className="document-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{document.file_name}</p>
          <p className="mt-1 text-xs text-slate-400">{formatDate(document.created_at)}</p>
        </div>
        <StatusBadge status={document.processing_status} t={t} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
        <ProfileFact label={t.chunks} value={String(document.metadata.chunk_count ?? "0")} compact />
        <ProfileFact label={t.status} value={t[document.processing_status] ?? document.processing_status} compact />
      </div>
      {document.error_message && (
        <p className="mt-3 rounded-xl border border-red-300/20 bg-red-400/10 p-2 text-xs leading-5 text-red-100">
          {document.error_message}
        </p>
      )}
    </article>
  );
}

function DocumentMini({ document, t }: { document: DocumentRecord; t: Record<string, string> }) {
  return (
    <div className="mini-row">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 text-cyan-100">
        <FileText size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{document.file_name}</span>
        <span className="block truncate text-xs text-slate-400">{t[document.processing_status] ?? document.processing_status}</span>
      </span>
      <StatusDot status={document.processing_status} />
    </div>
  );
}

function ArtifactCard({ artifact, t }: { artifact: GeneratedArtifact; t: Record<string, string> }) {
  return (
    <article className="artifact-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-200">{t[artifact.kind] ?? artifact.kind}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{artifact.title}</h3>
        </div>
        <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-300">{formatDate(artifact.created_at)}</span>
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

function ArtifactMini({ artifact, t }: { artifact: GeneratedArtifact; t: Record<string, string> }) {
  return (
    <div className="mini-row">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-300/10 text-violet-100">
        <Sparkles size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{artifact.title}</span>
        <span className="block truncate text-xs text-slate-400">{t[artifact.kind] ?? artifact.kind}</span>
      </span>
    </div>
  );
}

function StatusBadge({ status, t }: { status: DocumentRecord["processing_status"]; t: Record<string, string> }) {
  return (
    <span className={`status-badge status-${status}`}>
      <StatusDot status={status} />
      {t[status] ?? status}
    </span>
  );
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
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] ${compact ? "p-2" : "p-3"}`}>
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = Math.min(100, Math.round((value / Math.max(total, 1)) * 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
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
