import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useLang } from "../../i18n/LangContext";
import { useBackup } from "../../hooks/useBackup";

interface BackupRestoreProps {
  onBack: () => void;
}

export default function BackupRestore({ onBack }: BackupRestoreProps) {
  const { t } = useLang();
  const {
    backups,
    isCreating,
    isRestoring,
    error,
    message,
    loadBackups,
    createBackup,
    restoreBackup,
    clearMessages,
  } = useBackup();

  const [backupPassword, setBackupPassword] = useState("");
  const [restorePassword, setRestorePassword] = useState("");
  const [restoreFile, setRestoreFile] = useState<string | null>(null);
  const [showRestoreWarning, setShowRestoreWarning] = useState(false);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleCreateBackup = async () => {
    if (!backupPassword) return;
    try {
      await createBackup(backupPassword);
      setBackupPassword("");
    } catch {
      // error handled by hook
    }
  };

  const handleSelectRestoreFile = async () => {
    try {
      const result = await open({
        filters: [{ name: "MyPwd Backup", extensions: ["mypwd"] }],
        multiple: false,
      });
      if (result) {
        setRestoreFile(result as string);
        clearMessages();
      }
    } catch (err) {
      console.error("Failed to open file dialog:", err);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile || !restorePassword) return;
    try {
      await restoreBackup(restoreFile, restorePassword);
      setRestorePassword("");
      setRestoreFile(null);
      setShowRestoreWarning(false);
    } catch {
      // error handled by hook
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <h1 className="text-2xl font-bold text-text">{t.backup}</h1>
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
          {/* Create Backup */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
            <h3 className="text-text font-medium mb-1">{t.createBackup}</h3>
            <p className="text-text-muted text-sm mb-4">
              {t.createBackupDesc}
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                placeholder={t.backupPassword}
              />
              <button
                onClick={handleCreateBackup}
                disabled={isCreating || !backupPassword}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              >
                {isCreating ? t.creating : t.createBackup}
              </button>
            </div>
          </div>

          {/* Backup History */}
          {backups.length > 0 && (
            <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
              <h3 className="text-text font-medium mb-3">{t.backupHistory}</h3>
              <div className="space-y-2">
                {backups.map((backup, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-surface rounded-lg"
                  >
                    <div>
                      <p className="text-text text-sm">{backup.file_name}</p>
                      <p className="text-text-muted text-xs">{formatDate(backup.created_at)}</p>
                    </div>
                    <span className="text-text-muted text-xs">{formatSize(backup.size_bytes)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restore */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
            <h3 className="text-text font-medium mb-1">{t.restoreBackup}</h3>
            <p className="text-text-muted text-sm mb-4">
              {t.restoreBackupDesc}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSelectRestoreFile}
                className="w-full py-2.5 bg-surface-lighter hover:bg-surface text-text-muted rounded-lg text-sm transition-all duration-200"
              >
                {restoreFile ? restoreFile : t.selectBackupFile}
              </button>

              {restoreFile && (
                <>
                  <input
                    type="password"
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200"
                    placeholder={t.backupPassword}
                  />

                  {!showRestoreWarning ? (
                    <button
                      onClick={() => setShowRestoreWarning(true)}
                      disabled={!restorePassword}
                      className="w-full py-2.5 bg-warning/20 hover:bg-warning/30 text-warning rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      {t.restore}
                    </button>
                  ) : (
                    <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg space-y-3">
                      <p className="text-danger text-sm font-medium">
                        {t.restoreWarning}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowRestoreWarning(false)}
                          className="flex-1 py-2 bg-surface-lighter text-text-muted rounded-lg text-sm transition-all duration-200"
                        >
                          {t.cancel}
                        </button>
                        <button
                          onClick={handleRestore}
                          disabled={isRestoring}
                          className="flex-1 py-2 bg-danger hover:bg-danger/80 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          {isRestoring ? t.restoring : t.restore}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
