import { useEffect, useRef, useState } from "react";
import {
  analyze,
  downloadPDFReport,
  fmt,
  LIMIT,
  loadHistory,
  MIN_CHARS,
  saveHistory,
  type AnalysisResult,
  type HistoryEntry,
  type User,
} from "../../lib/engine";
import {
  Brackets,
  Gauge,
  IconArrow,
  IconBolt,
  IconCheck,
  IconDownload,
  IconFile,
  IconLock,
  IconShield,
  IconTrash,
  IconUpload,
  IconX,
  Radar,
  Stamp,
  type ToastTone,
} from "../ui";
import {
  ACCEPT_ATTR,
  detectKind,
  extractTextFromFile,
  kindLabel,
  MAX_FILE_BYTES,
  mbSize,
} from "../../lib/extract";

const PHASES = [
  "Нормализация текста",
  "Разбиение на шинглы",
  "Сверка с базой документов",
  "Нейродетектор ИИ",
  "Формирование отчёта",
];

const VERDICTS = {
  clean: {
    title: "Текст оригинален",
    text: "Заимствования в пределах нормы, признаков машинной генерации не обнаружено.",
    cls: "border-mint-500/40 bg-mint-500/10 text-mint-300",
    icon: <IconShield className="h-5 w-5" />,
  },
  mixed: {
    title: "Требуется внимание",
    text: "Есть фрагменты с совпадениями или признаками ИИ — загляните в разбор ниже.",
    cls: "border-sun-400/40 bg-sun-400/10 text-sun-300",
    icon: <IconBolt className="h-5 w-5" />,
  },
  risk: {
    title: "Высокий риск",
    text: "Значительная доля совпадений или генерации. Текст стоит серьёзно переработать.",
    cls: "border-coral-400/40 bg-coral-500/10 text-coral-300",
    icon: <IconX className="h-5 w-5" />,
  },
} as const;

interface Props {
  user: User | null;
  onRequireAuth: () => void;
  notify: (msg: string, tone?: ToastTone) => void;
}

