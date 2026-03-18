import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useAuth() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(false);

  const checkSetup = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await invoke<boolean>("check_is_setup");
      setIsSetup(result);
      if (result) {
        const pinResult = await invoke<boolean>("check_has_pin");
        setHasPin(pinResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsSetup(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupMasterPassword = useCallback(async (password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await invoke("setup_master_password", { password });
      setIsSetup(true);
      setIsUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unlock = useCallback(async (password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await invoke("unlock_with_password", { password });
      setIsUnlocked(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unlockWithPin = useCallback(async (pin: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await invoke("unlock_with_pin", { pin });
      setIsUnlocked(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const lock = useCallback(async () => {
    try {
      await invoke("lock_app");
      setIsUnlocked(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const setPin = useCallback(async (pin: string) => {
    try {
      setError(null);
      await invoke("set_pin", { pin });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  return {
    isSetup,
    isUnlocked,
    isLoading,
    error,
    hasPin,
    checkSetup,
    setupMasterPassword,
    unlock,
    unlockWithPin,
    lock,
    setPin,
    clearError,
  };
}
