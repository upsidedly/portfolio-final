import type { Access } from "payload";
import { isAdminEmail } from "~/lib/admin-identity.mjs";

export const isAdmin: Access = ({ req }) => isAdminEmail(req.user?.email);
