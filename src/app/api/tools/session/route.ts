import { authorizeToolsRequest, privateHeaders } from "~/server/tools/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await authorizeToolsRequest(request);
  if (denied) return denied;
  return Response.json({ authorized: true }, { headers: privateHeaders });
}
