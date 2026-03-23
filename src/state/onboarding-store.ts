import { create } from "zustand";

type RiskProfile = "low" | "medium" | "aggressive";

type ExperienceLevel = "novice" | "intermediate" | "expert";

type AccountType = "crypto" | "stocks" | "both" | null;

type OnboardingStep =
  | "splash"
  | "account-type"
  | "sign-up"
  | "personal-info"
  | "kyc-verification"
  | "verification-status"
  | "experience"
  | "api-setup";

type PersonalInfo = {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  phoneNumber?: string;
};

type OnboardingState = {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  accountType: AccountType;
  experience: ExperienceLevel | null;
  riskProfile: RiskProfile;
  personalInfo: PersonalInfo;
  setStep: (step: OnboardingStep) => void;
  markCompleted: (step: OnboardingStep) => void;
  setAccountType: (type: AccountType) => void;
  setExperience: (experience: ExperienceLevel) => void;
  setRiskProfile: (risk: RiskProfile) => void;
  setPersonalInfo: (info: Partial<PersonalInfo>) => void;
  reset: () => void;
};

const defaultPersonalInfo: PersonalInfo = {
  fullName: "",
  dateOfBirth: "",
  nationality: "",
  gender: undefined,
  phoneNumber: undefined,
};

const defaultState = {
  currentStep: "splash" as OnboardingStep,
  completedSteps: [],
  accountType: null as AccountType,
  experience: null as ExperienceLevel | null,
  riskProfile: "medium" as RiskProfile,
  personalInfo: defaultPersonalInfo,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...defaultState,
  setStep: (step) => set({ currentStep: step }),
  markCompleted: (step) =>
    set((state) => ({
      completedSteps: state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step],
    })),
  setAccountType: (accountType) => set({ accountType }),
  setExperience: (experience) => set({ experience }),
  setRiskProfile: (riskProfile) => set({ riskProfile }),
  setPersonalInfo: (info) =>
    set((state) => ({ personalInfo: { ...state.personalInfo, ...info } })),
  reset: () => set({ ...defaultState, personalInfo: defaultPersonalInfo }),
}));
