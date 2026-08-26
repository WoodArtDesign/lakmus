import { useEffect, useState, type FormEvent } from "react";
import { updateUserName, type User } from "../lib/engine";
import { Brackets, IconX } from "./ui";

// Иконка пользователя (добавлена сюда, чтобы не менять файл ui.tsx)
const IconUser = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface Props {
  open: boolean;
  user: User;
  onClose: () => void;
  onUpdate: (newName: string) => void;
}

const input =
  "w-full rounded-lg border border-ink-600 bg-ink-950/70 px-3.5 py-2.5 text-sm text-fog-100 placeholder:text-fog-600 transition-colors focus:border-mint-500/70 focus:outline-none";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-fog-500";

export default function ProfileModal({ open, user, onClose, onUpdate }: Props) {
  const [name, setName] = useState(user.name || "");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(user.name || "");
      setErr(null);
    }
  }, [open, user]);

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
    
    const res = updateUserName(user.email, name);
    if (res.error) {
      setErr(res.error);
      return;
    }
    if (res.user) {
      onUpdate(res.user.name);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/75 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Настройки профиля"
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
          настройки
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold">Профиль</h2>
        <p className="mt-2 text-sm leading-relaxed text-fog-500">
          Измените своё ФИО. Оно будет отображаться в PDF-отчётах и журнале проверок.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <div>
            <label className={label} htmlFor="p-email">E-mail (нельзя изменить)</label>
            <div className="relative">
              <input
                id="p-email"
                type="email"
                className={`${input} pl-3.5 opacity-60 cursor-not-allowed`}
                value={user.email}
                disabled
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="p-name">ФИО</label>
            <div className="relative">
              <IconUser className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fog-600" />
              <input
                id="p-name"
                className={`${input} pl-10`}
                placeholder="Иванов Иван Иванович"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          {err && (
            <p className="rounded-lg border border-coral-400/40 bg-coral-500/10 px-3.5 py-2.5 text-sm text-coral-300">
              {err}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-ink-600 px-5 py-3 text-sm font-semibold text-fog-300 transition-colors hover:border-mint-500/50 hover:text-mint-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-mint-500 px-5 py-3 text-sm font-bold text-ink-950 transition-all hover:bg-mint-400 hover:shadow-lg hover:shadow-mint-500/25 active:translate-y-px"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}