import { ModelServiceError, type ModelRequest, type ModelRunner } from "@/lib/model/types";

interface LiveConfig {
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

function validateBaseUrl(value: string) {
  const url = new URL(value);
  const isLocalHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new ModelServiceError("AI_BASE_URL must use HTTPS.", "Invalid server-side model URL.");
  }
  return url.toString().replace(/\/$/, "");
}

function endpoint(baseUrl: string) {
  return baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl}/chat/completions`;
}

function extractContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choice = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("");
  }
  return "";
}

/** Thin OpenAI-compatible Chat Completions client. Secrets stay on the server. */
export function createLiveRunner(config: LiveConfig): ModelRunner {
  return {
    mode: "live",
    label: `Live model — ${config.modelName}`,
    modelName: config.modelName,
    async generate(request: ModelRequest) {
      let baseUrl: string;
      try {
        baseUrl = validateBaseUrl(config.baseUrl);
      } catch {
        throw new ModelServiceError(
          "The model service is misconfigured.",
          "The model service is misconfigured. Check AI_BASE_URL on the server.",
        );
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);
      const abortFromCaller = () => controller.abort();
      request.signal?.addEventListener("abort", abortFromCaller, { once: true });

      try {
        const response = await fetch(endpoint(baseUrl), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.modelName,
            temperature: 0.2,
            max_tokens: 500,
            stream: false,
            messages: [
              { role: "system", content: request.systemPrompt },
              ...request.messages.map((message) => ({ role: message.role, content: message.content })),
            ],
          }),
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new ModelServiceError(
            `Model provider returned HTTP ${response.status}.`,
            `The model provider could not complete this request (HTTP ${response.status}). Please try again.`,
          );
        }
        const payload: unknown = await response.json();
        const content = extractContent(payload).trim();
        if (!content) {
          throw new ModelServiceError(
            "Model provider returned no text.",
            "The model returned an empty response. Please try again.",
          );
        }
        return content;
      } catch (error) {
        if (error instanceof ModelServiceError) throw error;
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new ModelServiceError(
            "Model request aborted.",
            "The model request timed out or was cancelled. Please try again.",
          );
        }
        throw new ModelServiceError(
          "Model request failed.",
          "I couldn't reach the answer service. Please check the connection and try again.",
        );
      } finally {
        clearTimeout(timeout);
        request.signal?.removeEventListener("abort", abortFromCaller);
      }
    },
  };
}
