import { env } from "@/lib/server-env";

export type ModelOption = {
  id: string;
  name: string;
  contextLength: number | null;
  isFree: boolean;
  pricingLabel: string;
};

type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  architecture?: {
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
  };
};

const freeRouter: ModelOption = {
  id: "openrouter/free",
  name: "OpenRouter Free Router",
  contextLength: 200000,
  isFree: true,
  pricingLabel: "Free",
};

export class OpenRouterConnectionError extends Error {
  constructor(
    public readonly status: 401 | 502,
    message: string,
  ) {
    super(message);
    this.name = "OpenRouterConnectionError";
  }
}

export async function listOpenRouterModels(): Promise<ModelOption[]> {
  try {
    const headers = new Headers();
    if (env.OPENROUTER_API_KEY) {
      headers.set("Authorization", `Bearer ${env.OPENROUTER_API_KEY}`);
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers,
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter models request failed: ${response.status}`);
    }

    const payload = (await response.json()) as { data?: OpenRouterModel[] };
    const models = (payload.data ?? [])
      .filter((model) => (model.architecture?.output_modalities ?? ["text"]).includes("text"))
      .map(toModelOption)
      .sort((left, right) => Number(right.isFree) - Number(left.isFree) || left.name.localeCompare(right.name));

    return [freeRouter, ...models.filter((model) => model.id !== freeRouter.id)];
  } catch (error) {
    console.warn("[Mentora] Could not load OpenRouter models. Using fallback free router.", error);
    return [freeRouter];
  }
}

export async function isFreeOpenRouterModel(modelId: string) {
  const models = await listOpenRouterModels();
  return models.some((model) => model.id === modelId && model.isFree);
}

export async function verifyOpenRouterApiKey(apiKey: string) {
  const response = await fetch("https://openrouter.ai/api/v1/key", {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new OpenRouterConnectionError(
      response.status === 401 ? 401 : 502,
      response.status === 401 ? "OpenRouter rejected this API key." : "OpenRouter connection check failed.",
    );
  }

  const payload = (await response.json()) as {
    data?: { label?: string; limit?: number | null; usage?: number | null };
  };

  return {
    label: payload.data?.label ?? "OpenRouter account",
    limit: payload.data?.limit ?? null,
    usage: payload.data?.usage ?? null,
  };
}

function toModelOption(model: OpenRouterModel): ModelOption {
  const promptPrice = Number(model.pricing?.prompt ?? "0");
  const completionPrice = Number(model.pricing?.completion ?? "0");
  const requestPrice = Number(model.pricing?.request ?? "0");
  const isFree =
    model.id === freeRouter.id ||
    model.id.endsWith(":free") ||
    (promptPrice === 0 && completionPrice === 0 && requestPrice === 0);

  return {
    id: model.id,
    name: model.name ?? model.id,
    contextLength: model.context_length ?? null,
    isFree,
    pricingLabel: isFree ? "Free" : "Paid",
  };
}
