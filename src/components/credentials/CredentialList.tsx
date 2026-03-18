import { useState, useEffect } from "react";
import { useLang } from "../../i18n/LangContext";
import type { Credential } from "../../types/credential";

interface CredentialListProps {
  credentials: Credential[];
  onSelect: (credential: Credential) => void;
  onCopyPassword: (text: string) => Promise<void>;
  onCopyUsername: (text: string) => Promise<void>;
  onToggleFavorite: (id: number) => void;
}

export default function CredentialList({
  credentials,
  onSelect,
  onCopyPassword,
  onCopyUsername,
  onToggleFavorite,
}: CredentialListProps) {
  const { t } = useLang();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  const handleCopy = async (text: string, id: string, copyFn: (t: string) => Promise<void>) => {
    await copyFn(text);
    setCopiedId(id);
  };

  const getCategoryIcon = (categoryId: number | null): string => {
    switch (categoryId) {
      case 1: return "🌐";
      case 2: return "💻";
      case 3: return "🏦";
      case 4: return "📁";
      default: return "🔑";
    }
  };

  if (credentials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">🔑</div>
        <h3 className="text-xl font-semibold text-text mb-2">{t.noCredentials}</h3>
        <p className="text-text-muted">
          {t.noCredentialsDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 grid gap-3">
      {credentials.map((cred) => (
        <div
          key={cred.id}
          className="bg-surface-light rounded-lg border border-surface-lighter hover:border-primary/50 transition-all duration-200 p-4 cursor-pointer group"
          onClick={() => onSelect(cred)}
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-surface-lighter flex items-center justify-center text-lg shrink-0">
              {getCategoryIcon(cred.category_id)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-text font-medium truncate">{cred.title}</h3>
                {cred.source && (
                  <span className="text-xs px-2 py-0.5 bg-surface-lighter rounded text-text-muted shrink-0">
                    {cred.source}
                  </span>
                )}
              </div>
              <p className="text-text-muted text-sm truncate">{cred.username}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(cred.username, `user-${cred.id}`, onCopyUsername);
                }}
                className="p-2 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200"
                title={t.copyUsername}
              >
                {copiedId === `user-${cred.id}` ? "✅" : "👤"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(cred.password, `pwd-${cred.id}`, onCopyPassword);
                }}
                className="p-2 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200"
                title={t.copyPassword}
              >
                {copiedId === `pwd-${cred.id}` ? "✅" : "🔑"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(cred.id);
                }}
                className="p-2 rounded-lg hover:bg-surface-lighter transition-all duration-200"
                title={t.favorites}
              >
                {cred.favorite ? "⭐" : "☆"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
