import { useState } from "react";
import { useLang } from "../../i18n/LangContext";
import { open } from "@tauri-apps/plugin-dialog";

interface CsvDropZoneProps {
  onFileSelect: (filePath: string) => void;
}

export default function CsvDropZone({ onFileSelect }: CsvDropZoneProps) {
  const { t } = useLang();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleBrowse = async () => {
    if (isSelecting) return;
    try {
      setIsSelecting(true);
      const result = await open({
        filters: [{ name: "CSV Files", extensions: ["csv"] }],
        multiple: false,
      });
      if (result) {
        const filePath = typeof result === "string" ? result : result;
        setSelectedFile(filePath as string);
        onFileSelect(filePath as string);
      }
    } catch (err) {
      console.error("Failed to open file dialog:", err);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div
      onClick={handleBrowse}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
        isSelecting
          ? "border-primary bg-primary/10"
          : "border-surface-lighter hover:border-primary/50 hover:bg-surface-lighter/30"
      }`}
    >
      <div className="text-5xl mb-4">📄</div>
      {selectedFile ? (
        <>
          <p className="text-text font-medium mb-2">{t.selectedFile}</p>
          <p className="text-primary text-sm break-all">{selectedFile}</p>
          <p className="text-text-muted text-xs mt-2">{t.clickToSelectAnother}</p>
        </>
      ) : (
        <>
          <p className="text-text font-medium mb-2">
            {isSelecting ? t.selectingFile : t.selectCsvFile}
          </p>
          <p className="text-text-muted text-sm">
            {t.supportedFormats}
          </p>
        </>
      )}
    </div>
  );
}
