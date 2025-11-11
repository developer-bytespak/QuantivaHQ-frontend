import { personalInfoSchema, experienceSchema, apiConnectionSchema } from "@/lib/validation/onboarding";
import { useOnboardingStore } from "@/state/onboarding-store";

export function getOnboardingProgress() {
  const { currentStep, completedSteps } = useOnboardingStore.getState();
  const totalSteps = 11;
  const uniqueCompleted = new Set(completedSteps);
  const progress = (uniqueCompleted.size / totalSteps) * 100;

  return {
    currentStep,
    completedSteps: Array.from(uniqueCompleted),
    progress: Math.round(progress),
  };
}

export function validatePersonalInfo(values: unknown) {
  return personalInfoSchema.safeParse(values);
}

export function validateExperience(values: unknown) {
  return experienceSchema.safeParse(values);
}

export function validateApiConnections(values: unknown) {
  return apiConnectionSchema.safeParse(values);
}
