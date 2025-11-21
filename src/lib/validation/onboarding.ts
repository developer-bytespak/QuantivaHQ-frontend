import { z } from "zod";

export const personalInfoSchema = z.object({
  fullLegalName: z
    .string()
    .min(2, "Full legal name is required")
    .max(120, "Full legal name is too long"),
  dateOfBirth: z
    .string()
    .refine((value) => Boolean(Date.parse(value)), "Date of birth must be valid"),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  nationality: z.string().min(2, "Nationality is required"),
  countryOfResidence: z.string().min(2, "Country of residence is required"),
});

export const experienceSchema = z.object({
  experience: z.enum(["novice", "intermediate", "expert"], {
    required_error: "Select your trading experience",
  }),
  annualVolume: z
    .number({ invalid_type_error: "Enter estimated annual volume" })
    .min(0, "Value cannot be negative"),
});

export const apiConnectionSchema = z.object({
  binanceKey: z.string().optional(),
  binanceSecret: z.string().optional(),
  bybitKey: z.string().optional(),
  bybitSecret: z.string().optional(),
  ibkrUsername: z.string().optional(),
  ibkrToken: z.string().optional(),
});

export type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
export type ExperienceForm = z.infer<typeof experienceSchema>;
export type ApiConnectionForm = z.infer<typeof apiConnectionSchema>;
