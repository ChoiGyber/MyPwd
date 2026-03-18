import { useState, useEffect } from "react";
import { useLang } from "../../i18n/LangContext";
import type { Credential } from "../../types/credential";

interface CredentialDetailProps {
  credential: Credential;
  onEdit: (credential: Credential) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
  onCopy: (text: string) => Promise<void>;
}

export default function CredentialDetail({ credential, onEdit, onDelete, onClose, onCopy }: CredentialDetailProps) {
  const { t } = useLang();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (copiedField) {
      const timer = setTimeout(() => setCopiedField(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedField]);

  const handleCopy = async (text: string, field: string) => {
    await onCopy(text);
    setCopiedField(field);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-surface-light rounded-xl shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text">{credential.title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200"
            >
              ✕
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {/* URL */}
            {credential.url && (
              <div>
                <label className="block text-xs text-text-muted mb-1">{t.url}</label>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-text text-sm truncate">{credential.url}</span>
                  <button
                    onClick={() => handleCopy(credential.url!, "url")}
                    className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200 shrink-0"
                  >
                    {copiedField === "url" ? "✅" : "📋"}
                  </button>
                </div>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs text-text-muted mb-1">{t.username}</label>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-text text-sm">{credential.username}</span>
                <button
                  onClick={() => handleCopy(credential.username, "username")}
                  className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200 shrink-0"
                >
                  {copiedField === "username" ? "✅" : "📋"}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-text-muted mb-1">{t.password}</label>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-text text-sm font-mono">
                  {showPassword ? credential.password : "••••••••••••"}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200 shrink-0"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
                <button
                  onClick={() => handleCopy(credential.password, "password")}
                  className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200 shrink-0"
                >
                  {copiedField === "password" ? "✅" : "📋"}
                </button>
              </div>
            </div>

            {/* Notes */}
            {credential.notes && (
              <div>
                <label className="block text-xs text-text-muted mb-1">{t.notes}</label>
                <p className="text-text text-sm whitespace-pre-wrap bg-surface rounded-lg p-3">
                  {credential.notes}
                </p>
              </div>
            )}

            {/* Source */}
            {credential.source && (
              <div>
                <label className="block text-xs text-text-muted mb-1">{t.source}</label>
                <span className="text-xs px-2 py-1 bg-surface-lighter rounded text-text-muted">
                  {credential.source}
                </span>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-2 border-t border-surface-lighter">
              <div className="flex justify-between text-xs text-text-muted">
                <span>{t.created}: {formatDate(credential.created_at)}</span>
                <span>{t.updated}: {formatDate(credential.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onEdit(credential)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200"
            >
              <span>✏️</span> {t.edit}
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface-lighter hover:bg-danger/20 text-danger rounded-lg font-medium transition-all duration-200"
              >
                <span>🗑️</span> {t.delete_}
              </button>
            ) : (
              <button
                onClick={() => onDelete(credential.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-danger hover:bg-danger/80 text-white rounded-lg font-medium transition-all duration-200"
              >
                {t.confirmDelete}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
