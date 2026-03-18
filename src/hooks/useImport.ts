import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ImportedCredential, DuplicateInfo, BrowserInfo } from "../types/import";

export type ImportStep = "method" | "source" | "preview" | "duplicates" | "complete";

export function useImport() {
  const [importedItems, setImportedItems] = useState<ImportedCredential[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [browserList, setBrowserList] = useState<BrowserInfo[]>([]);
  const [importStep, setImportStep] = useState<ImportStep>("method");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importCount, setImportCount] = useState(0);

  const detectBrowsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const browsers = await invoke<BrowserInfo[]>("detect_browsers");
      setBrowserList(browsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importCsv = useCallback(async (filePath: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await invoke<ImportedCredential[]>("import_csv", { filePath });
      setImportedItems(items);
      setImportStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importFromBrowser = useCallback(async (browserType: string, profilePath: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await invoke<ImportedCredential[]>("import_from_browser", {
        browserType,
        profilePath,
      });
      setImportedItems(items);
      setImportStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkDuplicates = useCallback(async (items: ImportedCredential[]) => {
    try {
      setIsLoading(true);
      const result = await invoke<DuplicateInfo[]>("check_duplicates", { items });
      setDuplicates(result);
      const hasConflicts = result.some((d) => d.status === "conflict");
      setImportStep(hasConflicts ? "duplicates" : "complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveImported = useCallback(async (items: ImportedCredential[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const count = await invoke<number>("save_imported_credentials", { items });
      setImportCount(count);
      setImportStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setImportedItems([]);
    setDuplicates([]);
    setImportStep("method");
    setError(null);
    setImportCount(0);
  }, []);

  return {
    importedItems,
    duplicates,
    browserList,
    importStep,
    isLoading,
    error,
    importCount,
    setImportStep,
    detectBrowsers,
    importCsv,
    importFromBrowser,
    checkDuplicates,
    saveImported,
    reset,
  };
}
