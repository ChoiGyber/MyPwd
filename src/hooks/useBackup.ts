import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface BackupEntry {
  file_name: string;
  file_path: string;
  created_at: string;
  size_bytes: number;
}

export function useBackup() {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadBackups = useCallback(async () => {
    try {
      const result = await invoke<BackupEntry[]>("list_backups");
      setBackups(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const createBackup = useCallback(async (password: string) => {
    try {
      setIsCreating(true);
      setError(null);
      setMessage(null);
      await invoke("create_backup", { password });
      setMessage("Backup created successfully.");
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [loadBackups]);

  const restoreBackup = useCallback(async (filePath: string, password: string) => {
    try {
      setIsRestoring(true);
      setError(null);
      setMessage(null);
      await invoke("restore_backup", { filePath, password });
      setMessage("Backup restored successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  return {
    backups,
    isCreating,
    isRestoring,
    error,
    message,
    loadBackups,
    createBackup,
    restoreBackup,
    clearMessages,
  };
}
