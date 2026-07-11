import type { AuthStrategyFunction } from "payload";

import { env } from "~/env";
import { auth } from "~/server/better-auth";

export const authenticateWithBetterAuth: AuthStrategyFunction = async ({
  headers,
  payload,
}) => {
  const session = await auth.api.getSession({ headers });
  const email = session?.user.email?.trim().toLowerCase();

  if (!session?.user || email !== env.PAYLOAD_ADMIN_EMAIL.toLowerCase()) {
    return { user: null };
  }

  const existingUsers = await payload.find({
    collection: "users",
    limit: 1,
    overrideAccess: true,
    where: {
      or: [
        { betterAuthUserId: { equals: session.user.id } },
        { email: { equals: email } },
      ],
    },
  });

  let user = existingUsers.docs[0];

  if (user && user.betterAuthUserId !== session.user.id) {
    user = await payload.update({
      collection: "users",
      id: user.id,
      overrideAccess: true,
      data: {
        betterAuthUserId: session.user.id,
        image: session.user.image,
        name: session.user.name,
      },
    });
  }

  user ??= await payload.create({
    collection: "users",
    overrideAccess: true,
    data: {
      betterAuthUserId: session.user.id,
      email,
      image: session.user.image,
      name: session.user.name,
    },
  });

  return {
    user: {
      ...user,
      collection: "users",
    },
  };
};
