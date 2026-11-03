import type { Access } from "payload";
import { isAdminEmail } from "~/lib/admin-identity.mjs";

export const isAdmin = (({ req }) => isAdminEmail(req.user?.email)) satisfies Access;
