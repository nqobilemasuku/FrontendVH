import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";

const chatMessageSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"),
    content: z.string().trim().min(1).max(1800),
  }),
  z.object({
    role: z.literal("assistant"),
    content: z.string().trim().min(1).max(10000),
  }),
]);

const requestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(12),
});

export const askApplicationAssistant = createServerFn({ method: "POST" })
  .inputValidator(requestSchema)
  .handler(async ({ data }) => {
    const apiKey = getServerConfig().groqApiKey;
    if (!apiKey) {
      throw new Error("The assistant is not configured yet. Please try again later.");
    }

    if (data.messages.at(-1)?.role !== "user") {
      throw new Error("Send a question to continue.");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.4,
        max_tokens: 450,
        messages: [
          {
            role: "system",
            content:
              "You are Varsity Guide, helping students apply to universities in South Africa. Be direct and concise: answer first, usually in 1-3 sentences or up to 4 short bullets, under 100 words. Skip long introductions, repeated questions, and tables unless they clearly help compare options. Give only necessary steps and caveats, and ask at most one brief follow-up when needed. Never invent university requirements or deadlines; tell students to verify them on the official university site. Do not claim to submit applications or access accounts. Never ask for passwords, ID numbers, or sensitive personal information.",
          },
          ...data.messages.slice(-10),
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("The assistant could not respond right now. Please try again shortly.");
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const answer = result.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new Error("The assistant returned an empty response. Please try again.");
    }

    return { answer };
  });
