import { useCallback, useState } from "react";

/** Accordion state for portfolio build-phase sections — one phase open by default. */
export function usePhaseAccordion(initialOpen: number[] = [0]) {
  const [openPhases, setOpenPhases] = useState<Set<number>>(
    () => new Set(initialOpen),
  );

  const togglePhase = useCallback((index: number) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return { openPhases, togglePhase };
}
