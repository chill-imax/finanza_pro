/**
 * driveBackupService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de respaldo/restauración usando Google Drive appDataFolder.
 *
 * DEPENDENCIAS:
 *   npm install @codetrix-studio/capacitor-google-auth
 *
 * CÓMO USAR en tus botones existentes:
 *   import { backupToDrive, restoreFromDrive, signOutGoogle } from './services/driveBackupService';
 *
 *   // Botón "Respaldar ahora"
 *   <button onClick={backupToDrive}>Respaldar ahora</button>
 *
 *   // Botón "Restaurar datos"
 *   <button onClick={restoreFromDrive}>Restaurar datos</button>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

// ─── Constantes ───────────────────────────────────────────────────────────────

const BACKUP_FILENAME = "finanzapro_backup.json";
const DRIVE_API_FILES = "https://www.googleapis.com/drive/v3/files";
const DRIVE_API_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
}

interface BackupResult {
  success: boolean;
  message: string;
  timestamp?: string;
}

// ─── Autenticación ────────────────────────────────────────────────────────────

/**
 * Inicia sesión con Google y retorna el accessToken OAuth 2.0.
 * Si el usuario ya tiene sesión activa, la reutiliza silenciosamente.
 */
async function getAccessToken(): Promise<string> {
  try {
    // Intenta refrescar la sesión existente sin mostrar el popup
    const user = await GoogleAuth.refresh();
    if (user?.accessToken) {
      return user.accessToken;
    }
  } catch {
    // No hay sesión previa, necesitamos login explícito
  }

  // Login explícito (muestra la pantalla de selección de cuenta de Google)
  const user = await GoogleAuth.signIn();

  if (!user?.authentication?.accessToken) {
    throw new Error(
      "No se pudo obtener el token de acceso. Intenta iniciar sesión de nuevo.",
    );
  }

  // Guardar email para mostrarlo en la UI de Ajustes
  if (user.email) {
    localStorage.setItem("google_connected_email", user.email);
  }

  return user.authentication.accessToken;
}

/**
 * Cierra la sesión de Google. Llama esto si quieres un botón "Desconectar cuenta".
 */
export async function signOutGoogle(): Promise<void> {
  await GoogleAuth.signOut();
  localStorage.removeItem("google_connected_email");
}

// ─── Helpers de Drive REST API ────────────────────────────────────────────────

/**
 * Busca el archivo de respaldo en la carpeta appDataFolder del Drive del usuario.
 * Retorna el objeto de archivo si existe, o null si no hay respaldo previo.
 */
async function findBackupFile(accessToken: string): Promise<DriveFile | null> {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name = '${BACKUP_FILENAME}'`,
    fields: "files(id, name)",
    pageSize: "1",
  });

  const response = await fetch(`${DRIVE_API_FILES}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Error buscando respaldo: ${error.error?.message ?? response.statusText}`,
    );
  }

  const data = await response.json();
  return data.files?.[0] ?? null;
}

/**
 * Sube un nuevo archivo JSON a la carpeta appDataFolder (primera vez).
 */
async function createBackupFile(
  accessToken: string,
  jsonContent: string,
): Promise<string> {
  const metadata = {
    name: BACKUP_FILENAME,
    parents: ["appDataFolder"],
    mimeType: "application/json",
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  form.append("file", new Blob([jsonContent], { type: "application/json" }));

  const response = await fetch(
    `${DRIVE_API_UPLOAD}?uploadType=multipart&fields=id`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Error creando respaldo: ${error.error?.message ?? response.statusText}`,
    );
  }

  const data = await response.json();
  return data.id;
}

/**
 * Actualiza (sobreescribe) un archivo existente en Drive conservando el mismo ID.
 */
async function updateBackupFile(
  accessToken: string,
  fileId: string,
  jsonContent: string,
): Promise<void> {
  const response = await fetch(
    `${DRIVE_API_UPLOAD}/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: jsonContent,
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Error actualizando respaldo: ${
        error.error?.message ?? response.statusText
      }`,
    );
  }
}

/**
 * Descarga el contenido de un archivo de Drive por su ID.
 */
async function downloadBackupFile(
  accessToken: string,
  fileId: string,
): Promise<string> {
  const response = await fetch(`${DRIVE_API_FILES}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Error descargando respaldo: ${
        error.error?.message ?? response.statusText
      }`,
    );
  }

  return response.text();
}

