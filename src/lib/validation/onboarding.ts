import { z } from "zod";

export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name is required")
    .max(120, "Full name is too long"),
  dateOfBirth: z
    .string()
    .refine((value) => Boolean(Date.parse(value)), "Date of birth must be valid"),
  country: z.string().min(2, "Country is required"),
  regionConsent: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge regional compliance" }),
  }),
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
