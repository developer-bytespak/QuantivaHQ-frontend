"use client";

import { ProfileSettings } from "@/components/profile/profile-settings";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <ProfileSettings onBack={() => router.push("/dashboard/profile")} />
  );
}

