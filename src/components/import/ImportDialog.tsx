import { useState } from "react";
import { useLang } from "../../i18n/LangContext";
import { useImport } from "../../hooks/useImport";
import CsvDropZone from "./CsvDropZone";
import ImportPreview from "./ImportPreview";
import DuplicateResolver from "./DuplicateResolver";
import type { DuplicateInfo } from "../../types/import";

interface ImportDialogProps {
  onClose: () => void;
  onComplete: () => void;
}

const browserGuides = {
  ko: [
    {
      name: "Chrome",
      icon: "🔵",
      steps: [
        "Chrome 열기 → 주소창에 chrome://password-manager/settings 입력",
        "'비밀번호 내보내기' 클릭",
        "Windows 비밀번호 입력 후 CSV 파일 저장",
      ],
    },
    {
      name: "Edge",
      icon: "🟦",
      steps: [
        "Edge 열기 → 주소창에 edge://wallet/passwords 입력",
        "⋯ 메뉴 → '비밀번호 내보내기' 클릭",
        "Windows 비밀번호 입력 후 CSV 파일 저장",
      ],
    },
    {
      name: "Naver Whale",
      icon: "🟢",
      steps: [
        "Whale 열기 → 주소창에 whale://settings/passwords 입력",
        "'비밀번호 내보내기' 클릭 (⋯ 메뉴)",
        "Windows 비밀번호 입력 후 CSV 파일 저장",
      ],
    },
    {
      name: "Firefox",
      icon: "🟠",
      steps: [
        "Firefox 열기 → 설정 → 개인정보 및 보안",
        "'저장된 로그인' → ⋯ 메뉴 → '로그인 정보 내보내기'",
        "CSV 파일 저장",
      ],
    },
  ],
  en: [
    {
      name: "Chrome",
      icon: "🔵",
      steps: [
        "Open Chrome → Type chrome://password-manager/settings in address bar",
        "Click 'Export passwords'",
        "Enter Windows password and save CSV file",
      ],
    },
    {
      name: "Edge",
      icon: "🟦",
      steps: [
        "Open Edge → Type edge://wallet/passwords in address bar",
        "⋯ Menu → Click 'Export passwords'",
        "Enter Windows password and save CSV file",
      ],
    },
    {
      name: "Naver Whale",
      icon: "🟢",
      steps: [
        "Open Whale → Type whale://settings/passwords in address bar",
        "Click 'Export passwords' (⋯ Menu)",
        "Enter Windows password and save CSV file",
      ],
    },
    {
      name: "Firefox",
      icon: "🟠",
      steps: [
        "Open Firefox → Settings → Privacy & Security",
        "'Saved Logins' → ⋯ Menu → 'Export Logins'",
        "Save CSV file",
      ],
    },
  ],
};

export default function ImportDialog({ onClose, onComplete }: ImportDialogProps) {
  const { t, lang } = useLang();
  const {
    importedItems,
    duplicates,
    importStep,
    isLoading,
    error,
    importCount,
    setImportStep,
    importCsv,
    checkDuplicates,
    saveImported,
    reset,
  } = useImport();

  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const guides = browserGuides[lang] || browserGuides.en;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = async (filePath: string) => {
    await importCsv(filePath);
  };

  const handlePreviewContinue = () => {
    checkDuplicates(importedItems);
  };

  const handleSelectionChange = (_selected: DuplicateInfo[]) => {};

  const handleResolve = () => {
    saveImported(importedItems).then(() => {
      onComplete();
    });
  };

  const handleCompleteClose = () => {
    reset();
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-surface-light rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text">{t.importWizard}</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-all duration-200"
            >
              ✕
            </button>
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-2 mb-6">
            {["guide", "select", "preview", "resolve"].map((_, i) => {
              const steps = ["guide", "source", "preview", "duplicates", "complete"];
              const currentIdx = steps.indexOf(importStep);
              return (
                <div key={i} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i <= currentIdx ? "bg-primary" : "bg-surface-lighter"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Browser export guides + file select */}
          {(importStep === "method" || importStep === "source") && (
            <div className="space-y-5">
              {/* Browser guides */}
              <div>
                <p className="text-text font-medium mb-3">
                  {lang === "ko" ? "1단계: 브라우저에서 비밀번호 내보내기" : "Step 1: Export passwords from browser"}
                </p>
                <div className="space-y-2">
                  {guides.map((guide) => (
                    <div key={guide.name} className="bg-surface rounded-xl border border-surface-lighter overflow-hidden">
                      <button
                        onClick={() => setExpandedGuide(expandedGuide === guide.name ? null : guide.name)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-surface-lighter/50 transition-all duration-200"
                      >
                        <span className="text-xl">{guide.icon}</span>
                        <span className="text-text font-medium flex-1 text-left">{guide.name}</span>
                        <span className="text-text-muted text-sm">
                          {expandedGuide === guide.name ? "▲" : "▼"}
                        </span>
                      </button>
                      {expandedGuide === guide.name && (
                        <div className="px-4 pb-4 pt-0">
                          <ol className="space-y-2">
                            {guide.steps.map((step, i) => (
                              <li key={i} className="flex gap-3 text-sm">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                                  {i + 1}
                                </span>
                                <span className="text-text-muted pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CSV file select */}
              <div>
                <p className="text-text font-medium mb-3">
                  {lang === "ko" ? "2단계: 내보낸 CSV 파일 선택" : "Step 2: Select exported CSV file"}
                </p>
                <CsvDropZone onFileSelect={handleFileSelect} />
                {isLoading && (
                  <p className="text-text-muted text-sm text-center mt-2">{t.loading}</p>
                )}
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <span className="text-warning shrink-0">⚠️</span>
                <p className="text-xs text-text-muted">
                  {lang === "ko"
                    ? "가져오기 완료 후 보안을 위해 CSV 파일을 삭제하세요. CSV 파일에는 비밀번호가 평문으로 저장되어 있습니다."
                    : "Delete the CSV file after import for security. CSV files contain passwords in plain text."}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {importStep === "preview" && (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">
                {importedItems.length}{" "}
                {lang === "ko" ? "개의 자격증명을 발견했습니다" : "credentials found"}:
              </p>
              <ImportPreview
                items={importedItems.map((item) => ({
                  imported: item,
                  existing: null,
                  status: "new" as const,
                }))}
                onSelectionChange={handleSelectionChange}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setImportStep("source")}
                  className="flex-1 py-2.5 bg-surface-lighter text-text-muted rounded-lg font-medium transition-all duration-200 hover:bg-surface"
                >
                  {t.back}
                </button>
                <button
                  onClick={handlePreviewContinue}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? t.loading : lang === "ko" ? "가져오기" : "Import"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Duplicate resolution */}
          {importStep === "duplicates" && (
            <div className="space-y-4">
              <DuplicateResolver
                conflicts={duplicates.filter((d) => d.status === "conflict")}
                onResolve={handleResolve}
              />
            </div>
          )}

          {/* Step 4: Complete */}
          {importStep === "complete" && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-text mb-2">{t.importComplete}!</h3>
              <p className="text-text-muted mb-6">
                {importCount}{" "}
                {lang === "ko" ? "개의 자격증명을 가져왔습니다" : "credentials imported"}
              </p>
              <button
                onClick={handleCompleteClose}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200"
              >
                {t.complete}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
