export type Lang = "ko" | "en";

export interface Translations {
  // App
  appName: string;
  loading: string;

  // Auth
  welcome: string;
  welcomeDesc: string;
  welcomeSetupDesc: string;
  getStarted: string;
  createMasterPassword: string;
  createMasterPasswordDesc: string;
  masterPassword: string;
  confirmPassword: string;
  enterMasterPassword: string;
  confirmMasterPassword: string;
  back: string;
  next: string;
  quickUnlockPin: string;
  pinDesc: string;
  pinPlaceholder: string;
  setPinAndFinish: string;
  skipAndFinish: string;
  settingUp: string;
  setupComplete: string;
  setupCompleteDesc: string;
  redirecting: string;
  unlock: string;
  unlockWithPassword: string;
  unlockWithPin: string;
  enterPassword: string;
  enterPin: string;

  // Password strength
  weak: string;
  fair: string;
  good: string;
  strong: string;
  veryStrong: string;

  // Sidebar
  all: string;
  websites: string;
  applications: string;
  finance: string;
  other: string;
  favorites: string;
  import_: string;
  backup: string;
  settings: string;
  lock: string;

  // Header
  search: string;
  addNew: string;

  // Credential List
  noCredentials: string;
  noCredentialsDesc: string;

  // Credential Form
  addNewCredential: string;
  editCredential: string;
  title: string;
  titleRequired: string;
  url: string;
  username: string;
  usernameRequired: string;
  password: string;
  passwordRequired: string;
  category: string;
  none: string;
  notes: string;
  cancel: string;
  save: string;
  update: string;
  saving: string;

  // Credential Detail
  copyUrl: string;
  copyUsername: string;
  copyPassword: string;
  edit: string;
  delete_: string;
  confirmDelete: string;
  created: string;
  updated: string;
  source: string;

  // Password Generator
  passwordOnly: string;
  idAndPassword: string;
  generatedId: string;
  generatedPassword: string;
  copy: string;
  regenerate: string;
  idLength: string;
  passwordLength: string;
  applyIdAndPassword: string;
  applyPassword: string;

  // Import
  importWizard: string;
  chooseMethod: string;
  csvImport: string;
  directRead: string;
  csvDropDesc: string;
  selectCsvFile: string;
  selectingFile: string;
  supportedFormats: string;
  selectedFile: string;
  clickToSelectAnother: string;
  preview: string;
  duplicateResolution: string;
  complete: string;
  importComplete: string;

  // Settings
  autoLockTimer: string;
  autoLockDesc: string;
  clipboardTimeout: string;
  clipboardTimeoutDesc: string;
  pinManagement: string;
  pinManagementDesc: string;
  setChangePin: string;
  removePin: string;
  savePin: string;
  windowsHello: string;
  windowsHelloDesc: string;
  notAvailable: string;
  browserExtension: string;
  browserExtensionDesc: string;
  downloadExtension: string;
  installSteps: string;
  installStep1: string;
  installStep2: string;
  installStep3: string;
  installStep4: string;
  installStep5: string;
  localServerPort: string;
  about: string;
  version: string;
  language: string;
  languageDesc: string;

  // Backup
  createBackup: string;
  createBackupDesc: string;
  backupPassword: string;
  creating: string;
  restoreBackup: string;
  restoreBackupDesc: string;
  restoreWarning: string;
  selectBackupFile: string;
  restore: string;
  restoring: string;
  backupHistory: string;
  noBackups: string;

  // Misc
  minutes: string;
  seconds: string;
  extensionSaved: string;
  pinUpdated: string;
  pinRemoved: string;
  autoLockUpdated: string;
  clipboardUpdated: string;
  credentialsFilled: string;
  idCopied: string;
  passwordCopied: string;
}

