"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/super/admin/users");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[--color-background]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
    </div>
  );
}
