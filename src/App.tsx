import { useState, useEffect, useCallback } from "react";
import { useLang } from "./i18n/LangContext";
import { useAuth } from "./hooks/useAuth";
import { useCredentials } from "./hooks/useCredentials";
import SetupWizard from "./components/auth/SetupWizard";
import LockScreen from "./components/auth/LockScreen";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import CredentialList from "./components/credentials/CredentialList";
import CredentialForm from "./components/credentials/CredentialForm";
import CredentialDetail from "./components/credentials/CredentialDetail";
import ImportDialog from "./components/import/ImportDialog";
import SettingsPage from "./components/settings/SettingsPage";
import BackupRestore from "./components/settings/BackupRestore";
import type { Credential, CredentialInput } from "./types/credential";

type Page = "list" | "settings" | "import" | "backup";

export default function App() {
  const { t } = useLang();
  const auth = useAuth();
  const creds = useCredentials();

  const [currentPage, setCurrentPage] = useState<Page>("list");
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Auto-lock after inactivity (default 5 minutes)
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    if (!auth.isUnlocked) return;

    const events = ["mousedown", "keydown", "mousemove", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetActivity));

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed > 5 * 60 * 1000) {
        auth.lock();
      }
    }, 30000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivity));
      clearInterval(interval);
    };
  }, [auth.isUnlocked, lastActivity, resetActivity, auth]);

  // Loading state
  if (auth.isLoading && auth.isSetup === null) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-text-muted">{t.loading}</div>
      </div>
    );
  }

  // Setup wizard
  if (auth.isSetup === false) {
    return (
      <SetupWizard
        onSetupComplete={async (password, pin) => {
          await auth.setupMasterPassword(password);
          if (pin) {
            await auth.setPin(pin);
          }
        }}
      />
    );
  }

  // Lock screen
  if (!auth.isUnlocked) {
    return (
      <LockScreen
        onUnlock={auth.unlock}
        onUnlockWithPin={auth.unlockWithPin}
        error={auth.error}
        onClearError={auth.clearError}
        hasPinSetup={auth.hasPin}
      />
    );
  }

  // Handle form save
  const handleSave = async (input: CredentialInput) => {
    if (editingCredential) {
      await creds.updateCredential(editingCredential.id, input);
    } else {
      await creds.createCredential(input);
    }
    setShowForm(false);
    setEditingCredential(null);
  };

  const handleEdit = (credential: Credential) => {
    setEditingCredential(credential);
    setSelectedCredential(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    await creds.deleteCredential(id);
    setSelectedCredential(null);
  };

  const handleNavigate = (page: "settings" | "import" | "backup") => {
    setCurrentPage(page);
    setSelectedCredential(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar
        selectedCategory={creds.selectedCategory}
        showFavorites={creds.showFavorites}
        onSelectCategory={(catId) => {
          creds.setSelectedCategory(catId);
          setCurrentPage("list");
        }}
        onShowFavorites={(show) => {
          creds.setShowFavorites(show);
          setCurrentPage("list");
        }}
        onNavigate={handleNavigate}
        onLock={auth.lock}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        {currentPage === "list" && (
          <>
            <Header
              searchQuery={creds.searchQuery}
              onSearchChange={creds.setSearchQuery}
              onAddNew={() => {
                setEditingCredential(null);
                setShowForm(true);
              }}
              credentialCount={creds.credentials.length}
            />
            <div className="flex-1 overflow-y-auto">
              <CredentialList
                credentials={creds.credentials}
                onSelect={setSelectedCredential}
                onCopyPassword={creds.copyToClipboard}
                onCopyUsername={creds.copyToClipboard}
                onToggleFavorite={creds.toggleFavorite}
              />
            </div>
          </>
        )}

        {currentPage === "settings" && (
          <SettingsPage onBack={() => setCurrentPage("list")} />
        )}

        {currentPage === "backup" && (
          <BackupRestore onBack={() => setCurrentPage("list")} />
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <CredentialForm
          credential={editingCredential ?? undefined}
          categories={creds.categories}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingCredential(null);
          }}
        />
      )}

      {selectedCredential && (
        <CredentialDetail
          credential={selectedCredential}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setSelectedCredential(null)}
          onCopy={creds.copyToClipboard}
        />
      )}

      {currentPage === "import" && (
        <ImportDialog
          onClose={() => setCurrentPage("list")}
          onComplete={() => {
            setCurrentPage("list");
            creds.loadCredentials();
          }}
        />
      )}
    </div>
  );
}