const ko: Translations = {
  appName: "MyPwd",
  loading: "로딩 중...",

  welcome: "MyPwd에 오신 것을 환영합니다",
  welcomeDesc: "안전한 패스워드 매니저입니다. 모든 자격증명은 암호화되어 기기에 로컬 저장됩니다.",
  welcomeSetupDesc: "시작하려면 마스터 패스워드를 설정하세요. 이 패스워드로 모든 데이터가 암호화됩니다.",
  getStarted: "시작하기",
  createMasterPassword: "마스터 패스워드 생성",
  createMasterPasswordDesc: "강력한 패스워드를 선택하세요. 기억해야 할 유일한 패스워드입니다.",
  masterPassword: "마스터 패스워드",
  confirmPassword: "패스워드 확인",
  enterMasterPassword: "마스터 패스워드 입력",
  confirmMasterPassword: "마스터 패스워드 재입력",
  back: "뒤로",
  next: "다음",
  quickUnlockPin: "빠른 잠금해제 PIN",
  pinDesc: "빠른 잠금해제를 위한 4-6자리 PIN을 설정하세요. 나중에 설정할 수도 있습니다.",
  pinPlaceholder: "----",
  setPinAndFinish: "PIN 설정 후 완료",
  skipAndFinish: "건너뛰기",
  settingUp: "설정 중...",
  setupComplete: "설정 완료!",
  setupCompleteDesc: "패스워드 매니저가 준비되었습니다. 데이터는 이 기기에 안전하게 암호화 저장됩니다.",
  redirecting: "잠시 후 이동합니다...",
  unlock: "잠금해제",
  unlockWithPassword: "패스워드로 잠금해제",
  unlockWithPin: "PIN으로 잠금해제",
  enterPassword: "패스워드 입력",
  enterPin: "PIN 입력",

  weak: "약함",
  fair: "보통",
  good: "양호",
  strong: "강함",
  veryStrong: "매우 강함",

  all: "전체",
  websites: "웹사이트",
  applications: "프로그램",
  finance: "금융",
  other: "기타",
  favorites: "즐겨찾기",
  import_: "가져오기",
  backup: "백업",
  settings: "설정",
  lock: "잠금",

  search: "검색...",
  addNew: "추가",

  noCredentials: "저장된 자격증명이 없습니다",
  noCredentialsDesc: "'추가' 버튼을 클릭하여 첫 번째 자격증명을 저장하거나, 브라우저에서 가져오세요.",

  addNewCredential: "새 자격증명 추가",
  editCredential: "자격증명 수정",
  title: "제목",
  titleRequired: "제목을 입력하세요.",
  url: "URL",
  username: "아이디",
  usernameRequired: "아이디를 입력하세요.",
  password: "비밀번호",
  passwordRequired: "비밀번호를 입력하세요.",
  category: "카테고리",
  none: "없음",
  notes: "메모",
  cancel: "취소",
  save: "저장",
  update: "수정",
  saving: "저장 중...",

  copyUrl: "URL 복사",
  copyUsername: "아이디 복사",
  copyPassword: "비밀번호 복사",
  edit: "수정",
  delete_: "삭제",
  confirmDelete: "정말 삭제하시겠습니까?",
  created: "생성일",
  updated: "수정일",
  source: "출처",

  passwordOnly: "비밀번호만",
  idAndPassword: "아이디 + 비밀번호",
  generatedId: "생성된 아이디",
  generatedPassword: "생성된 비밀번호",
  copy: "복사",
  regenerate: "다시 생성",
  idLength: "아이디 길이",
  passwordLength: "비밀번호 길이",
  applyIdAndPassword: "아이디 + 비밀번호 적용",
  applyPassword: "비밀번호 적용",

  importWizard: "가져오기",
  chooseMethod: "가져오기 방식 선택",
  csvImport: "CSV 파일 가져오기",
  directRead: "브라우저 직접 읽기",
  csvDropDesc: "Chrome, Firefox, Edge CSV 내보내기 형식 지원",
  selectCsvFile: "클릭하여 CSV 파일을 선택하세요",
  selectingFile: "파일 선택 중...",
  supportedFormats: "Chrome, Firefox, Edge CSV 내보내기 형식 지원",
  selectedFile: "선택된 파일:",
  clickToSelectAnother: "클릭하여 다른 파일 선택",
  preview: "미리보기",
  duplicateResolution: "중복 해결",
  complete: "완료",
  importComplete: "가져오기 완료",

  autoLockTimer: "자동 잠금 타이머",
  autoLockDesc: "비활동 시 자동으로 앱을 잠급니다.",
  clipboardTimeout: "클립보드 자동 삭제",
  clipboardTimeoutDesc: "비밀번호 복사 후 자동으로 클립보드를 삭제합니다.",
  pinManagement: "빠른 잠금해제 PIN",
  pinManagementDesc: "4-6자리 PIN으로 빠르게 잠금해제합니다.",
  setChangePin: "PIN 설정/변경",
  removePin: "PIN 삭제",
  savePin: "PIN 저장",
  windowsHello: "Windows Hello",
  windowsHelloDesc: "생체인증으로 잠금해제합니다.",
  notAvailable: "이 기기에서 사용할 수 없습니다",
  browserExtension: "브라우저 확장 프로그램",
  browserExtensionDesc: "Chrome/Edge 확장 프로그램을 설치하면 웹사이트 로그인 시 자동으로 아이디/패스워드를 입력합니다.",
  downloadExtension: "확장 프로그램 다운로드",
  installSteps: "설치 방법:",
  installStep1: "위 버튼을 클릭하여 확장 프로그램 폴더를 저장",
  installStep2: "Chrome/Edge에서 chrome://extensions 열기",
  installStep3: "우측 상단 개발자 모드 활성화",
  installStep4: "압축해제된 확장 프로그램을 로드합니다 클릭",
  installStep5: "저장된 MyPwd-Extension 폴더 선택",
  localServerPort: "로컬 서버 포트: 27183 (앱 실행 중 자동 작동)",
  about: "정보",
  version: "버전",
  language: "언어",
  languageDesc: "앱 표시 언어를 선택합니다.",

  createBackup: "백업 생성",
  createBackupDesc: "암호화된 백업 파일(.mypwd)을 생성합니다.",
  backupPassword: "마스터 패스워드를 입력하세요",
  creating: "생성 중...",
  restoreBackup: "백업 복원",
  restoreBackupDesc: ".mypwd 백업 파일에서 데이터를 복원합니다.",
  restoreWarning: "복원 시 현재 데이터가 완전히 교체됩니다.",
  selectBackupFile: "백업 파일 선택",
  restore: "복원",
  restoring: "복원 중...",
  backupHistory: "백업 이력",
  noBackups: "백업 이력이 없습니다",

  minutes: "분",
  seconds: "초",
  extensionSaved: "확장 프로그램이 저장되었습니다",
  pinUpdated: "PIN이 업데이트되었습니다.",
  pinRemoved: "PIN이 삭제되었습니다.",
  autoLockUpdated: "자동 잠금 타이머가 업데이트되었습니다.",
  clipboardUpdated: "클립보드 타임아웃이 업데이트되었습니다.",
  credentialsFilled: "자격증명이 입력되었습니다!",
  idCopied: "아이디 복사됨! 붙여넣기 후 다시 클릭하면 비밀번호 복사",
  passwordCopied: "비밀번호 복사됨! Ctrl+V로 붙여넣기",
};

