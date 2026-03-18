import { useState } from "react";
import { useLang } from "../../i18n/LangContext";
import type { DuplicateInfo } from "../../types/import";

type Resolution = "keep_existing" | "overwrite" | "keep_both";

interface DuplicateResolverProps {
  conflicts: DuplicateInfo[];
  onResolve: (resolved: Array<{ item: DuplicateInfo; resolution: Resolution }>) => void;
}

export default function DuplicateResolver({ conflicts, onResolve }: DuplicateResolverProps) {
  const { t } = useLang();
  const [resolutions, setResolutions] = useState<Map<number, Resolution>>(new Map());

  const setResolution = (index: number, resolution: Resolution) => {
    const newMap = new Map(resolutions);
    newMap.set(index, resolution);
    setResolutions(newMap);
  };

  const applyToAll = (resolution: Resolution) => {
    const newMap = new Map<number, Resolution>();
    conflicts.forEach((_, index) => newMap.set(index, resolution));
    setResolutions(newMap);
  };

  const handleDone = () => {
    const resolved = conflicts.map((item, index) => ({
      item,
      resolution: resolutions.get(index) ?? ("keep_existing" as Resolution),
    }));
    onResolve(resolved);
  };

  const allResolved = conflicts.every((_, index) => resolutions.has(index));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">
          {conflicts.length} {t.duplicateResolution}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => applyToAll("keep_existing")}
            className="text-xs px-3 py-1.5 bg-surface-lighter rounded-lg text-text-muted hover:text-text transition-all duration-200"
          >
            Keep All Existing
          </button>
          <button
            onClick={() => applyToAll("overwrite")}
            className="text-xs px-3 py-1.5 bg-surface-lighter rounded-lg text-text-muted hover:text-text transition-all duration-200"
          >
            Overwrite All
          </button>
          <button
            onClick={() => applyToAll("keep_both")}
            className="text-xs px-3 py-1.5 bg-surface-lighter rounded-lg text-text-muted hover:text-text transition-all duration-200"
          >
            Keep Both All
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {conflicts.map((conflict, index) => (
          <div
            key={index}
            className="bg-surface rounded-lg border border-surface-lighter p-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Imported */}
              <div>
                <p className="text-xs text-warning mb-1 font-medium">Imported</p>
                <p className="text-text text-sm font-medium">{conflict.imported.title}</p>
                <p className="text-text-muted text-xs">{conflict.imported.username}</p>
                <p className="text-text-muted text-xs truncate">{conflict.imported.url}</p>
              </div>
              {/* Existing */}
              <div>
                <p className="text-xs text-primary mb-1 font-medium">Existing</p>
                {conflict.existing ? (
                  <>
                    <p className="text-text text-sm font-medium">{conflict.existing.title}</p>
                    <p className="text-text-muted text-xs">{conflict.existing.username}</p>
                    <p className="text-text-muted text-xs truncate">{conflict.existing.url ?? ""}</p>
                  </>
                ) : (
                  <p className="text-text-muted text-sm">No existing entry</p>
                )}
              </div>
            </div>

            {/* Resolution options */}
            <div className="flex gap-2">
              {(["keep_existing", "overwrite", "keep_both"] as Resolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(index, res)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    resolutions.get(index) === res
                      ? "bg-primary text-white"
                      : "bg-surface-lighter text-text-muted hover:text-text"
                  }`}
                >
                  {res === "keep_existing" ? "Keep Existing" : res === "overwrite" ? "Overwrite" : "Keep Both"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleDone}
        disabled={!allResolved}
        className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
      >
        {t.complete}
      </button>
    </div>
  );
}
