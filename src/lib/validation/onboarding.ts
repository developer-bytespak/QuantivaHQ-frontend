import { z } from "zod";

export const personalInfoSchema = z.object({
  fullLegalName: z
    .string()
    .min(2, "Full legal name is required")
    .max(120, "Full legal name is too long"),
  dateOfBirth: z
    .string()
    .refine((value) => Boolean(Date.parse(value)), "Date of birth must be valid")
    .refine((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      // Calculate actual age considering month and day
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      
      return actualAge >= 18;
    }, "You must be at least 18 years old"),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  nationality: z.string().min(2, "Nationality is required"),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be a valid international format")
    .optional(),
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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
    twoFactorCode: z
      .string()
      .length(6, "2FA code must be exactly 6 digits")
      .regex(/^\d+$/, "2FA code must contain only digits"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
export type ExperienceForm = z.infer<typeof experienceSchema>;
export type ApiConnectionForm = z.infer<typeof apiConnectionSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
