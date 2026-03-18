import { useState } from "react";
import { useLang } from "../../i18n/LangContext";
import type { DuplicateInfo } from "../../types/import";

interface ImportPreviewProps {
  items: DuplicateInfo[];
  onSelectionChange: (selected: DuplicateInfo[]) => void;
}

export default function ImportPreview({ items, onSelectionChange }: ImportPreviewProps) {
  const { t } = useLang();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(items.map((_, i) => i))
  );

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIds(newSelected);
    onSelectionChange(items.filter((_, i) => newSelected.has(i)));
  };

  const selectAll = () => {
    const all = new Set(items.map((_, i) => i));
    setSelectedIds(all);
    onSelectionChange(items);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
    onSelectionChange([]);
  };

  const statusColors: Record<string, string> = {
    new: "text-success bg-success/10",
    exact_duplicate: "text-text-muted bg-surface-lighter",
    conflict: "text-warning bg-warning/10",
  };

  const statusLabels: Record<string, string> = {
    new: "New",
    exact_duplicate: "Duplicate",
    conflict: "Conflict",
  };

  const newCount = items.filter((i) => i.status === "new").length;
  const dupCount = items.filter((i) => i.status === "exact_duplicate").length;
  const conflictCount = items.filter((i) => i.status === "conflict").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-success">{newCount} new</span>
        <span className="text-text-muted">{dupCount} duplicates</span>
        <span className="text-warning">{conflictCount} conflicts</span>
        <div className="flex-1" />
        <button onClick={selectAll} className="text-primary hover:text-primary-light text-sm">
          Select All
        </button>
        <button onClick={deselectAll} className="text-text-muted hover:text-text text-sm">
          Deselect All
        </button>
      </div>

      {/* Table */}
      <div className="max-h-80 overflow-y-auto rounded-lg border border-surface-lighter">
        <table className="w-full text-sm">
          <thead className="bg-surface-lighter sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-text-muted font-medium w-10" />
              <th className="px-3 py-2 text-left text-text-muted font-medium">{t.title}</th>
              <th className="px-3 py-2 text-left text-text-muted font-medium">{t.url}</th>
              <th className="px-3 py-2 text-left text-text-muted font-medium">{t.username}</th>
              <th className="px-3 py-2 text-left text-text-muted font-medium w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={index}
                className="border-t border-surface-lighter hover:bg-surface-lighter/50 transition-all duration-200"
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(index)}
                    onChange={() => toggleItem(index)}
                    className="accent-primary"
                  />
                </td>
                <td className="px-3 py-2 text-text truncate max-w-[150px]">
                  {item.imported.title}
                </td>
                <td className="px-3 py-2 text-text-muted truncate max-w-[150px]">
                  {item.imported.url}
                </td>
                <td className="px-3 py-2 text-text truncate max-w-[150px]">
                  {item.imported.username}
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
