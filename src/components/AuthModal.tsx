import { useEffect, useState, type FormEvent } from "react";
import { login, register, resetPassword, type User } from "../lib/engine";
import { Brackets, IconLock, IconMail, IconX } from "./ui";

export type AuthMode = "login" | "register" | "reset";

interface Props {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onMode: (m: AuthMode) => void;
  onAuthed: (u: User) => void;
}

const input =
  "w-full rounded-lg border border-ink-600 bg-ink-950/70 px-3.5 py-2.5 text-sm text-fog-100 placeholder:text-fog-600 transition-colors focus:border-mint-500/70 focus:outline-none";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-fog-500";

export default function AuthModal({ open, mode, onClose, onMode, onAuthed }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErr(null);
      setResetMsg(null);
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setResetMsg(null);

    if (mode === "reset") {
      const res = resetPassword(email);
      if (res.error) {
        setErr(res.error);
      } else if (res.newPassword) {
        setResetMsg(res.newPassword);
      }
      return;
    }

    const r = mode === "register" ? register(email, name, pass) : login(email, pass);
    if (r.error) {
      setErr(r.error);
      return;
    }
    if (r.user) onAuthed(r.user);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/75 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "register" ? "Регистрация" : mode === "reset" ? "Сброс пароля" : "Вход"}
    >
      <div
        className="rise-in relative w-full max-w-md rounded-xl border border-ink-600 bg-ink-900 p-7 shadow-2xl shadow-black/50"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Brackets className="border-mint-500/40" />
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 rounded-md p-1.5 text-fog-500 transition-colors hover:bg-ink-800 hover:text-fog-100"
        >
          <IconX className="h-4 w-4" />
        </button>

        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mint-400">
          доступ к проверке
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold">
          {mode === "register" ? "Создать аккаунт" : mode === "reset" ? "Сброс пароля" : "С возвращением"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fog-500">
          {mode === "register"
            ? "Регистрация по e-mail занимает десять секунд — журнал проверок привяжется к адресу."
            : mode === "reset"
            ? "Введите e-mail, и мы покажем вам новый временный пароль для входа."
            : "Войдите, чтобы запустить проверку и открыть журнал отчётов."}
        </p>

        {mode !== "reset" && (
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-ink-600 bg-ink-950/60 p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMode(m)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                  mode === m
                    ? "bg-mint-500 text-ink-950 shadow-md shadow-mint-500/20"
                    : "text-fog-500 hover:text-fog-100"
                }`}
              >
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          {mode === "register" && (
            <div>
              <label className={label} htmlFor="f-name">ФИО (необязательно)</label>
              <input
                id="f-name"
                className={input}
                placeholder="Иванов Иван Иванович"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}
          
          <div>
            <label className={label} htmlFor="f-email">E-mail</label>
            <div className="relative">
              <IconMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fog-600" />
              <input
                id="f-email"
                type="email"
                className={`${input} pl-10`}
                placeholder="you@example.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {mode !== "reset" && (
            <div>
              <label className={label} htmlFor="f-pass">Пароль</label>
              <div className="relative">
                <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fog-600" />
                <input
                  id="f-pass"
                  type="password"
                  className={`${input} pl-10`}
                  placeholder={mode === "register" ? "Минимум 6 символов" : "Ваш пароль"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </div>
            </div>
          )}

          {err && (
            <p className="rounded-lg border border-coral-400/40 bg-coral-500/10 px-3.5 py-2.5 text-sm text-coral-300">
              {err}
            </p>
          )}

          {resetMsg && (
            <div className="rounded-lg border border-mint-500/40 bg-mint-500/10 px-3.5 py-3 text-sm text-mint-300">
              <p className="font-semibold mb-1">Пароль успешно сброшен!</p>
              <p className="mb-2 text-fog-300">Ваш новый временный пароль:</p>
              <div className="flex items-center justify-between bg-ink-950 rounded p-2 font-mono text-lg tracking-wider text-mint-400">
                <span>{resetMsg}</span>
                <button 
                  type="button"
                  onClick={() => navigator.clipboard.writeText(resetMsg)}
                  className="text-xs text-fog-500 hover:text-mint-300"
                >
                  копировать
                </button>
              </div>
              <p className="mt-2 text-xs text-fog-500">Скопируйте его и используйте для входа.</p>
            </div>
          )}

          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-mint-500 px-5 py-3 text-sm font-bold text-ink-950 transition-all hover:bg-mint-400 hover:shadow-lg hover:shadow-mint-500/25 active:translate-y-px"
          >
            {mode === "register" ? "Зарегистрироваться" : mode === "reset" ? "Сбросить пароль" : "Войти"}
          </button>
        </form>

        {mode === "login" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => onMode("reset")}
              className="text-xs font-mono text-fog-500 underline decoration-dotted underline-offset-4 transition-colors hover:text-mint-300"
            >
              Забыли пароль?
            </button>
          </div>
        )}

        {mode === "reset" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => onMode("login")}
              className="text-xs font-mono text-fog-500 underline decoration-dotted underline-offset-4 transition-colors hover:text-mint-300"
            >
              ← Вернуться ко входу
            </button>
          </div>
        )}
      </div>
    </div>
  );
}