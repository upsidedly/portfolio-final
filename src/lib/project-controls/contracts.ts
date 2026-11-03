import { z } from "zod";

export const giftInput = z
  .object({
    label: z.string().trim().min(1).max(120),
    message: z.string().max(1000),
    redeemBy: z.string().datetime({ offset: true }).nullable(),
    accessDays: z.number().int().min(1).max(3650).nullable(),
    maxUses: z.number().int().min(1).max(10000),
  })
  .strict();

export const purchaseSettings = z
  .object({
    storeID: z.string().max(30),
    productID: z.string().max(30),
    purchaseURL: z.string().max(1000),
  })
  .strict();

export const actionInput = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("create-gift"),
      requestID: z.string().uuid(),
      gift: giftInput,
    })
    .strict(),
  z
    .object({ action: z.literal("reveal-gift"), id: z.string().uuid() })
    .strict(),
  z
    .object({
      action: z.literal("set-gift-status"),
      id: z.string().uuid(),
      disabled: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("save-settings"),
      settings: purchaseSettings,
      version: z.number().int().positive().nullable(),
    })
    .strict(),
]);
export type ProjectAction = z.infer<typeof actionInput>;
export type PurchaseSettings = z.infer<typeof purchaseSettings>;

const gift = z.object({
  id: z.string().uuid(),
  suffix: z.string(),
  label: z.string(),
  message: z.string(),
  redeemBy: z.string().nullable(),
  accessDays: z.number().nullable(),
  maxUses: z.number(),
  uses: z.number(),
  disabled: z.boolean(),
  createdAt: z.string(),
});
export const overview = z.object({
  product: z.literal("cork"),
  settings: purchaseSettings,
  version: z.number().nullable(),
  gifts: z.array(gift).max(200),
  history: z.array(
    z.object({
      actor: z.string(),
      action: z.string(),
      subject: z.string(),
      createdAt: z.string(),
    }),
  ),
  service: z.object({
    giftsReady: z.boolean(),
    permanentPurchases: z.literal(true),
  }),
});
export type ProjectOverview = z.infer<typeof overview>;
export const codeReply = z.object({
  code: z.string().regex(/^CORK-GIFT-(?:[A-F0-9]{8}-){3}[A-F0-9]{8}$/),
});
export const createdReply = codeReply.extend({
  id: z.string().uuid(),
  label: z.string(),
});
export const savedReply = z.object({ saved: z.literal(true) });
export const settingsReply = savedReply.extend({
  version: z.number().int().positive(),
});
