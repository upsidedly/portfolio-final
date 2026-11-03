import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";
import {
  codeReply,
  createdReply,
  overview,
  savedReply,
  settingsReply,
  type ProjectAction,
} from "~/lib/project-controls/contracts";

export class ControlsError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function corkControls(
  actor: string,
  action: ProjectAction | { action: "overview" },
) {
  const secret = process.env.CORK_ADMIN_BRIDGE_SECRET?.trim();
  if (!secret || secret.length < 32)
    throw new ControlsError(
      503,
      "Cork project controls are not connected yet.",
    );
  const body = JSON.stringify(action),
    timestamp = String(Math.floor(Date.now() / 1000)),
    nonce = randomUUID();
  const hash = createHash("sha256").update(body).digest("hex");
  const signature = createHmac("sha256", secret)
    .update(`${actor}\n${timestamp}\n${nonce}\n${hash}`)
    .digest("hex");
  let response: Response;
  try {
    response = await fetch("https://cork.upsided.dev/api/admin", {
      method: "POST",
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "Content-Type": "application/json",
        "X-Cork-Admin-Email": actor,
        "X-Cork-Admin-Time": timestamp,
        "X-Cork-Admin-Nonce": nonce,
        "X-Cork-Admin-Signature": signature,
      },
    });
  } catch {
    throw new ControlsError(
      503,
      "Cork could not be reached. Retry the same action.",
    );
  }
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new ControlsError(
      503,
      "Cork returned an unreadable response. Retry the same action.",
    );
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new ControlsError(
        503,
        "The Cork administration connection needs configuration.",
      );
    const message =
      result &&
      typeof result === "object" &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "Cork could not complete this action.";
    throw new ControlsError(response.status, message);
  }
  if (action.action === "overview") return overview.parse(result);
  if (action.action === "create-gift") return createdReply.parse(result);
  if (action.action === "reveal-gift") return codeReply.parse(result);
  if (action.action === "save-settings") return settingsReply.parse(result);
  return savedReply.parse(result);
}
