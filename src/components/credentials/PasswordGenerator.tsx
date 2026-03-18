import { useState, useCallback, useEffect } from "react";
import { useLang } from "../../i18n/LangContext";
import type { GeneratorOptions } from "../../types/credential";

interface PasswordGeneratorProps {
  onSelect: (password: string, username?: string) => void;
}

function generatePassword(options: GeneratorOptions): string {
  let chars = "";
  if (options.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.numbers) chars += "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (chars === "") chars = "abcdefghijklmnopqrstuvwxyz";

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);

  return Array.from(array, (v) => chars[v % chars.length]).join("");
}

function generateUsername(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  const first = "abcdefghijklmnopqrstuvwxyz";
  const firstChar = first[array[0] % first.length];
  return firstChar + Array.from(array.slice(1), (v) => chars[v % chars.length]).join("");
}

export default function PasswordGenerator({ onSelect }: PasswordGeneratorProps) {
  const { t } = useLang();

  function getStrength(pw: string): { label: string; color: string; percent: number } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (pw.length >= 16) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    if (score <= 2) return { label: t.weak, color: "bg-danger", percent: 25 };
    if (score <= 3) return { label: t.fair, color: "bg-warning", percent: 50 };
    if (score <= 4) return { label: t.strong, color: "bg-success", percent: 75 };
    return { label: t.veryStrong, color: "bg-success", percent: 100 };
  }

  const [tab, setTab] = useState<"password" | "both">("password");
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameLength, setUsernameLength] = useState(10);
  const [copied, setCopied] = useState<string | null>(null);

  const regeneratePassword = useCallback(() => {
    setPassword(generatePassword(options));
    setCopied(null);
  }, [options]);

  const regenerateUsername = useCallback(() => {
    setUsername(generateUsername(usernameLength));
    setCopied(null);
  }, [usernameLength]);

  useEffect(() => {
    regeneratePassword();
  }, [regeneratePassword]);

  useEffect(() => {
    if (tab === "both") {
      regenerateUsername();
    }
  }, [tab, regenerateUsername]);

  const strength = getStrength(password);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex bg-surface rounded-lg p-1 gap-1">
        <button
          onClick={() => setTab("password")}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            tab === "password" ? "bg-primary text-white" : "text-text-muted hover:text-text"
          }`}
        >
          {t.passwordOnly}
        </button>
        <button
          onClick={() => setTab("both")}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            tab === "both" ? "bg-primary text-white" : "text-text-muted hover:text-text"
          }`}
        >
          {t.idAndPassword}
        </button>
      </div>

      {/* Username generator (when both mode) */}
      {tab === "both" && (
        <div>
          <label className="block text-xs text-text-muted mb-1">{t.generatedId}</label>
          <div className="bg-surface rounded-lg p-3 flex items-center gap-2">
            <code className="flex-1 text-text text-sm font-mono break-all select-all">
              {username}
            </code>
            <button
              onClick={() => handleCopy(username, "username")}
              className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200 shrink-0"
              title={t.copy}
            >
              {copied === "username" ? "✅" : "📋"}
            </button>
            <button
              onClick={regenerateUsername}
              className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200 shrink-0"
              title={t.regenerate}
            >
              🔄
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 mb-1">
            <label className="text-xs text-text-muted">{t.idLength}</label>
            <span className="text-xs text-text font-medium">{usernameLength}</span>
          </div>
          <input
            type="range"
            min={6}
            max={20}
            value={usernameLength}
            onChange={(e) => setUsernameLength(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      )}

      {/* Generated password */}
      <div>
        <label className="block text-xs text-text-muted mb-1">{t.generatedPassword}</label>
        <div className="bg-surface rounded-lg p-3 flex items-center gap-2">
          <code className="flex-1 text-text text-sm font-mono break-all select-all">
            {password}
          </code>
          <button
            onClick={() => handleCopy(password, "password")}
            className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200 shrink-0"
            title={t.copy}
          >
            {copied === "password" ? "✅" : "📋"}
          </button>
          <button
            onClick={regeneratePassword}
            className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200 shrink-0"
            title={t.regenerate}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Strength bar */}
      <div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
            style={{ width: `${strength.percent}%` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1">{strength.label}</p>
      </div>

      {/* Length slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-text-muted">{t.passwordLength}</label>
          <span className="text-sm text-text font-medium">{options.length}</span>
        </div>
        <input
          type="range"
          min={8}
          max={64}
          value={options.length}
          onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      {/* Toggle options */}
      <div className="grid grid-cols-2 gap-2">
        {([
          ["uppercase", "A-Z"],
          ["lowercase", "a-z"],
          ["numbers", "0-9"],
          ["symbols", "!@#"],
        ] as const).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center gap-2 p-2 rounded-lg bg-surface hover:bg-surface-lighter cursor-pointer transition-all duration-200"
          >
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
              className="accent-primary"
            />
            <span className="text-sm text-text">{label}</span>
          </label>
        ))}
      </div>

      {/* Use button */}
      <button
        onClick={() => onSelect(password, tab === "both" ? username : undefined)}
        className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all duration-200"
      >
        {tab === "both" ? t.applyIdAndPassword : t.applyPassword}
      </button>
    </div>
  );
}
