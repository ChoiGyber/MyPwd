import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useLang } from "../../i18n/LangContext";

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { t, lang, setLang } = useLang();
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [clipboardTimeout, setClipboardTimeout] = useState(30);
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveAutoLock = async (minutes: number) => {
    try {
      setAutoLockMinutes(minutes);
      await invoke("set_setting", { key: "auto_lock_minutes", value: String(minutes) });
      setMessage(t.autoLockUpdated);
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSaveClipboardTimeout = async (seconds: number) => {
    try {
      setClipboardTimeout(seconds);
      await invoke("set_setting", { key: "clipboard_timeout", value: String(seconds) });
      setMessage(t.clipboardUpdated);
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSetPin = async () => {
    if (pin.length < 4 || pin.length > 6) {
      setError("PIN must be 4-6 digits.");
      return;
    }
    try {
      await invoke("set_pin", { pin });
      setMessage(t.pinUpdated);
      setShowPinInput(false);
      setPin("");
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRemovePin = async () => {
    try {
      await invoke("remove_pin");
      setMessage(t.pinRemoved);
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200"
          >
            &larr;
          </button>
          <h1 className="text-2xl font-bold text-text">{t.settings}</h1>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Language */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
            <h3 className="text-text font-medium mb-1">{t.language}</h3>
            <p className="text-text-muted text-sm mb-3">{t.languageDesc}</p>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as "ko" | "en")}
              className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Auto-lock timer */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
            <h3 className="text-text font-medium mb-1">{t.autoLockTimer}</h3>
            <p className="text-text-muted text-sm mb-3">
              {t.autoLockDesc}
            </p>
            <select
              value={autoLockMinutes}
              onChange={(e) => handleSaveAutoLock(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
            >
              <option value={1}>1 {t.minutes}</option>
              <option value={5}>5 {t.minutes}</option>
              <option value={10}>10 {t.minutes}</option>
              <option value={30}>30 {t.minutes}</option>
            </select>
          </div>

          {/* Clipboard timeout */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
            <h3 className="text-text font-medium mb-1">{t.clipboardTimeout}</h3>
            <p className="text-text-muted text-sm mb-3">
              {t.clipboardTimeoutDesc}
            </p>
            <select
              value={clipboardTimeout}
              onChange={(e) => handleSaveClipboardTimeout(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
            >
              <option value={15}>15 {t.seconds}</option>
              <option value={30}>30 {t.seconds}</option>
              <option value={60}>60 {t.seconds}</option>
            </select>
          </div>

          {/* PIN management */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
            <h3 className="text-text font-medium mb-1">{t.pinManagement}</h3>
            <p className="text-text-muted text-sm mb-3">
              {t.pinManagementDesc}
            </p>
            {showPinInput ? (
              <div className="space-y-3">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200 text-center text-xl tracking-widest"
                  placeholder={t.enterPin}
                  maxLength={6}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPinInput(false);
                      setPin("");
                    }}
                    className="flex-1 py-2 bg-surface-lighter text-text-muted rounded-lg transition-all duration-200 hover:bg-surface"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSetPin}
                    className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all duration-200"
                  >
                    {t.savePin}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPinInput(true)}
                  className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm transition-all duration-200"
                >
                  {t.setChangePin}
                </button>
                <button
                  onClick={handleRemovePin}
                  className="flex-1 py-2 bg-surface-lighter hover:bg-danger/20 text-text-muted hover:text-danger rounded-lg text-sm transition-all duration-200"
                >
                  {t.removePin}
                </button>
              </div>
            )}
          </div>

          {/* Windows Hello */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-5 opacity-60">
            <h3 className="text-text font-medium mb-1">{t.windowsHello}</h3>
            <p className="text-text-muted text-sm mb-3">
              {t.windowsHelloDesc}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-sm">{t.notAvailable}</span>
              <div className="w-10 h-6 bg-surface-lighter rounded-full" />
            </div>
          </div>

          {/* Browser Extension */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
            <h3 className="text-text font-medium mb-1">🧩 {t.browserExtension}</h3>
            <p className="text-text-muted text-sm mb-4">
              {t.browserExtensionDesc}
            </p>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    const folder = await open({ directory: true, title: t.downloadExtension });
                    if (folder) {
                      const exportedPath = await invoke<string>("export_extension", { targetDir: folder });
                      await invoke("open_folder", { path: exportedPath });
                      setMessage(`${t.extensionSaved}: ${exportedPath}`);
                      setTimeout(() => setMessage(null), 5000);
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : String(err));
                  }
                }}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all duration-200"
              >
                📥 {t.downloadExtension}
              </button>

              <div className="bg-surface rounded-lg p-4 text-sm space-y-2">
                <p className="text-text font-medium">{t.installSteps}</p>
                <ol className="text-text-muted space-y-1 list-decimal list-inside">
                  <li>{t.installStep1}</li>
                  <li>{t.installStep2}</li>
                  <li>{t.installStep3}</li>
                  <li>{t.installStep4}</li>
                  <li>{t.installStep5}</li>
                </ol>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span>{t.localServerPort}</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
            <h3 className="text-text font-medium mb-1">{t.about}</h3>
            <div className="space-y-1 text-sm text-text-muted">
              <p>{t.appName} Password Manager</p>
              <p>{t.version} 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
