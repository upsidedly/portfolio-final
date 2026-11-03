import { actionInput } from "~/lib/project-controls/contracts";
import { isPortfolioOwner } from "~/lib/admin-identity.mjs";
import { auth } from "~/server/better-auth";
import { corkControls, ControlsError } from "~/server/project-controls/bridge";
import { privateHeaders } from "~/server/tools/access";

export const dynamic = "force-dynamic";

async function owner(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session && isPortfolioOwner(session)
    ? session.user.email.trim().toLowerCase()
    : null;
}
function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof ControlsError
          ? error.message
          : "Project controls are temporarily unavailable. Retry the same action.",
    },
    {
      status: error instanceof ControlsError ? error.status : 503,
      headers: privateHeaders,
    },
  );
}
export async function GET(request: Request) {
  const actor = await owner(request);
  if (!actor)
    return Response.json(
      { error: "Owner sign-in required." },
      { status: 401, headers: privateHeaders },
    );
  try {
    return Response.json(await corkControls(actor, { action: "overview" }), {
      headers: privateHeaders,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  const actor = await owner(request);
  if (!actor)
    return Response.json(
      { error: "Owner sign-in required." },
      { status: 401, headers: privateHeaders },
    );
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Use the project controls page to make changes." },
      { status: 403, headers: privateHeaders },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json(
      { error: "Send a JSON request." },
      { status: 415, headers: privateHeaders },
    );
  if (Number(request.headers.get("content-length")) > 8192)
    return Response.json(
      { error: "The request is too large." },
      { status: 413, headers: privateHeaders },
    );
  let text: string;
  try {
    text = await request.text();
  } catch {
    return Response.json(
      { error: "The request could not be read." },
      { status: 400, headers: privateHeaders },
    );
  }
  if (new TextEncoder().encode(text).byteLength > 8192)
    return Response.json(
      { error: "The request is too large." },
      { status: 413, headers: privateHeaders },
    );
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "The request is invalid." },
      { status: 400, headers: privateHeaders },
    );
  }
  const parsed = actionInput.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: "Check the gift or purchase settings and try again." },
      { status: 400, headers: privateHeaders },
    );
  try {
    return Response.json(await corkControls(actor, parsed.data), {
      headers: privateHeaders,
    });
  } catch (error) {
    return failure(error);
  }
}
