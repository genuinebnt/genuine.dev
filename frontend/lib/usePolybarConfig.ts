"use client";

import { useEffect, useState } from "react";
import { defaultPolybarSettings, readPolybarSettings, type PolybarSettings } from "./polybar";

export function usePolybarConfig(): PolybarSettings {
  const [settings, setSettings] = useState<PolybarSettings>(defaultPolybarSettings);

  useEffect(() => {
    setSettings(readPolybarSettings());
    const sync = () => setSettings(readPolybarSettings());
    window.addEventListener("polybar-config-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("polybar-config-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return settings;
}
