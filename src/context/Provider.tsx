"use client";

import { SubsProvider } from "@/hooks/useSubscription";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
      <QueryClientProvider client={queryClient}>
        <SubsProvider>
        {/* <ThemeProvider> */}
                {children}
        </SubsProvider>
      </QueryClientProvider>
  );
}