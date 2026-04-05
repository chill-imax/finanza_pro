import React, { useState, useEffect } from "react";
import {
  CloudUpload,
  CloudDownload,
  LogOut,
  PlayCircle,
  ShieldCheck,
  Info,
  Bell,
  BellOff,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";

// ── Props de la vista ──────────────────────────────────────────────────────

interface Props {
  isBackingUp: boolean;
  isRestoring: boolean;
  onBackup: () => void;
  onRestore: () => void;
  onSignOut: () => void;
  onResetTour: () => void;
  onSaveReminderTime: (hour: number, minute: number, enabled: boolean) => void;
}

// ── Fila de ajuste genérica ────────────────────────────────────────────────

interface SettingRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  actionLabel: string;
  actionStyle?: "primary" | "danger" | "default";
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onClick: () => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconBg,
  label,
  description,
  actionLabel,
  actionStyle = "default",
  disabled,
  loading,
  loadingLabel,
  onClick,
}) => {
  const actionColors = {
    primary: "bg-blue-600 text-white active:bg-blue-700",
    danger: "bg-red-50 text-red-600 border border-red-200 active:bg-red-100",
    default: "bg-slate-100 text-slate-700 active:bg-slate-200",
  };

  return (
    <div className="flex items-center gap-4 py-4 px-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 leading-tight">
          {label}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug">
          {description}
        </p>
      </div>
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${actionColors[actionStyle]}`}
      >
        {loading ? loadingLabel : actionLabel}
      </button>
    </div>
  );
};

// ── Sección de notificaciones ──────────────────────────────────────────────

interface NotifSectionProps {
  onSave: (hour: number, minute: number, enabled: boolean) => void;
}

const NotificationSection: React.FC<NotifSectionProps> = ({ onSave }) => {
  const savedTime = localStorage.getItem("notif_reminder_time") || "20:00";
  const savedEnabled =
    localStorage.getItem("notif_reminder_enabled") !== "false";

  const [enabled, setEnabled] = useState(savedEnabled);
  const [time, setTime] = useState(savedTime);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const [h, m] = time.split(":").map(Number);
    localStorage.setItem("notif_reminder_time", time);
    localStorage.setItem("notif_reminder_enabled", String(enabled));
    onSave(h, m, enabled);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Toggle activar / desactivar */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          {enabled ? (
            <Bell className="w-5 h-5 text-amber-600" />
          ) : (
            <BellOff className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">
            Recordatorio diario
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {enabled ? "Activo" : "Desactivado"}
          </p>
        </div>
        <button
          onClick={() => setEnabled((p) => !p)}
          className={
            "w-12 h-6 rounded-full relative transition-colors shrink-0 " +
            (enabled ? "bg-amber-500" : "bg-slate-200")
          }
        >
          <div
            className={
              "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all " +
              (enabled ? "left-6" : "left-0.5")
            }
          />
        </button>
      </div>

      {/* Selector de hora */}
      <div
        className={
          "px-5 py-4 transition-opacity " +
          (enabled ? "opacity-100" : "opacity-40 pointer-events-none")
        }
      >
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
          Hora del recordatorio
        </label>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-base outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={handleSave}
            className={
              "px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 " +
              (saved
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-500 text-white")
            }
          >
            {saved ? "¡Guardado!" : "Guardar"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Recibirás una notificación cada día a esta hora para registrar tus
          movimientos.
        </p>
      </div>
    </div>
  );
};

// ── Tarjeta de estado Google Drive ────────────────────────────────────────

interface GoogleStatusCardProps {
  isBackingUp: boolean;
  isRestoring: boolean;
  onBackup: () => void;
  onRestore: () => void;
  onSignOut: () => void;
}

const GoogleStatusCard: React.FC<GoogleStatusCardProps> = ({
  isBackingUp,
  isRestoring,
  onBackup,
  onRestore,
  onSignOut,
}) => {
  // Leemos el email guardado tras el último respaldo exitoso
  const [connectedEmail, setConnectedEmail] = useState<string | null>(() =>
    localStorage.getItem("google_connected_email"),
  );

  const isConnected = !!connectedEmail;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-0">
      {/* Info de privacidad */}
      <div className="bg-blue-50 border-b border-blue-100 p-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Tus datos se guardan en la{" "}
          <strong>carpeta privada de FinanzaPro</strong> en tu Google Drive.
          Solo tú puedes verlos.
        </p>
      </div>

      {/* Estado de conexión */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isConnected ? "bg-emerald-100" : "bg-slate-100"
          }`}
        >
          {isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {isConnected ? "Google conectado" : "No conectado"}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {isConnected
              ? connectedEmail!
              : "Toca 'Respaldar' para iniciar sesión con Google"}
          </p>
        </div>
        {isConnected && (
          <button
            onClick={() => {
              onSignOut();
              localStorage.removeItem("google_connected_email");
              setConnectedEmail(null);
            }}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold active:bg-slate-200"
          >
            <LogOut className="w-3 h-3" /> Salir
          </button>
        )}
      </div>

      {/* Paso 1: Respaldar */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <CloudUpload className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">Respaldar ahora</p>
          <p className="text-xs text-slate-400">
            {isConnected
              ? "Actualiza tu copia en Google Drive"
              : "Se pedirá tu cuenta de Google"}
          </p>
        </div>
        <button
          onClick={onBackup}
          disabled={isBackingUp}
          className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white disabled:opacity-50 active:scale-95 transition-all"
        >
          {isBackingUp ? "Subiendo..." : "Respaldar"}
        </button>
      </div>

      {/* Paso 2: Restaurar — solo visible si hay conexión previa */}
      {isConnected ? (
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CloudDownload className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Restaurar datos</p>
            <p className="text-xs text-slate-400">
              Reemplaza los datos actuales con tu último respaldo
            </p>
          </div>
          <button
            onClick={onRestore}
            disabled={isRestoring}
            className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isRestoring ? "Restaurando..." : "Restaurar"}
          </button>
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="text-xs text-slate-400 text-center">
            Haz un respaldo primero para habilitar la restauración
          </p>
        </div>
      )}
    </div>
  );
};