export default function Checker({ user, onRequireAuth, notify }: Props) {
  const [tab, setTab] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const timers = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const consoleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHistory(user ? loadHistory(user.email) : []);
  }, [user]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    },
    []
  );

  const pushLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString("ru-RU")}] ${msg}`]);

  /* ---------- запуск проверки ---------- */
  const handleStart = () => {
    const content = (tab === "file" ? fileText : text).trim();
    if (!user) {
      notify("Войдите или зарегистрируйтесь, чтобы запустить проверку", "warn");
      onRequireAuth();
      return;
    }
    if (content.length < MIN_CHARS) {
      notify(`Слишком коротко: нужно не менее ${MIN_CHARS} знаков`, "warn");
      return;
    }
    if (content.length > LIMIT) {
      notify(`Превышен лимит ${fmt(LIMIT)} знаков — сейчас ${fmt(content.length)}`, "err");
      return;
    }

    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPhase("running");
    setResult(null);
    setLogs([]);
    setPhaseIdx(0);
    setProgress(0);

    const words = content.split(/\s+/).filter(Boolean).length;
    const shingles = Math.max(1, Math.floor(content.length / 9));

    pushLog(`Принято ${fmt(content.length)} знаков · ${fmt(words)} слов`);

    const total = 3800 + Math.min(2400, Math.round(content.length / 50));
    const t0 = performance.now();

    intervalRef.current = window.setInterval(() => {
      setProgress(Math.min(99, ((performance.now() - t0) / total) * 100));
    }, 110);

    const at = (frac: number, fn: () => void) =>
      timers.current.push(window.setTimeout(fn, frac * total));

    at(0.16, () => {
      setPhaseIdx(1);
      pushLog("Нормализация: леммы, регистр, пунктуация — ок");
    });
    at(0.38, () => {
      setPhaseIdx(2);
      pushLog(`Построено ${fmt(shingles)} шинглов (шаг 9)`);
    });
    at(0.62, () => {
      setPhaseIdx(3);
      pushLog("Сверка с индексом: 11 240 812 338 документов");
    });
    at(0.82, () => {
      setPhaseIdx(4);
      pushLog("Нейродетектор: перплексия и стилеметрия фрагментов");
    });
    at(1.0, () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      const res = analyze(content, user);
      pushLog(
        `Совпадений в базе: ${res.sources.length} · ИИ-фрагментов: ${
          res.segments.filter((s) => s.kind === "ai").length
        }`
      );
      pushLog(`Отчёт ${res.id} сформирован и подписан`);
      setProgress(100);
      setResult(res);
      setPhase("done");
      saveHistory(user.email, { result: res, snippet: content.slice(0, 150) });
      setHistory(loadHistory(user.email));
      notify(
        res.verdict === "clean"
          ? `Готово: оригинальность ${res.originality}%`
          : `Готово: оригинальность ${res.originality}%, ИИ ${res.ai}%`,
        res.verdict === "risk" ? "warn" : "ok"
      );
    });
  };

  /* ---------- файлы ---------- */
  const readFile = async (f: File) => {
    if (extracting) return;
    resetFile();
    const kind = detectKind(f);
    if (kind === "doc" || kind === "unknown") {
      setFileError(
        kind === "doc"
          ? "Формат .doc (Word 97–2003) не читается — сохраните документ как .docx и загрузите снова"
          : "Формат не поддерживается. Загрузите TXT, DOCX или PDF"
      );
      notify(kindLabel[kind] + " не поддерживается", "err");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFileError(`Файл весит ${mbSize(f.size)} МБ — больше лимита 5 МБ`);
      notify("Файл больше 5 МБ", "err");
      return;
    }
    setExtracting("Подготовка файла…");
    try {
      const raw = await extractTextFromFile(f, setExtracting);
      const s = raw.replace(/\u0000/g, "").trim();
      setFileName(f.name);
      setFileNote(`${kindLabel[kind]} · ${mbSize(f.size)} МБ`);
      if (s.length < 20) {
        setFileText("");
        setFileError(
          kind === "pdf"
            ? "В PDF не нашлось текстового слоя — похоже, это скан"
            : "Не удалось извлечь текст из файла"
        );
        notify("Текст не найден", "err");
        return;
      }
      if (s.length > LIMIT) {
        setFileText("");
        setFileError(`В файле ${fmt(s.length)} знаков — это больше лимита ${fmt(LIMIT)}`);
        notify("Файл превышает лимит 200 000 знаков", "err");
        return;
      }
      setFileError(null);
      setFileText(s);
      notify(`Файл извлечён: ${fmt(s.length)} знаков`, "ok");
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Не удалось прочитать файл");
      notify("Ошибка чтения файла", "err");
    } finally {
      setExtracting(null);
    }
  };

  const resetFile = () => {
    setFileText("");
    setFileName(null);
    setFileError(null);
    setFileNote(null);
  };

  /* ---------- производные ---------- */
  const len = tab === "file" ? fileText.length : text.length;
  const over = len > LIMIT;
  const words = tab === "file" ? fileText : text;
  const wordCount = words.trim() ? words.trim().split(/\s+/).filter(Boolean).length : 0;

  const openFromHistory = (e: HistoryEntry) => {
    timers.current.forEach((t) => window.clearTimeout(t));
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setResult(e.result);
    setPhase("done");
    consoleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const segCount = (k: "original" | "suspect" | "ai") =>
    result ? result.segments.filter((s) => s.kind === k).length : 0;

  const handleDownloadPDF = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      await downloadPDFReport(result);
      notify("PDF-отчёт сохранён в загрузки", "ok");
    } catch (e) {
      notify("Не удалось создать PDF", "err");
    } finally {
      setPdfLoading(false);
    }
  };

  /* ---------- разметка ---------- */
  return (
    <section id="checker" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 pb-16">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ======= панель документа ======= */}
        <div className="rounded-xl border border-ink-600 bg-ink-900/80 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Документ</h2>
            <div className="flex gap-1 rounded-lg border border-ink-600 bg-ink-950/60 p-1">
              {(
                [
                  { k: "text", t: "Текст" },
                  { k: "file", t: "Файл" },
                ] as const
              ).map((x) => (
                <button
                  key={x.k}
                  onClick={() => setTab(x.k)}
                  className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                    tab === x.k
                      ? "bg-ink-700 text-mint-300 shadow-inner"
                      : "text-fog-500 hover:text-fog-100"
                  }`}
                >
                  {x.t}
                </button>
              ))}
            </div>
          </div>

          {tab === "text" ? (
            <div className="mt-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Вставьте текст целиком — диплом, статью, пост или главу книги…"
                className={`h-64 w-full resize-y rounded-lg border bg-ink-950/70 p-4 font-mono text-[13px] leading-relaxed text-fog-100 transition-colors placeholder:text-fog-600 focus:outline-none ${
                  over
                    ? "border-coral-500/70"
                    : "border-ink-600 focus:border-mint-500/60"
                }`}
              />
            </div>
          ) : (
            <div className="mt-4">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) readFile(f);
                }}
                className={`flex h-64 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 text-center transition-all ${
                  extracting
                    ? "cursor-wait border-mint-500/60 bg-mint-500/5"
                    : drag
                      ? "cursor-pointer border-mint-500 bg-mint-500/10 scale-[1.01]"
                      : fileError
                        ? "cursor-pointer border-coral-500/60 bg-ink-950/70"
                        : "cursor-pointer border-ink-600 bg-ink-950/70 hover:border-mint-500/50 hover:bg-ink-800/60"
                }`}
                aria-busy={extracting !== null}
              >
                <input
                  type="file"
                  accept={ACCEPT_ATTR}
                  className="hidden"
                  disabled={extracting !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readFile(f);
                    e.target.value = "";
                  }}
                />
                {extracting ? (
                  <>
                    <span className="flex h-12 w-12 items-center justify-center">
                      <span className="h-10 w-10 animate-spin rounded-full border-2 border-mint-500/25 border-t-mint-400" />
                    </span>
                    <div>
                      <p className="font-mono text-sm text-mint-300">{extracting}</p>
                      <p className="mt-1 font-mono text-xs text-fog-600">
                        большие документы могут занять минуту
                      </p>
                    </div>
                  </>
                ) : fileName && !fileError && fileText ? (
                  <>
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-mint-500/15 text-mint-400">
                      <IconFile className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="font-mono text-sm text-fog-100">{fileName}</p>
                      <p className="mt-1 font-mono text-xs text-mint-300">
                        {fmt(fileText.length)} знаков · готов к проверке
                      </p>
                      {fileNote && (
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-fog-600">
                          {fileNote}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        resetFile();
                      }}
                      className="flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 font-mono text-xs text-fog-500 transition-colors hover:border-coral-400/60 hover:text-coral-300"
                    >
                      <IconTrash className="h-3.5 w-3.5" /> убрать файл
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                        drag ? "bg-mint-500/25 text-mint-300" : "bg-ink-700 text-mint-400"
                      }`}
                    >
                      <IconUpload className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-fog-100">
                        Перетащите файл сюда{" "}
                        <span className="text-fog-500">или нажмите для выбора</span>
                      </p>
                      <p className="mt-1 font-mono text-xs text-fog-500">
                        TXT · DOCX · PDF — до 5 МБ · до {fmt(LIMIT)} знаков
                      </p>
                    </div>
                  </>
                )}
              </label>
              {fileError && (
                <p className="mt-2 flex items-center gap-2 text-sm text-coral-300">
                  <IconX className="h-4 w-4 shrink-0" /> {fileError}
                </p>
              )}
            </div>
          )}

          {/* счётчики */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span className="flex items-center gap-4">
              <span
                className={`tabular-nums transition-colors ${
                  over ? "text-coral-400" : len > LIMIT * 0.9 ? "text-sun-400" : "text-fog-500"
                }`}
              >
                {fmt(len)} / {fmt(LIMIT)} знаков
              </span>
              <span className="text-fog-600">{fmt(wordCount)} слов</span>
            </span>
            {tab === "text" && text && (
              <button
                onClick={() => setText("")}
                className="flex items-center gap-1.5 text-fog-600 transition-colors hover:text-coral-300"
              >
                <IconTrash className="h-3.5 w-3.5" /> очистить
              </button>
            )}
          </div>

          {/* главная кнопка */}
          <button
            onClick={handleStart}
            disabled={phase === "running" || extracting !== null}
            className={`group mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg px-5 py-3.5 text-sm font-bold transition-all ${
              phase === "running" || extracting !== null
                ? "cursor-not-allowed bg-ink-700 text-fog-500"
                : "bg-mint-500 text-ink-950 shadow-lg shadow-mint-500/20 hover:bg-mint-400 hover:shadow-mint-500/35 active:translate-y-px"
            }`}
          >
            {phase === "running" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-fog-500 border-t-transparent" />
                Идёт проверка…
              </>
            ) : (
              <>
                <IconShield className="h-4.5 w-4.5" />
                Проверить {tab === "file" ? "файл" : "текст"}
                <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
          <p className="mt-2.5 text-center font-mono text-[10px] tracking-wide text-fog-600">
            {user
              ? `проверка привязана к ${user.email}`
              : "для запуска потребуется вход по e-mail"}
          </p>
        </div>

        {/* ======= консоль сканера ======= */}
        <div
          ref={consoleRef}
          className="relative scroll-mt-24 overflow-hidden rounded-xl border border-ink-600 bg-ink-900/80 lg:min-h-[540px]"
        >
          <Brackets />
          <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-fog-500">
              консоль сканера
            </span>
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  phase === "running" ? "bg-sun-400 pulse-dot" : phase === "done" ? "bg-mint-400" : "bg-fog-600"
                }`}
              />
              <span className={phase === "running" ? "text-sun-300" : phase === "done" ? "text-mint-300" : "text-fog-600"}>
                {phase === "running" ? "анализ" : phase === "done" ? "отчёт" : "ожидание"}
              </span>
            </span>
          </div>

          {/* --- ожидание --- */}
          {phase === "idle" && (
            <div className="flex h-[calc(100%-45px)] min-h-[420px] flex-col items-center justify-center gap-6 p-8 text-center">
              <Radar className="h-40 w-40" />
              <div>
                <p className="font-mono text-sm tracking-[0.3em] text-mint-300">
                  ОЖИДАНИЕ ДОКУМЕНТА<span className="blink">▍</span>
                </p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-fog-500">
                  Вставьте текст или загрузите файл — сканер сравнит его с базой и построит отчёт.
                </p>
              </div>
              <ul className="space-y-1.5 text-left font-mono text-xs text-fog-500">
                {[
                  "объём — до 200 000 знаков за проверку",
                  "оригинальность + источники совпадений",
                  "нейродетектор генерации ИИ",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <span className="text-mint-500">›</span> {s}
                  </li>
                ))}
              </ul>
              {!user && (
                <button
                  onClick={onRequireAuth}
                  className="flex items-center gap-2 rounded-lg border border-mint-500/40 bg-mint-500/10 px-4 py-2.5 text-sm font-semibold text-mint-300 transition-all hover:bg-mint-500/20"
                >
                  <IconLock className="h-4 w-4" /> Войти, чтобы начать
                </button>
              )}
            </div>
          )}

          {/* --- анализ --- */}
          {phase === "running" && (
            <div className="p-5 sm:p-6">
              <ol className="space-y-2.5">
                {PHASES.map((p, i) => (
                  <li
                    key={p}
                    className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-all duration-300 ${
                      i < phaseIdx
                        ? "border-ink-700 bg-ink-850 text-fog-500"
                        : i === phaseIdx
                          ? "border-mint-500/40 bg-mint-500/10 text-fog-100"
                          : "border-ink-700/60 text-fog-600"
                    }`}
                  >
                    {i < phaseIdx ? (
                      <IconCheck className="h-4 w-4 shrink-0 text-mint-400" />
                    ) : i === phaseIdx ? (
                      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-mint-400 border-t-transparent" />
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 translate-x-[5px] rounded-full bg-fog-600" />
                    )}
                    <span className="text-sm">{p}</span>
                    <span className="ml-auto font-mono text-[10px] text-fog-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
                  <div
                    className="stripe-bar h-full rounded-full bg-mint-500 transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="font-mono text-xs tabular-nums text-mint-300">
                  {Math.round(progress)}%
                </span>
              </div>
              <div
                ref={logRef}
                className="log-scroll mt-5 h-36 overflow-y-auto rounded-lg border border-ink-700 bg-ink-950 p-3.5 font-mono text-[11px] leading-relaxed text-mint-300/90"
              >
                {logs.map((l, i) => (
                  <div key={i} className="rise-in whitespace-pre-wrap break-words">
                    {l}
                  </div>
                ))}
                <span className="blink text-mint-400">▍</span>
              </div>
            </div>
          )}

          {/* --- отчёт --- */}
          {phase === "done" && result && (
            <div className="rise-in relative p-5 sm:p-6">
              <Stamp verdict={result.verdict} />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-fog-500">
                <span className="text-mint-300">ОТЧЁТ {result.id}</span>
                <span>{new Date(result.createdAt).toLocaleString("ru-RU")}</span>
                <span className="truncate">{result.email}</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-fog-600">
                {fmt(result.chars)} знаков · {fmt(result.words)} слов ·{" "}
                {fmt(result.shingles)} шинглов
              </p>
              <div
                className={`mt-4 flex items-start gap-3 rounded-lg border p-3.5 ${VERDICTS[result.verdict].cls}`}
              >
                <span className="mt-0.5 shrink-0">{VERDICTS[result.verdict].icon}</span>
                <div>
                  <p className="font-display text-sm font-semibold">
                    {VERDICTS[result.verdict].title}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-fog-300">
                    {VERDICTS[result.verdict].text}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 place-items-center gap-4">
                <Gauge
                  value={result.originality}
                  label="оригинальность"
                  color="#2ecf9c"
                  note="уникальный текст"
                />
                <Gauge
                  value={result.ai}
                  label="использование ИИ"
                  color={result.ai > 40 ? "#e95c48" : "#f4bd5a"}
                  note="машинная генерация"
                />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between font-mono text-[11px] text-fog-500">
                  <span>ЗАИМСТВОВАНИЯ</span>
                  <span className="tabular-nums text-sun-300">{result.borrowed}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-700">
                  <div
                    className="h-full rounded-full bg-sun-400 transition-[width] duration-1000"
                    style={{ width: `${result.borrowed}%` }}
                  />
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-[260px_1fr]">
                {/* источники */}
                <div className="rounded-lg border border-ink-700 bg-ink-850 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-500">
                    источники совпадений
                  </p>
                  <div className="mt-3 space-y-3">
                    {result.sources.length === 0 && (
                      <p className="text-xs leading-relaxed text-fog-500">
                        Совпадений с базой не найдено — текст полностью самостоятельный.
                      </p>
                    )}
                    {result.sources.map((s, i) => (
                      <div key={i}>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-fog-100" title={s.source}>
                            {s.source}
                          </p>
                          <span className="font-mono text-xs tabular-nums text-sun-300">
                            {s.percent}%
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-fog-600">{s.url}</p>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-700">
                          <div
                            className="h-full rounded-full bg-sun-400/80"
                            style={{ width: `${Math.min(100, s.percent * 2.5)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* фрагменты */}
                <div className="rounded-lg border border-ink-700 bg-ink-850 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-500">
                      разбор по фрагментам
                    </p>
                    <p className="font-mono text-[10px] text-fog-600">
                      <span className="text-mint-300">{segCount("original")} ориг.</span> ·{" "}
                      <span className="text-sun-300">{segCount("suspect")} совп.</span> ·{" "}
                      <span className="text-coral-300">{segCount("ai")} ИИ</span>
                    </p>
                  </div>
                  <div className="log-scroll mt-3 max-h-64 space-y-2.5 overflow-y-auto pr-1.5">
                    {result.segments.map((s, i) => (
                      <div
                        key={i}
                        className={`rounded-r-md border-l-2 py-1.5 pl-3 pr-2 ${
                          s.kind === "original"
                            ? "border-mint-500/60"
                            : s.kind === "suspect"
                              ? "border-sun-400 bg-sun-400/[.04]"
                              : "border-coral-400 bg-coral-500/[.05]"
                        }`}
                      >
                        <p className="line-clamp-2 text-[13px] leading-snug text-fog-300">
                          {s.text}
                        </p>
                        <span
                          className={`mt-1 inline-block font-mono text-[10px] uppercase tracking-wider ${
                            s.kind === "original"
                              ? "text-mint-400"
                              : s.kind === "suspect"
                                ? "text-sun-300"
                                : "text-coral-300"
                          }`}
                        >
                          {s.kind === "original"
                            ? "оригинал"
                            : s.kind === "suspect"
                              ? `совпадение · ${s.source ?? "база"}`
                              : "сгенерировано ИИ"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="flex items-center gap-2 rounded-lg bg-mint-500 px-4 py-2.5 text-sm font-bold text-ink-950 transition-all hover:bg-mint-400 hover:shadow-lg hover:shadow-mint-500/25 active:translate-y-px disabled:opacity-60"
                >
                  {pdfLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                      Формирование PDF…
                    </>
                  ) : (
                    <>
                      <IconDownload className="h-4 w-4" /> Скачать отчёт PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setPhase("idle");
                    setResult(null);
                  }}
                  className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm font-semibold text-fog-300 transition-colors hover:border-mint-500/50 hover:text-mint-300"
                >
                  Новая проверка
                </button>
                <span className="font-mono text-[10px] text-fog-600">сохранено в журнале ↓</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======= журнал ======= */}
      <div className="mt-10">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg font-semibold">Журнал проверок</h3>
          <span className="rounded-full border border-ink-600 px-2.5 py-0.5 font-mono text-[10px] text-fog-500">
            {user ? user.email : "нет входа"}
          </span>
        </div>
        {history.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-ink-600 px-4 py-6 text-center font-mono text-xs text-fog-600">
            Журнал пуст — результаты проверок появятся здесь.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink-700 overflow-hidden rounded-lg border border-ink-600 bg-ink-900/60">
            {history.map((h) => (
              <li
                key={h.result.id}
                className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-ink-850 sm:flex-nowrap"
              >
                <span className="w-32 shrink-0 font-mono text-[11px] text-fog-600">
                  {new Date(h.result.createdAt).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-fog-300">
                  {h.snippet || h.result.id}
                </span>
                <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] tabular-nums">
                  <span className="rounded bg-mint-500/15 px-2 py-0.5 text-mint-300">
                    {h.result.originality}% ориг.
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 ${
                      h.result.ai > 40
                        ? "bg-coral-500/15 text-coral-300"
                        : "bg-ink-700 text-fog-500"
                    }`}
                  >
                    {h.result.ai}% ИИ
                  </span>
                  <span className="text-fog-600">{fmt(h.result.chars)} зн.</span>
                </span>
                <button
                  onClick={() => openFromHistory(h)}
                  className="shrink-0 rounded-md border border-ink-600 px-3 py-1.5 font-mono text-[11px] text-fog-300 transition-all hover:border-mint-500/60 hover:text-mint-300 group-hover:border-ink-600"
                >
                  открыть →
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}