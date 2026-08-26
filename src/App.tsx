import { useCallback, useState } from "react";
import AuthModal, { type AuthMode } from "./components/AuthModal";
import Checker from "./components/Checker";
import CookieBanner from "./components/CookieBanner";
import { Faq, Footer, Masthead, Method, Ticker } from "./components/Sections";
import {
  IconLogout,
  Logo,
  Toasts,
  type ToastItem,
  type ToastTone,
} from "./components/ui";
import { getSession, logout, type User } from "./lib/engine";

export default function App() {
  const [user, setUser] = useState<User | null>(() => getSession());
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((msg: string, tone: ToastTone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p.slice(-3), { id, msg, tone }]);
    window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4200);
  }, []);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleAuthed = (u: User) => {
    setUser(u);
    setAuthOpen(false);
    notify(`Добро пожаловать, ${u.name || "друг"}! Проверка доступна.`, "ok");
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    notify("Вы вышли из аккаунта", "ok");
  };

  const scrollToChecker = () =>
    document.getElementById("checker")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(46,207,156,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(46,207,156,0.045)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
        <div className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-mint-500/10 blur-[150px]" />
        <div className="absolute -right-44 top-1/3 h-[480px] w-[480px] rounded-full bg-sun-500/[0.07] blur-[150px]" />
        <div className="absolute -bottom-48 left-1/4 h-[420px] w-[420px] rounded-full bg-coral-500/[0.05] blur-[140px]" />
        <div className="noise-layer absolute inset-0" />
      </div>
      <div className="page-scan" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <a href="#top" className="group flex items-center gap-3">
            <Logo className="h-8 w-8 text-mint-400 transition-transform duration-300 group-hover:rotate-6" />
            <span className="font-display text-lg font-bold tracking-wide">ЛАКМУС</span>
            <span className="hidden rounded border border-ink-600 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-fog-500 sm:inline">
              текст-форензика
            </span>
          </a>
          <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-wider text-fog-500 md:flex">
            <a href="#checker" className="transition-colors hover:text-mint-300">Проверка</a>
            <a href="#method" className="transition-colors hover:text-mint-300">Метод</a>
            <a href="#faq" className="transition-colors hover:text-mint-300">Вопросы</a>
          </nav>
          {user ? (
            <div className="flex items-center gap-2.5">
              <span className="hidden items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 sm:flex">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint-400" />
                <span className="max-w-[190px] truncate font-mono text-xs text-fog-300">{user.email}</span>
              </span>
              <button
                onClick={handleLogout}
                title="Выйти из аккаунта"
                aria-label="Выйти из аккаунта"
                className="rounded-lg border border-ink-600 p-2 text-fog-500 transition-all hover:border-coral-400/60 hover:text-coral-300"
              >
                <IconLogout className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button onClick={() => openAuth("login")} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-fog-300 transition-colors hover:text-mint-300">
                Войти
              </button>
              <button onClick={() => openAuth("register")} className="rounded-lg bg-mint-500 px-4 py-2 text-sm font-bold text-ink-950 shadow-md shadow-mint-500/20 transition-all hover:bg-mint-400 active:translate-y-px">
                Регистрация
              </button>
            </div>
          )}
        </div>
      </header>

      <main id="top" className="relative z-10">
        <Masthead onCta={scrollToChecker} />
        <Checker user={user} onRequireAuth={() => openAuth("login")} notify={notify} />
        <Ticker />
        <Method />
        <Faq />
      </main>
      <Footer />
      <AuthModal open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} onMode={setAuthMode} onAuthed={handleAuthed} />
      <Toasts items={toasts} />
      <CookieBanner />
    </div>
  );
}