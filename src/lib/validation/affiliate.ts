import { z } from "zod";

export const AFFILIATE_CHANNELS = [
  "YOUTUBE",
  "X",
  "INSTAGRAM",
  "TIKTOK",
  "NEWSLETTER",
  "BLOG",
  "DISCORD_TELEGRAM",
  "PODCAST",
  "OTHER",
] as const;

export const AFFILIATE_CHANNEL_LABELS: Record<
  (typeof AFFILIATE_CHANNELS)[number],
  string
> = {
  YOUTUBE: "YouTube",
  X: "X / Twitter",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  NEWSLETTER: "Newsletter",
  BLOG: "Blog",
  DISCORD_TELEGRAM: "Discord / Telegram",
  PODCAST: "Podcast",
  OTHER: "Other",
};

export const affiliateSignupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200),
    confirmPassword: z.string(),
    displayName: z
      .string()
      .min(2, "Display name must be at least 2 characters")
      .max(120),
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(120),
    country: z.string().max(100).optional().or(z.literal("")),
    taxResidency: z.string().max(100).optional().or(z.literal("")),
    primaryChannel: z.enum(AFFILIATE_CHANNELS),
    channelUrl: z
      .string()
      .url("Enter a valid URL")
      .max(500)
      .optional()
      .or(z.literal("")),
    audienceSize: z
      .number()
      .int()
      .min(0)
      .max(1_000_000_000)
      .optional()
      .nullable(),
    pitch: z
      .string()
      .min(10, "Pitch must be at least 10 characters")
      .max(250, "Pitch must be 250 characters or fewer"),
    termsAccepted: z.boolean().refine((v) => v === true, {
      message: "You must accept the Affiliate Terms to apply",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type AffiliateSignupForm = z.infer<typeof affiliateSignupSchema>;

export const affiliateLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password is required"),
});

export type AffiliateLoginForm = z.infer<typeof affiliateLoginSchema>;

export const affiliateSettingsSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  country: z.string().max(100).optional(),
  tax_residency: z.string().max(100).optional(),
  payout_instructions: z.string().max(2000).optional(),
  tax_form_url: z
    .string()
    .url("tax_form_url must be a valid URL")
    .max(500)
    .optional()
    .or(z.literal("")),
});

export type AffiliateSettingsForm = z.infer<typeof affiliateSettingsSchema>;