const en: Translations = {
  appName: "MyPwd",
  loading: "Loading...",

  welcome: "Welcome to MyPwd",
  welcomeDesc: "Your secure password manager. All credentials are encrypted and stored locally on your device.",
  welcomeSetupDesc: "Let's set up your master password to get started. This password will encrypt all your data.",
  getStarted: "Get Started",
  createMasterPassword: "Create Master Password",
  createMasterPasswordDesc: "Choose a strong password. This is the only password you'll need to remember.",
  masterPassword: "Master Password",
  confirmPassword: "Confirm Password",
  enterMasterPassword: "Enter master password",
  confirmMasterPassword: "Confirm master password",
  back: "Back",
  next: "Next",
  quickUnlockPin: "Quick Unlock PIN",
  pinDesc: "Set an optional 4-6 digit PIN for quick unlock. You can skip this and set it later.",
  pinPlaceholder: "----",
  setPinAndFinish: "Set PIN & Finish",
  skipAndFinish: "Skip & Finish",
  settingUp: "Setting up...",
  setupComplete: "Setup Complete!",
  setupCompleteDesc: "Your password manager is ready. Your data is encrypted and stored securely on this device.",
  redirecting: "Redirecting to your vault...",
  unlock: "Unlock",
  unlockWithPassword: "Unlock with Password",
  unlockWithPin: "Unlock with PIN",
  enterPassword: "Enter password",
  enterPin: "Enter PIN",

  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
  veryStrong: "Very Strong",

  all: "All",
  websites: "Websites",
  applications: "Applications",
  finance: "Finance",
  other: "Other",
  favorites: "Favorites",
  import_: "Import",
  backup: "Backup",
  settings: "Settings",
  lock: "Lock",

  search: "Search...",
  addNew: "Add New",

  noCredentials: "No credentials yet",
  noCredentialsDesc: "Click 'Add New' to store your first credential, or import from a browser.",

  addNewCredential: "Add New Credential",
  editCredential: "Edit Credential",
  title: "Title",
  titleRequired: "Title is required.",
  url: "URL",
  username: "Username",
  usernameRequired: "Username is required.",
  password: "Password",
  passwordRequired: "Password is required.",
  category: "Category",
  none: "None",
  notes: "Notes",
  cancel: "Cancel",
  save: "Save",
  update: "Update",
  saving: "Saving...",

  copyUrl: "Copy URL",
  copyUsername: "Copy username",
  copyPassword: "Copy password",
  edit: "Edit",
  delete_: "Delete",
  confirmDelete: "Confirm Delete?",
  created: "Created",
  updated: "Updated",
  source: "Source",

  passwordOnly: "Password Only",
  idAndPassword: "ID + Password",
  generatedId: "Generated ID",
  generatedPassword: "Generated Password",
  copy: "Copy",
  regenerate: "Regenerate",
  idLength: "ID Length",
  passwordLength: "Password Length",
  applyIdAndPassword: "Apply ID + Password",
  applyPassword: "Apply Password",

  importWizard: "Import",
  chooseMethod: "Choose Import Method",
  csvImport: "CSV File Import",
  directRead: "Direct Browser Read",
  csvDropDesc: "Supports Chrome, Firefox, Edge CSV export format",
  selectCsvFile: "Click to select a CSV file",
  selectingFile: "Selecting file...",
  supportedFormats: "Supports Chrome, Firefox, Edge CSV export format",
  selectedFile: "Selected file:",
  clickToSelectAnother: "Click to select another file",
  preview: "Preview",
  duplicateResolution: "Duplicate Resolution",
  complete: "Complete",
  importComplete: "Import Complete",

  autoLockTimer: "Auto-lock Timer",
  autoLockDesc: "Lock the app after inactivity.",
  clipboardTimeout: "Clipboard Clear Timeout",
  clipboardTimeoutDesc: "Automatically clear clipboard after copying a password.",
  pinManagement: "Quick Unlock PIN",
  pinManagementDesc: "Set a 4-6 digit PIN for quick unlock.",
  setChangePin: "Set / Change PIN",
  removePin: "Remove PIN",
  savePin: "Save PIN",
  windowsHello: "Windows Hello",
  windowsHelloDesc: "Use biometric authentication to unlock.",
  notAvailable: "Not available on this device",
  browserExtension: "Browser Extension",
  browserExtensionDesc: "Install the Chrome/Edge extension to auto-fill credentials on website logins.",
  downloadExtension: "Download Extension",
  installSteps: "Installation Steps:",
  installStep1: "Click the button above to save the extension folder",
  installStep2: "Open chrome://extensions in Chrome/Edge",
  installStep3: "Enable Developer mode in the top right",
  installStep4: "Click 'Load unpacked'",
  installStep5: "Select the saved MyPwd-Extension folder",
  localServerPort: "Local server port: 27183 (auto-starts with app)",
  about: "About",
  version: "Version",
  language: "Language",
  languageDesc: "Select the app display language.",

  createBackup: "Create Backup",
  createBackupDesc: "Create an encrypted backup file (.mypwd).",
  backupPassword: "Enter master password",
  creating: "Creating...",
  restoreBackup: "Restore Backup",
  restoreBackupDesc: "Restore data from a .mypwd backup file.",
  restoreWarning: "Restoring will completely replace current data.",
  selectBackupFile: "Select backup file",
  restore: "Restore",
  restoring: "Restoring...",
  backupHistory: "Backup History",
  noBackups: "No backup history",

  minutes: "min",
  seconds: "sec",
  extensionSaved: "Extension saved to",
  pinUpdated: "PIN updated successfully.",
  pinRemoved: "PIN removed.",
  autoLockUpdated: "Auto-lock timer updated.",
  clipboardUpdated: "Clipboard timeout updated.",
  credentialsFilled: "Credentials filled!",
  idCopied: "ID copied! Click again to copy password",
  passwordCopied: "Password copied! Ctrl+V to paste",
};

const translations: Record<Lang, Translations> = { ko, en };

export function getTranslations(lang: Lang): Translations {
  return translations[lang];
}
