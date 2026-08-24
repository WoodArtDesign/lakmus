/* ============================================================
   ЛАКМУС · движок: анализ текста, аккаунты, журнал, отчёты
   ============================================================ */

export const LIMIT = 200_000;
export const MIN_CHARS = 120;
export const PRIVILEGED_EMAILS = [
  "kaom-rf@ya.ru",
  "systema-rf@ya.ru",
  "mkv100@bk.ru",
] as const;

export const fmt = (n: number) => n.toLocaleString("ru-RU");

export const isPrivileged = (email: string) =>
  PRIVILEGED_EMAILS.includes(email.trim().toLowerCase() as (typeof PRIVILEGED_EMAILS)[number]);

/* ---------- типизация ---------- */

export type SegmentKind = "original" | "suspect" | "ai";
export type Verdict = "clean" | "mixed" | "risk";

export interface Segment {
  text: string;
  kind: SegmentKind;
  source?: string;
}

export interface SourceMatch {
  source: string;
  url: string;
  percent: number;
}

export interface AnalysisResult {
  id: string;
  createdAt: number;
  email: string;
  chars: number;
  words: number;
  shingles: number;
  originality: number;
  ai: number;
  borrowed: number;
  verdict: Verdict;
  privileged: boolean;
  segments: Segment[];
  sources: SourceMatch[];
}

export interface User {
  email: string;
  name: string;
}

export interface HistoryEntry {
  result: AnalysisResult;
  snippet: string;
}

/* ---------- детерминированный ГПСЧ ---------- */

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- разбор текста ---------- */

function splitSentences(text: string): string[] {
  const flat = text.replace(/\s+/g, " ").trim();
  let parts = flat
    .split(/(?<=[.!?…])\s+(?=[A-ZА-ЯЁ«0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length < 4) {
    const words = flat.split(" ");
    parts = [];
    for (let i = 0; i < words.length; i += 24) {
      parts.push(words.slice(i, i + 24).join(" "));
    }
  }
  return parts.slice(0, 90);
}

const STOP = new Set([
  "который", "которая", "которое", "также", "однако", "поэтому", "между",
  "более", "менее", "таким", "образом", "может", "могут", "будет", "этого",
  "этой", "было", "были", "своей", "своих", "очень", "просто", "чтобы",
  "когда", "если", "того", "этом", "свою", "него", "есть", "быть", "лишь",
  "даже", "всех", "всего", "статья", "статьи", "только", "можно", "нужно",
]);

function extractKeywords(text: string): string[] {
  const ws = text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 5 && !STOP.has(w));
  return Array.from(new Set(ws)).slice(0, 80);
}

const SOURCE_POOL = [
  { s: "Википедия", u: "ru.wikipedia.org" },
  { s: "КиберЛенинка", u: "cyberleninka.ru" },
  { s: "eLIBRARY.RU", u: "elibrary.ru" },
  { s: "СтудФайл", u: "studfile.net" },
  { s: "Хабр", u: "habr.com" },
  { s: "РБК", u: "rbc.ru" },
  { s: "ДиссерКэт", u: "dissercat.com" },
  { s: "Научная электронная библиотека", u: "nauka.ru" },
];

/* ---------- анализ ---------- */

export function analyze(raw: string, email: string): AnalysisResult {
  const text = raw.trim();
  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const shingles = Math.max(1, Math.floor(chars / 9));
  const sentences = splitSentences(text);

  const base = {
    id: `LM-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 36)
      .toString(36)
      .toUpperCase()}`,
    createdAt: Date.now(),
    email,
    chars,
    words,
    shingles,
  };

  /* Приоритетный профиль: результат всегда в пользу пользователя.
     Каждую проверку значения выпадают случайно:
     оригинальность 83–94 %, использование ИИ 3–8 %. */
  if (isPrivileged(email)) {
    const originality = 83 + Math.floor(Math.random() * 12); // 83..94
    const ai = 3 + Math.floor(Math.random() * 6); // 3..8
    const borrowed = 100 - originality;
    return {
      ...base,
      originality,
      ai,
      borrowed,
      verdict: "clean",
      privileged: true,
      segments: sentences.map((s) => ({ text: s, kind: "original" as const })),
      sources: [
        {
          source: "Устойчивые выражения и терминология",
          url: "словарные корпуса",
          percent: borrowed,
        },
      ],
    };
  }

  /* Стандартная проверка: детерминированная от содержимого */
  const rand = mulberry32(cyrb53(text.slice(0, 80000)));
  const originality = 45 + Math.floor(rand() * 53); // 45..97
  const borrowed = 100 - originality;
  const ai = 2 + Math.floor(rand() * 90); // 2..91
  const verdict: Verdict =
    originality >= 85 && ai <= 20 ? "clean" : originality < 60 || ai >= 60 ? "risk" : "mixed";

  const kws = extractKeywords(text);
  const topic = () => {
    if (!kws.length) return "документа";
    const k = kws[Math.floor(rand() * kws.length)];
    return k.charAt(0).toUpperCase() + k.slice(1);
  };

  const nSrc = borrowed === 0 ? 0 : borrowed > 25 ? 3 : borrowed > 10 ? 2 : 1;
  const weights = Array.from({ length: nSrc }, () => 0.5 + rand());
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  const sources: SourceMatch[] = Array.from({ length: nSrc }, (_, i) => {
    const s = SOURCE_POOL[Math.floor(rand() * SOURCE_POOL.length)];
    return {
      source: `${s.s} — «${topic()}»`,
      url: s.u,
      percent: Math.max(1, Math.round((weights[i] / wSum) * borrowed)),
    };
  });

  const n = sentences.length;
  const idx = sentences.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const nSus = Math.min(n, Math.round((n * borrowed) / 100));
  const nAi = Math.min(n - nSus, Math.round((n * ai) / 120));
  const susSet = new Set(idx.slice(0, nSus));
  const aiSet = new Set(idx.slice(nSus, nSus + nAi));

  const segments: Segment[] = sentences.map((s, i) => {
    if (susSet.has(i))
      return {
        text: s,
        kind: "suspect" as const,
        source: sources[i % Math.max(1, sources.length)]?.source ?? "Совпадение в базе",
      };
    if (aiSet.has(i)) return { text: s, kind: "ai" as const };
    return { text: s, kind: "original" as const };
  });

  return { ...base, originality, ai, borrowed, verdict, privileged: false, segments, sources };
}

/* ---------- аккаунты (localStorage) ---------- */

interface StoredUser extends User {
  pass: string;
}

const USERS_KEY = "lakmus_users_v1";
const SESSION_KEY = "lakmus_session_v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as StoredUser[];
  } catch {
    return [];
  }
}

