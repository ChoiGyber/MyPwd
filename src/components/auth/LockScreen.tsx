import { useState, useEffect } from "react";
import { useLang } from "../../i18n/LangContext";

interface LockScreenProps {
  onUnlock: (password: string) => Promise<void>;
  onUnlockWithPin: (pin: string) => Promise<void>;
  error: string | null;
  onClearError: () => void;
  hasPinSetup?: boolean;
}

export default function LockScreen({ onUnlock, onUnlockWithPin, error, onClearError, hasPinSetup = false }: LockScreenProps) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usePin, setUsePin] = useState(hasPinSetup);
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync usePin when hasPinSetup changes (async load)
  useEffect(() => {
    if (hasPinSetup) {
      setUsePin(true);
    }
  }, [hasPinSetup]);

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    try {
      setIsSubmitting(true);
      await onUnlock(password);
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = async (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    onClearError();

    const newDigits = [...pinDigits];
    newDigits[index] = value.slice(-1);
    setPinDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`pin-${index + 1}`);
      next?.focus();
    }

    // Auto-submit when all filled (4-6 digits)
    const fullPin = newDigits.join("");
    if (fullPin.length >= 4 && newDigits.slice(0, fullPin.length).every((d) => d !== "")) {
      const filledCount = newDigits.filter((d) => d !== "").length;
      if (filledCount >= 4 && (index === filledCount - 1)) {
        try {
          setIsSubmitting(true);
          await onUnlockWithPin(fullPin);
        } catch {
          setPinDigits(["", "", "", "", "", ""]);
          document.getElementById("pin-0")?.focus();
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      const prev = document.getElementById(`pin-${index - 1}`);
      prev?.focus();
      const newDigits = [...pinDigits];
      newDigits[index - 1] = "";
      setPinDigits(newDigits);
    }
    if (e.key === "Enter") {
      const fullPin = pinDigits.join("");
      if (fullPin.length >= 4) {
        setIsSubmitting(true);
        onUnlockWithPin(fullPin)
          .catch(() => {
            setPinDigits(["", "", "", "", "", ""]);
            document.getElementById("pin-0")?.focus();
          })
          .finally(() => setIsSubmitting(false));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-text mb-2">{t.appName}</h1>
        <p className="text-text-muted mb-8">{t.enterPassword}</p>

        {!usePin ? (
          <form onSubmit={handlePasswordUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  onClearError();
                }}
                className="w-full px-4 py-3 bg-surface-light rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                placeholder={t.masterPassword}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? t.loading : t.unlock}
            </button>

            <button
              type="button"
              onClick={() => {
                setUsePin(true);
                onClearError();
              }}
              className="text-sm text-text-muted hover:text-primary-light transition-all duration-200"
            >
              {t.unlockWithPin}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {pinDigits.map((digit, i) => (
                <input
                  key={i}
                  id={`pin-${i}`}
                  type="password"
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className="w-12 h-14 bg-surface-light rounded-lg text-text text-center text-xl font-bold border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                  maxLength={1}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <button
              type="button"
              onClick={() => {
                setUsePin(false);
                onClearError();
                setPinDigits(["", "", "", "", "", ""]);
              }}
              className="text-sm text-text-muted hover:text-primary-light transition-all duration-200"
            >
              {t.unlockWithPassword}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
