import config from "@payload-config";
import { getPayload } from "payload";
import { NextResponse } from "next/server";
import { z } from "zod";

import type { ContactMessage } from "~/payload-types";

export const runtime = "nodejs";

const contactSchema = z.object({
  email: z.string().trim().email().max(320),
  message: z
    .object({
      root: z
        .object({
          children: z.array(z.unknown()),
          type: z.string(),
        })
        .passthrough(),
    })
    .passthrough(),
  name: z.string().trim().max(120).optional(),
  website: z.string().max(0).optional(),
});

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function hasCapacity(key: string) {
  const now = Date.now();
  const existing = rateLimits.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (existing.count >= 5) return false;

  existing.count += 1;
  return true;
}

function extractText(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const node = value as { children?: unknown[]; text?: unknown };
  const ownText = typeof node.text === "string" ? node.text : "";
  const childText = Array.isArray(node.children)
    ? node.children.map(extractText).join(" ")
    : "";

  return `${ownText} ${childText}`.trim();
}

function sanitizeMessage(root: Record<string, unknown>) {
  const paragraphs = Array.isArray(root.children)
    ? root.children.flatMap((value) => {
        if (!value || typeof value !== "object") return [];

        const paragraph = value as Record<string, unknown>;
        if (paragraph.type !== "paragraph") return [];

        const children = Array.isArray(paragraph.children)
          ? paragraph.children.flatMap((child) => {
              if (!child || typeof child !== "object") return [];

              const textNode = child as Record<string, unknown>;
              if (textNode.type !== "text" || typeof textNode.text !== "string")
                return [];

              return [
                {
                  detail: 0,
                  format:
                    typeof textNode.format === "number"
                      ? textNode.format & 3
                      : 0,
                  mode: "normal",
                  style: "",
                  text: textNode.text,
                  type: "text",
                  version: 1,
                },
              ];
            })
          : [];

        return [
          {
            children,
            direction: null,
            format: "",
            indent: 0,
            textFormat: 0,
            textStyle: "",
            type: "paragraph",
            version: 1,
          },
        ];
      })
    : [];

  return {
    root: {
      children: paragraphs,
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  } as ContactMessage["message"];
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 60_000) {
    return NextResponse.json(
      { error: "Message is too large." },
      { status: 413 },
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const forwardedAddress = forwardedFor?.trim();
  const rateLimitKey = forwardedAddress ?? "local";
  if (!hasCapacity(rateLimitKey)) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and message." },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const message = sanitizeMessage(parsed.data.message.root);
  const messageText = extractText(message.root);
  if (messageText.length < 3 || messageText.length > 5_000) {
    return NextResponse.json(
      { error: "Message must be between 3 and 5,000 characters." },
      { status: 400 },
    );
  }

  const payload = await getPayload({ config });
  await payload.create({
    collection: "contact-messages",
    data: {
      email: parsed.data.email,
      message,
      name: parsed.data.name,
      submittedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  });

  return NextResponse.json({ ok: true });
}
