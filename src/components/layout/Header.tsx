import { useLang } from "../../i18n/LangContext";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddNew: () => void;
  credentialCount: number;
}

export default function Header({ searchQuery, onSearchChange, onAddNew, credentialCount }: HeaderProps) {
  const { t } = useLang();

  return (
    <div className="h-16 bg-surface-light border-b border-surface-lighter flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.search}
            className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg text-text border border-surface-lighter focus:border-primary focus:outline-none transition-all duration-200 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-sm"
            >
              ✕
            </button>
          )}
        </div>
        <span className="text-text-muted text-sm">
          {credentialCount} {credentialCount === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Add New */}
      <button
        onClick={onAddNew}
        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all duration-200"
      >
        <span>➕</span>
        <span>{t.addNew}</span>
      </button>
    </div>
  );
}
