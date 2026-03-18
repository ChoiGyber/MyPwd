import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Credential, CredentialInput, Category } from "../types/credential";

export function useCredentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCredentials = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await invoke<Credential[]>("list_credentials", {
        search: searchQuery || null,
        categoryId: selectedCategory,
      });
      if (showFavorites) {
        setCredentials(result.filter((c) => c.favorite));
      } else {
        setCredentials(result);
      }
    } catch (err) {
      console.error("Failed to load credentials:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, showFavorites]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await invoke<Category[]>("list_categories");
      setCategories(result);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const createCredential = useCallback(async (input: CredentialInput) => {
    try {
      await invoke("create_credential", {
        input: {
          category_id: input.category_id,
          title: input.title,
          url: input.url || null,
          username: input.username,
          password: input.password,
          notes: input.notes || null,
          source: "manual",
        },
      });
      await loadCredentials();
    } catch (err) {
      console.error("Failed to create credential:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [loadCredentials]);

  const updateCredential = useCallback(async (id: number, input: CredentialInput) => {
    try {
      await invoke("update_credential", {
        id,
        input: {
          category_id: input.category_id,
          title: input.title,
          url: input.url || null,
          username: input.username,
          password: input.password,
          notes: input.notes || null,
          source: null,
        },
      });
      await loadCredentials();
    } catch (err) {
      console.error("Failed to update credential:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [loadCredentials]);

  const deleteCredential = useCallback(async (id: number) => {
    try {
      await invoke("delete_credential", { id });
      await loadCredentials();
    } catch (err) {
      console.error("Failed to delete credential:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [loadCredentials]);

  const toggleFavorite = useCallback(async (id: number) => {
    try {
      await invoke("toggle_favorite", { id });
      await loadCredentials();
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [loadCredentials]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback: use Tauri clipboard plugin
      try {
        await invoke("plugin:clipboard-manager|write_text", { text });
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    credentials,
    categories,
    isLoading,
    searchQuery,
    selectedCategory,
    showFavorites,
    error,
    setSearchQuery,
    setSelectedCategory,
    setShowFavorites,
    loadCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
    toggleFavorite,
    copyToClipboard,
  };
}
