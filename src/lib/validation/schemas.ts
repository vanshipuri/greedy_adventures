import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export const chatRequestSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(30),
  })
  .refine((value) => value.messages.at(-1)?.role === "user", {
    message: "The last message must be a user question.",
  });

export const knowledgeTestSchema = z.object({
  question: z.string().trim().min(1).max(500),
  simulateModelFailure: z.boolean().optional().default(false),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type KnowledgeTestRequest = z.infer<typeof knowledgeTestSchema>;

export function zodErrorMessage(error: z.ZodError) {
  return error.issues
    .slice(0, 3)
    .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
    .join("; ");
}
