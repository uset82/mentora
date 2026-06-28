import OpenAI from "openai";
import { generateText, streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { assertServerEnv, env } from "@/lib/server-env";

export type AITask =
  | "tutor_chat"
  | "summary"
  | "quiz"
  | "flashcards"
  | "apa_summary"
  | "mind_map"
  | "data_table"
  | "study_guide"
  | "diagram"
  | "infographic"
  | "audit";
export type AIPriority = "speed" | "quality" | "cost";

export type AITextRequest = {
  task: AITask;
  priority: AIPriority;
  system: string;
  prompt: string;
  model?: string;
  openRouterApiKey?: string;
};

export type AITextResult = {
  text: string;
  provider: "openai" | "openrouter";
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
};

export type AITextStreamResult = {
  provider: "openai" | "openrouter";
  model: string;
  textStream: AsyncIterable<string>;
  getUsage: () => Promise<{
    inputTokens: number | null;
    outputTokens: number | null;
    latencyMs: number;
  }>;
};

function chooseOpenAIModel(task: AITask, priority: AIPriority) {
  if (priority === "quality" || task === "apa_summary" || task === "audit") {
    return env.OPENAI_CHAT_MODEL_QUALITY;
  }

  return env.OPENAI_CHAT_MODEL_FAST;
}

export async function generateGroundedText(request: AITextRequest): Promise<AITextResult> {
  const startedAt = Date.now();

  if (request.model || env.AI_PROVIDER === "openrouter") {
    const apiKey = request.openRouterApiKey ?? env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter is not connected. Add an OpenRouter API key or select an OpenAI model.");
    }

    const openrouter = createOpenRouter({
      apiKey,
      appName: env.OPENROUTER_APP_NAME,
      appUrl: env.OPENROUTER_APP_URL,
    });

    const result = await generateText({
      model: openrouter(request.model ?? env.OPENROUTER_MODEL),
      system: request.system,
      prompt: request.prompt,
      temperature: request.task === "tutor_chat" ? 0.2 : 0.35,
    });

    return {
      text: result.text,
      provider: "openrouter",
      model: request.model ?? env.OPENROUTER_MODEL,
      inputTokens: result.usage?.inputTokens ?? null,
      outputTokens: result.usage?.outputTokens ?? null,
      latencyMs: Date.now() - startedAt,
    };
  }

  assertServerEnv(["OPENAI_API_KEY"]);

  const model = chooseOpenAIModel(request.task, request.priority);
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const result = await openai.responses.create({
    model,
    input: [
      {
        role: "system",
        content: request.system,
      },
      {
        role: "user",
        content: request.prompt,
      },
    ],
  });

  return {
    text: result.output_text ?? "",
    provider: "openai",
    model,
    inputTokens: result.usage?.input_tokens ?? null,
    outputTokens: result.usage?.output_tokens ?? null,
    latencyMs: Date.now() - startedAt,
  };
}

export async function streamGroundedText(request: AITextRequest): Promise<AITextStreamResult> {
  const startedAt = Date.now();

  if (request.model || env.AI_PROVIDER === "openrouter") {
    const apiKey = request.openRouterApiKey ?? env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter is not connected. Add an OpenRouter API key or select an OpenAI model.");
    }

    const openrouter = createOpenRouter({
      apiKey,
      appName: env.OPENROUTER_APP_NAME,
      appUrl: env.OPENROUTER_APP_URL,
    });

    const result = streamText({
      model: openrouter(request.model ?? env.OPENROUTER_MODEL),
      system: request.system,
      prompt: request.prompt,
      temperature: request.task === "tutor_chat" ? 0.2 : 0.35,
    });

    return {
      provider: "openrouter",
      model: request.model ?? env.OPENROUTER_MODEL,
      textStream: result.textStream,
      getUsage: async () => {
        const usage = await result.usage;
        return {
          inputTokens: usage.inputTokens ?? null,
          outputTokens: usage.outputTokens ?? null,
          latencyMs: Date.now() - startedAt,
        };
      },
    };
  }

  assertServerEnv(["OPENAI_API_KEY"]);

  const model = chooseOpenAIModel(request.task, request.priority);
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const stream = await openai.responses.create({
    model,
    stream: true,
    input: [
      {
        role: "system",
        content: request.system,
      },
      {
        role: "user",
        content: request.prompt,
      },
    ],
  });

  let inputTokens: number | null = null;
  let outputTokens: number | null = null;

  async function* textStream() {
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        yield event.delta;
      }

      if (event.type === "response.completed") {
        inputTokens = event.response.usage?.input_tokens ?? null;
        outputTokens = event.response.usage?.output_tokens ?? null;
      }
    }
  }

  return {
    provider: "openai",
    model,
    textStream: textStream(),
    getUsage: async () => ({
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startedAt,
    }),
  };
}

export async function embedTexts(input: string[]) {
  if (!env.OPENAI_API_KEY) {
    return input.map((text) => toVectorLiteral(createLocalSearchEmbedding(text, env.OPENAI_EMBEDDING_DIMENSIONS)));
  }

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const result = await openai.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      dimensions: env.OPENAI_EMBEDDING_DIMENSIONS,
      input,
    });

    return result.data.map((item) => {
      if (item.embedding.length !== env.OPENAI_EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Embedding dimension mismatch: ${env.OPENAI_EMBEDDING_MODEL} returned ${item.embedding.length}, expected ${env.OPENAI_EMBEDDING_DIMENSIONS}.`,
        );
      }

      return toVectorLiteral(item.embedding);
    });
  } catch (error) {
    console.warn("[Mentora] OpenAI embeddings failed. Falling back to local search embeddings.", error);
    return input.map((text) => toVectorLiteral(createLocalSearchEmbedding(text, env.OPENAI_EMBEDDING_DIMENSIONS)));
  }
}

export async function transcribePdfPageImage({
  image,
  pageNumber,
}: {
  image: Uint8Array;
  pageNumber: number;
}) {
  assertServerEnv(["OPENROUTER_API_KEY"]);

  const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    appName: env.OPENROUTER_APP_NAME,
    appUrl: env.OPENROUTER_APP_URL,
  });

  const result = await generateText({
    model: openrouter(env.OPENROUTER_OCR_MODEL),
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Extract the study-relevant content from PDF page ${pageNumber}. ` +
              "Transcribe all readable text in natural reading order. " +
              "If the page contains diagrams, charts, tables, or UI screenshots, describe their important information briefly. " +
              "Do not invent missing content. If nothing is readable, return an empty string. Return only the extracted content.",
          },
          {
            type: "image",
            image,
            mediaType: "image/png",
          },
        ],
      },
    ],
  });

  return result.text.trim();
}

function createLocalSearchEmbedding(text: string, dimensions: number) {
  const vector = Array.from({ length: dimensions }, () => 0);
  const terms = tokenizeForSearch(text);

  for (const term of terms) {
    const index = positiveHash(term) % dimensions;
    const sign = positiveHash(`sign:${term}`) % 2 === 0 ? 1 : -1;
    vector[index] += sign;

    for (let position = 0; position < term.length - 2; position += 1) {
      const trigram = term.slice(position, position + 3);
      const trigramIndex = positiveHash(`tri:${trigram}`) % dimensions;
      vector[trigramIndex] += sign * 0.35;
    }
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function tokenizeForSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 2)
    .slice(0, 900);
}

function toVectorLiteral(vector: number[]) {
  return `[${vector.join(",")}]`;
}

function positiveHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
