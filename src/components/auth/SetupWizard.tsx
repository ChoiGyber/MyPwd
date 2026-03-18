import { useState } from "react";
import { useLang } from "../../i18n/LangContext";

interface SetupWizardProps {
  onSetupComplete: (password: string, pin?: string) => Promise<void>;
}

export default function SetupWizard({ onSetupComplete }: SetupWizardProps) {
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: t.weak, color: "bg-danger", width: "w-1/5" };
    if (score === 2) return { label: t.fair, color: "bg-warning", width: "w-2/5" };
    if (score === 3) return { label: t.good, color: "bg-warning", width: "w-3/5" };
    if (score === 4) return { label: t.strong, color: "bg-success", width: "w-4/5" };
    return { label: t.veryStrong, color: "bg-success", width: "w-full" };
  }

  const strength = getPasswordStrength(password);

  const handlePasswordSubmit = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onSetupComplete(password, pin || undefined);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-light rounded-xl shadow-2xl p-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s <= step ? "bg-primary w-8" : "bg-surface-lighter w-6"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center transition-all duration-200">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-text mb-4">{t.welcome}</h1>
            <p className="text-text-muted mb-6">
              {t.welcomeDesc}
            </p>
            <p className="text-text-muted text-sm mb-8">
              {t.welcomeSetupDesc}
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200"
            >
              {t.getStarted}
            </button>
          </div>
        )}

        {/* Step 2: Master Password */}
        {step === 2 && (
          <div className="transition-all duration-200">
            <h2 className="text-xl font-bold text-text mb-2 text-center">{t.createMasterPassword}</h2>
            <p className="text-text-muted text-sm mb-6 text-center">
              {t.createMasterPasswordDesc}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">{t.masterPassword}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                    placeholder={t.enterMasterPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Strength indicator */}
              {password && (
                <div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`} />
                  </div>
                  <p className={`text-xs mt-1 ${strength.color === "bg-danger" ? "text-danger" : strength.color === "bg-warning" ? "text-warning" : "text-success"}`}>
                    {strength.label}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm text-text-muted mb-1">{t.confirmPassword}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                  placeholder={t.confirmMasterPassword}
                />
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-surface-lighter hover:bg-surface text-text-muted rounded-lg font-medium transition-all duration-200"
                >
                  {t.back}
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200"
                >
                  {t.next}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: PIN Setup */}
        {step === 3 && (
          <div className="transition-all duration-200">
            <h2 className="text-xl font-bold text-text mb-2 text-center">{t.quickUnlockPin}</h2>
            <p className="text-text-muted text-sm mb-6 text-center">
              {t.pinDesc}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">PIN (4-6 digits)</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPin(val);
                  }}
                  className="w-full px-4 py-3 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200 text-center text-2xl tracking-widest"
                  placeholder={t.pinPlaceholder}
                  maxLength={6}
                />
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-surface-lighter hover:bg-surface text-text-muted rounded-lg font-medium transition-all duration-200"
                >
                  {t.back}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? t.settingUp : pin ? t.setPinAndFinish : t.skipAndFinish}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="text-center transition-all duration-200">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-text mb-4">{t.setupComplete}</h2>
            <p className="text-text-muted mb-6">
              {t.setupCompleteDesc}
            </p>
            <p className="text-text-muted text-sm">
              {t.redirecting}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