// ── Vista principal ────────────────────────────────────────────────────────

export const SettingsView: React.FC<Props> = ({
  isBackingUp,
  isRestoring,
  onBackup,
  onRestore,
  onSignOut,
  onResetTour,
  onSaveReminderTime,
}) => {
  return (
    <div className="space-y-6 pb-24">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Ajustes</h2>
        <p className="text-sm text-slate-400 mt-1">
          Administra tu cuenta y tus datos
        </p>
      </div>

      {/* ── Notificaciones ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Bell className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Notificaciones
          </p>
        </div>
        <NotificationSection onSave={onSaveReminderTime} />
      </section>

      {/* ── Respaldo en la nube ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Respaldo en la nube
          </p>
        </div>

        {/* Tarjeta de estado de conexión */}
        <GoogleStatusCard
          isBackingUp={isBackingUp}
          isRestoring={isRestoring}
          onBackup={onBackup}
          onRestore={onRestore}
          onSignOut={onSignOut}
        />
      </section>

      {/* ── Tutorial ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <PlayCircle className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Tutorial
          </p>
        </div>
        <SettingRow
          icon={<PlayCircle className="w-5 h-5 text-violet-600" />}
          iconBg="bg-violet-100"
          label="Ver tutorial de nuevo"
          description="Recorre la guía interactiva desde el principio"
          actionLabel="Iniciar"
          actionStyle="default"
          onClick={onResetTour}
        />
      </section>

      {/* ── Acerca de ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Info className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Acerca de
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div>
              <p className="text-sm font-bold text-slate-800">FinanzaPro</p>
              <p className="text-xs text-slate-400">Versión 2.1</p>
            </div>
            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
              Actualizado
            </span>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Tus datos viven{" "}
              <strong className="text-slate-600">solo en tu dispositivo</strong>{" "}
              y en tu propio Google Drive. No tenemos acceso a tu información
              financiera.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
