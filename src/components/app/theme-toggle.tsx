"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // Reads the class the blocking script in the root layout already
    // applied — can't be computed at render time without a hydration
    // mismatch, since the server never knows the stored preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("dpcc-theme", next ? "light" : "dark");
    } catch {
      // private browsing / storage disabled — theme just won't persist
    }
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggle}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {isLight ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
    </Button>
  );
}
