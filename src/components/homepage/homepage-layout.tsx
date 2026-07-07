import { ReactNode } from "react";
import { AmbientBackground } from "./ambient-background";

interface HomepageLayoutProps {
  children: ReactNode;
}

export function HomepageLayout({ children }: HomepageLayoutProps) {
  return (
    <div className="relative min-h-screen bg-black">
      <AmbientBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
