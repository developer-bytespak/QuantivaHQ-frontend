import { useState, useCallback, useEffect } from "react";

export function useMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  // Sync state across tabs using storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mobileNavOpen") {
        setIsOpen(e.newValue === "true");
      }
    };

    // Also listen for custom event for same-tab updates
    const handleCustomEvent = (e: CustomEvent) => {
      setIsOpen(e.detail.isOpen);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("mobileNavToggle" as any, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("mobileNavToggle" as any, handleCustomEvent as EventListener);
    };
  }, []);

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
    sessionStorage.setItem("mobileNavOpen", String(open));
    // Dispatch custom event for same-tab communication
    window.dispatchEvent(new CustomEvent("mobileNavToggle", { detail: { isOpen: open } }));
  }, []);

  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  return { isOpen, setOpen, toggle };
}
