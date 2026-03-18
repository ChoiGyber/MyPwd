import { useLang } from "../../i18n/LangContext";

interface SidebarProps {
  selectedCategory: number | null;
  showFavorites: boolean;
  onSelectCategory: (categoryId: number | null) => void;
  onShowFavorites: (show: boolean) => void;
  onNavigate: (page: "settings" | "import" | "backup") => void;
  onLock: () => void;
}

export default function Sidebar({
  selectedCategory,
  showFavorites,
  onSelectCategory,
  onShowFavorites,
  onNavigate,
  onLock,
}: SidebarProps) {
  const { t } = useLang();

  const categories = [
    { id: 0, name: t.all, icon: "📋" },
    { id: 1, name: t.websites, icon: "🌐" },
    { id: 2, name: t.applications, icon: "💻" },
    { id: 3, name: t.finance, icon: "🏦" },
    { id: 4, name: t.other, icon: "📁" },
  ];

  return (
    <div className="w-60 bg-surface-light h-screen flex flex-col border-r border-surface-lighter">
      {/* Logo */}
      <div className="p-5 border-b border-surface-lighter">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          <h1 className="text-xl font-bold text-text">{t.appName}</h1>
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-text-muted uppercase tracking-wider px-3 mb-2">{t.category}</p>
        <nav className="space-y-1">
          {categories.map((cat) => {
            const isAll = cat.id === 0;
            const isActive = isAll
              ? selectedCategory === null && !showFavorites
              : selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onShowFavorites(false);
                  onSelectCategory(isAll ? null : cat.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-surface-lighter hover:text-text"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4">
          <button
            onClick={() => {
              onSelectCategory(null);
              onShowFavorites(true);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              showFavorites
                ? "bg-primary text-white"
                : "text-text-muted hover:bg-surface-lighter hover:text-text"
            }`}
          >
            <span>⭐</span>
            <span>{t.favorites}</span>
          </button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-surface-lighter space-y-1">
        <button
          onClick={() => onNavigate("import")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-surface-lighter hover:text-text transition-all duration-200"
        >
          <span>📥</span>
          <span>{t.import_}</span>
        </button>
        <button
          onClick={() => onNavigate("backup")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-surface-lighter hover:text-text transition-all duration-200"
        >
          <span>💾</span>
          <span>{t.backup}</span>
        </button>
        <button
          onClick={() => onNavigate("settings")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-surface-lighter hover:text-text transition-all duration-200"
        >
          <span>⚙️</span>
          <span>{t.settings}</span>
        </button>
        <button
          onClick={onLock}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-surface-lighter transition-all duration-200"
        >
          <span>🔒</span>
          <span>{t.lock}</span>
        </button>
      </div>
    </div>
  );
}
