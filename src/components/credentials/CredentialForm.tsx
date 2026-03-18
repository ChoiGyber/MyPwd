import { useState } from "react";
import { useLang } from "../../i18n/LangContext";
import type { Credential, CredentialInput, Category } from "../../types/credential";
import PasswordGenerator from "./PasswordGenerator";

interface CredentialFormProps {
  credential?: Credential;
  categories: Category[];
  onSave: (input: CredentialInput) => Promise<void>;
  onCancel: () => void;
}

export default function CredentialForm({ credential, categories, onSave, onCancel }: CredentialFormProps) {
  const { t } = useLang();

  const defaultCategories = [
    { id: 1, name: t.websites },
    { id: 2, name: t.applications },
    { id: 3, name: t.finance },
    { id: 4, name: t.other },
  ];

  const [formData, setFormData] = useState<CredentialInput>({
    category_id: credential?.category_id ?? null,
    title: credential?.title ?? "",
    url: credential?.url ?? "",
    username: credential?.username ?? "",
    password: credential?.password ?? "",
    notes: credential?.notes ?? "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryList = categories.length > 0 ? categories : defaultCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError(t.titleRequired);
      return;
    }
    if (!formData.username.trim()) {
      setError(t.usernameRequired);
      return;
    }
    if (!formData.password) {
      setError(t.passwordRequired);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof CredentialInput, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-surface-light rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-text mb-6">
            {credential ? t.editCredential : t.addNewCredential}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm text-text-muted mb-1">{t.title} *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                placeholder="e.g., Google Account"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm text-text-muted mb-1">{t.url}</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => updateField("url", e.target.value)}
                className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                placeholder="https://example.com"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm text-text-muted mb-1">{t.username} *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value)}
                className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                placeholder="user@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-text-muted mb-1">{t.password} *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="w-full px-4 py-2.5 pr-20 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                  placeholder={t.enterPassword}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-text-muted hover:text-text"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGenerator(!showGenerator)}
                    className="p-1 text-text-muted hover:text-text"
                    title="Generate password"
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>

            {/* Inline Password Generator */}
            {showGenerator && (
              <div className="bg-surface rounded-lg p-4 border border-surface-lighter">
                <PasswordGenerator
                  onSelect={(pw, user) => {
                    updateField("password", pw);
                    if (user) {
                      updateField("username", user);
                    }
                    setShowGenerator(false);
                  }}
                />
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm text-text-muted mb-1">{t.category}</label>
              <select
                value={formData.category_id ?? ""}
                onChange={(e) => updateField("category_id", e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
              >
                <option value="">{t.none}</option>
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-text-muted mb-1">{t.notes}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200 resize-none"
              />
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 bg-surface-lighter hover:bg-surface text-text-muted rounded-lg font-medium transition-all duration-200"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? t.saving : credential ? t.update : t.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
