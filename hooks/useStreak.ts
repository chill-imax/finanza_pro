import React from "react";
import { useToast } from "../components/ToastProvider";

export function useStreak(
  lastLogDate: string,
  setLastLogDate: (d: string) => void,
  setStreakCount: React.Dispatch<React.SetStateAction<number>>,
) {
  const { showToast } = useToast();

  const updateStreak = () => {
    const today = new Date().toISOString().split("T")[0];
    if (lastLogDate === today) return;
    if (lastLogDate) {
      const diffDays = Math.ceil(
        Math.abs(new Date(today).getTime() - new Date(lastLogDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      setStreakCount((prev) => (diffDays === 1 ? prev + 1 : 1));
    } else {
      setStreakCount(1);
    }
    setLastLogDate(today);
  };

  const skipLogDay = () => {
    updateStreak();
    showToast(
      "streak",
      "¡Racha mantenida! 🔥",
      "Marcaste el día sin movimientos.",
    );
  };

  return { updateStreak, skipLogDay };
}
