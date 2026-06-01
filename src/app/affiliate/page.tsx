"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AffiliateIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/affiliate/dashboard");
  }, [router]);
  return null;
}