// ─── Lógica de localStorage ───────────────────────────────────────────────────

/**
 * Claves de localStorage que pertenecen a FinanzaPro.
 * Ajusta esta lista si usas claves diferentes.
 */
const FINANZAPRO_KEYS = [
  "accounts",
  "transactions",
  "debts",
  "categories",
  "recurringTransactions",
  "streakCount",
  "lastLogDate",
  "userCountry",
  "mainCurrency",
  "onboardingCompleted",
  "setupCompleted",
];

/**
 * Lee todas las claves de FinanzaPro del localStorage y las convierte en un objeto JSON.
 */
function readLocalStorage(): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const key of FINANZAPRO_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        // Si no es JSON válido, guarda como string puro
        data[key] = value;
      }
    }
  }

  return data;
}

/**
 * Escribe un objeto de datos en el localStorage, sobreescribiendo las claves existentes.
 */
function writeLocalStorage(data: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * RESPALDAR: Lee el localStorage, lo convierte en JSON y lo sube a Drive.
 *
 * Flujo:
 *   1. Login con Google → obtiene accessToken
 *   2. Busca si ya existe un archivo de respaldo
 *   3. Si existe → actualiza. Si no → crea nuevo.
 *   4. Retorna resultado con timestamp
 *
 * @returns BackupResult con success, message y timestamp
 */
export async function backupToDrive(): Promise<BackupResult> {
  let accessToken: string;

  try {
    accessToken = await getAccessToken();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error de autenticación con Google.";
    return { success: false, message };
  }

  try {
    const appData = readLocalStorage();
    const timestamp = new Date().toISOString();

    const backupPayload = {
      _meta: {
        app: "FinanzaPro",
        version: "2.0",
        createdAt: timestamp,
        deviceInfo: navigator.userAgent,
      },
      data: appData,
    };

    const jsonContent = JSON.stringify(backupPayload, null, 2);
    const existingFile = await findBackupFile(accessToken);

    if (existingFile) {
      await updateBackupFile(accessToken, existingFile.id, jsonContent);
    } else {
      await createBackupFile(accessToken, jsonContent);
    }

    return {
      success: true,
      message: "Respaldo guardado en Google Drive correctamente.",
      timestamp,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido al respaldar.";
    return { success: false, message };
  }
}

/**
 * RESTAURAR: Busca el archivo en Drive, lo descarga y sobreescribe el localStorage.
 *
 * Flujo:
 *   1. Login con Google → obtiene accessToken
 *   2. Busca el archivo de respaldo en appDataFolder
 *   3. Descarga el contenido JSON
 *   4. Sobreescribe el localStorage con los datos
 *   5. Recarga la app para aplicar los cambios
 *
 * ⚠️  IMPORTANTE: Llama a window.location.reload() al final para que React
 *     vuelva a leer el localStorage desde cero.
 *
 * @returns BackupResult con success y message
 */
export async function restoreFromDrive(): Promise<BackupResult> {
  let accessToken: string;

  try {
    accessToken = await getAccessToken();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error de autenticación con Google.";
    return { success: false, message };
  }

  try {
    const existingFile = await findBackupFile(accessToken);

    if (!existingFile) {
      return {
        success: false,
        message:
          "No se encontró ningún respaldo en tu Google Drive. Crea un respaldo primero.",
      };
    }

    const jsonContent = await downloadBackupFile(accessToken, existingFile.id);
    const backupPayload = JSON.parse(jsonContent);

    // Valida que el archivo sea un respaldo de FinanzaPro
    if (backupPayload._meta?.app !== "FinanzaPro" || !backupPayload.data) {
      return {
        success: false,
        message: "El archivo de respaldo está corrupto o no es compatible.",
      };
    }

    writeLocalStorage(backupPayload.data as Record<string, unknown>);

    const createdAt = backupPayload._meta?.createdAt
      ? new Date(backupPayload._meta.createdAt).toLocaleString("es-ES")
      : "fecha desconocida";

    return {
      success: true,
      message: `Datos restaurados desde el respaldo del ${createdAt}. La app se recargará.`,
      timestamp: backupPayload._meta?.createdAt,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido al restaurar.";
    return { success: false, message };
  }
}
