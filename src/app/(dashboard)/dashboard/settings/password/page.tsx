"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to security page where password changes are handled
    router.replace("/dashboard/settings/security");
  }, [router]);

  return null;
}