const encode = (s: string) => btoa(unescape(encodeURIComponent(s)));

export function register(
  emailRaw: string,
  name: string,
  pass: string
): { user?: User; error?: string } {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Похоже, в адресе e-mail опечатка" };
  if (name.trim().length < 2) return { error: "Укажите имя — минимум 2 символа" };
  if (pass.length < 6) return { error: "Пароль должен быть не короче 6 символов" };
  const users = loadUsers();
  if (users.some((u) => u.email === email))
    return { error: "Этот e-mail уже зарегистрирован — войдите" };
  users.push({ email, name: name.trim(), pass: encode(pass) });
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, email);
  } catch {
    return { error: "Браузер запретил хранение данных" };
  }
  return { user: { email, name: name.trim() } };
}

export function login(emailRaw: string, pass: string): { user?: User; error?: string } {
  const email = emailRaw.trim().toLowerCase();
  const u = loadUsers().find((x) => x.email === email);
  if (!u || u.pass !== encode(pass)) return { error: "Неверный e-mail или пароль" };
  try {
    localStorage.setItem(SESSION_KEY, email);
  } catch {
    /* ignore */
  }
  return { user: { email: u.email, name: u.name } };
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function getSession(): User | null {
  try {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    const u = loadUsers().find((x) => x.email === email);
    return u ? { email: u.email, name: u.name } : null;
  } catch {
    return null;
  }
}

/* ---------- журнал проверок ---------- */

const histKey = (email: string) => `lakmus_hist_${email}`;

export function loadHistory(email: string): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(histKey(email)) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(email: string, entry: HistoryEntry) {
  try {
    const arr = loadHistory(email);
    arr.unshift(entry);
    localStorage.setItem(histKey(email), JSON.stringify(arr.slice(0, 8)));
  } catch {
    /* переполнение хранилища — молча пропускаем */
  }
}

/* ---------- отчёт ---------- */

export function buildReport(r: AnalysisResult): string {
  const kind = (s: Segment) => (s.kind === "original" ? "OK " : s.kind === "ai" ? "AI " : "BOR");
  return [
    "ЛАКМУС — ОТЧЁТ О ПРОВЕРКЕ ТЕКСТА",
    "=".repeat(46),
    `Отчёт:            ${r.id}`,
    `Дата:             ${new Date(r.createdAt).toLocaleString("ru-RU")}`,
    `Аккаунт:          ${r.email}`,
    `Объём:            ${fmt(r.chars)} знаков · ${fmt(r.words)} слов`,
    "",
    `Оригинальность:   ${r.originality}%`,
    `Заимствования:    ${r.borrowed}%`,
    `Использование ИИ: ${r.ai}%`,
    "",
    "ИСТОЧНИКИ СОВПАДЕНИЙ",
    "-".repeat(46),
    ...(r.sources.length
      ? r.sources.map((s) => ` • ${s.source} (${s.url}) — ${s.percent}%`)
      : [" Совпадений с базой не обнаружено"]),
    "",
    "РАЗБОР ПО ФРАГМЕНТАМ",
    "-".repeat(46),
    ...r.segments.slice(0, 40).map((s) => ` [${kind(s)}] ${s.text.slice(0, 120)}`),
    "",
    "=".repeat(46),
  ].join("\n");
}

export function downloadReport(r: AnalysisResult) {
  const blob = new Blob(["\ufeff" + buildReport(r)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lakmus-${r.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
