/**
 * useNotifications.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook centralizado para todas las notificaciones locales de FinanzaPro.
 *
 * PREREQUISITOS (ya instalados según capacitor.config.ts):
 *   npm install @capacitor/local-notifications
 *   npx cap sync android
 *
 * TIPOS DE NOTIFICACIONES:
 *   1. Recordatorio diario de registro (streakReminder) — cada día a las 8pm
 *   2. Recordatorio de meta próxima a vencer (goalReminder) — X días antes
 *   3. Notificación de racha en riesgo — si no registró nada antes de las 8pm
 *
 * USO:
 *   const { requestPermission, scheduleDailyReminder,
 *           scheduleGoalReminder, cancelGoalReminder } = useNotifications();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback } from "react";
import { Goal } from "../types";

// ── Guard: importación lazy del plugin para que no explote en web/dev ──────
// LocalNotifications solo existe en Android/iOS (Capacitor).
// En el navegador el import no falla pero los métodos lanzan excepciones,
// por eso envolvemos TODO con try/catch.
let LocalNotifications: any = null;
try {
  // Importación dinámica síncrona — funciona porque Vite hace tree-shaking
  // y en web simplemente retorna undefined silenciosamente.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LocalNotifications =
    require("@capacitor/local-notifications").LocalNotifications;
} catch {
  LocalNotifications = null;
}

// IDs fijos para notificaciones persistentes (no son IDs de goals)
const NOTIF_IDS = {
  DAILY_REMINDER: 1000,
  STREAK_RISK: 1001,
} as const;

// ── Permisos ───────────────────────────────────────────────────────────────

/** Pide permiso de notificaciones. Retorna false en web (dev). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!LocalNotifications) return false;
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted";
  } catch {
    return false;
  }
}

// ── Hook principal ─────────────────────────────────────────────────────────

export function useNotifications() {
  /**
   * Crea los canales de notificación necesarios para Android 8+.
   * Sin esto, las notificaciones se descartan silenciosamente en Android 12+.
   * Es seguro llamarlo múltiples veces (idempotente).
   */
  const createChannels = useCallback(async () => {
    if (!LocalNotifications) return;
    try {
      await LocalNotifications.createChannel({
        id: "finanzapro_general",
        name: "FinanzaPro — Recordatorios",
        description: "Recordatorio diario para registrar movimientos",
        importance: 4, // HIGH — aparece como heads-up
        visibility: 1, // PUBLIC
        vibration: true,
        lights: true,
      });
      await LocalNotifications.createChannel({
        id: "finanzapro_goals",
        name: "FinanzaPro — Metas",
        description: "Recordatorios de metas próximas a vencer",
        importance: 3, // DEFAULT
        visibility: 1,
        vibration: false,
      });
    } catch {
      // Silencioso en web/dev
    }
  }, []);

  /**
   * Programa el recordatorio diario a la hora indicada (hour: 0-23, minute: 0-59).
   * Si no se pasan parámetros, usa la hora guardada en localStorage (o 20:00 por defecto).
   * Es idempotente: cancela el anterior antes de reprogramar.
   */
  const scheduleDailyReminder = useCallback(
    async (hour?: number, minute?: number) => {
      if (!LocalNotifications) return;
      try {
        // Crear canales primero (requerido en Android 8+)
        await createChannels();

        // Leer hora guardada si no se pasan parámetros
        const savedTime =
          localStorage.getItem("notif_reminder_time") || "20:00";
        const [savedHour, savedMin] = savedTime.split(":").map(Number);
        const h = hour ?? savedHour;
        const m = minute ?? savedMin;

        await LocalNotifications.cancel({
          notifications: [{ id: NOTIF_IDS.DAILY_REMINDER }],
        });

        const fireAt = new Date();
        fireAt.setHours(h, m, 0, 0);
        // Si la hora ya pasó hoy, programa para mañana
        if (fireAt.getTime() < Date.now()) {
          fireAt.setDate(fireAt.getDate() + 1);
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              id: NOTIF_IDS.DAILY_REMINDER,
              title: "FinanzaPro 💰",
              body: "¿Ya registraste tus movimientos de hoy? ¡Cuida tu racha!",
              schedule: {
                at: fireAt,
                repeats: true,
                every: "day",
              },
              smallIcon: "ic_stat_icon_config_sample",
              channelId: "finanzapro_general",
            },
          ],
        });
      } catch {
        // Silencioso en web/dev
      }
    },
    [createChannels],
  );

  /**
   * Cancela el recordatorio diario (útil si el usuario lo desactiva desde ajustes).
   */
  const cancelDailyReminder = useCallback(async () => {
    if (!LocalNotifications) return;
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: NOTIF_IDS.DAILY_REMINDER }],
      });
    } catch {}
  }, []);

  /**
   * Programa una notificación recordatoria para una meta específica.
   * Se dispara `goal.reminderDaysBefore` días antes de `goal.targetDate`.
   *
   * Retorna el notificationId usado (para guardarlo en el goal).
   * Retorna null si la fecha ya pasó o no hay targetDate.
   */
  const scheduleGoalReminder = useCallback(
    async (goal: Goal): Promise<number | null> => {
      if (!LocalNotifications || !goal.targetDate || !goal.reminderDaysBefore)
        return null;
      try {
        // El ID de la notif de la meta se deriva del hash del goalId
        // para que sea numérico y único (LocalNotifications requiere number)
        const notifId = (Math.abs(hashCode(goal.id)) % 900000) + 100; // rango 100–900100

        // Cancela el anterior si existía
        await LocalNotifications.cancel({
          notifications: [{ id: notifId }],
        });

        const targetDate = new Date(goal.targetDate);
        const fireAt = new Date(targetDate);
        fireAt.setDate(fireAt.getDate() - goal.reminderDaysBefore);
        fireAt.setHours(9, 0, 0, 0); // 9:00 AM

        if (fireAt.getTime() <= Date.now()) return null; // fecha pasada

        const daysLabel =
          goal.reminderDaysBefore === 1
            ? "mañana"
            : `en ${goal.reminderDaysBefore} días`;

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: `Meta: ${goal.name} 🎯`,
              body: `Tu fecha objetivo vence ${daysLabel}. ¡Revisa cuánto te falta!`,
              schedule: { at: fireAt },
              smallIcon: "ic_stat_icon_config_sample",
              channelId: "finanzapro_goals",
            },
          ],
        });

        return notifId;
      } catch {
        return null;
      }
    },
    [],
  );

  /**
   * Cancela la notificación de una meta por su notificationId guardado.
   */
  const cancelGoalReminder = useCallback(async (notifId: number) => {
    if (!LocalNotifications) return;
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      });
    } catch {}
  }, []);

  /**
   * Envía una notificación inmediata de celebración cuando se completa una meta.
   */
  const notifyGoalCompleted = useCallback(async (goalName: string) => {
    if (!LocalNotifications) return;
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIF_IDS.STREAK_RISK,
            title: "¡Meta alcanzada! 🎉",
            body: `Completaste "${goalName}". ¡Felicidades, sigue así!`,
            schedule: { at: new Date(Date.now() + 500) }, // casi inmediata
            smallIcon: "ic_stat_icon_config_sample",
            channelId: "finanzapro_general",
          },
        ],
      });
    } catch {}
  }, []);

  return {
    createChannels,
    scheduleDailyReminder,
    cancelDailyReminder,
    scheduleGoalReminder,
    cancelGoalReminder,
    notifyGoalCompleted,
  };
}

// ── Utilidades ─────────────────────────────────────────────────────────────

/** Convierte un string en un número entero determinista (Java-style hashCode) */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // convierte a int32
  }
  return hash;
}
