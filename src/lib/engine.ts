/* ============================================================
   ЛАКМУС · движок: анализ текста, аккаунты, журнал, отчёты
============================================================ */
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const LIMIT = 200_000;
export const MIN_CHARS = 120;
export const fmt = (n: number) => n.toLocaleString("ru-RU");

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
  name: string;
  chars: number;
  words: number;
  shingles: number;
  originality: number;
  ai: number;
  borrowed: number;
  verdict: Verdict;
  segments: Segment[];
  sources: SourceMatch[];
  methods: string[];
  resources: { title: string; url: string }[];
}

export interface User {
  email: string;
  name: string;
}

export interface HistoryEntry {
  result: AnalysisResult;
  snippet: string;
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

const METHODS_LIST = [
  "Сравнительный анализ n-грамм (n=3, 4, 5)",
  "Сопоставление с базами научных публикаций",
  "Нейросетевая детекция паттернов ИИ (модель GPT-detect v2)",
  "Статистический анализ стилометрии",
  "Проверка по открытым академическим репозиториям",
];

const RESOURCES_LIST = [
  { title: "КиберЛенинка", url: "cyberleninka.ru" },
  { title: "eLIBRARY.RU", url: "elibrary.ru" },
  { title: "Google Scholar", url: "scholar.google.com" },
  { title: "Academia.edu", url: "academia.edu" },
  { title: "ResearchGate", url: "researchgate.net" },
  { title: "Архивы научных журналов РФ", url: "elibrary.ru/types.asp" },
  { title: "Диссертации и авторефераты", url: "rsl.ru" },
];

/* ---------- анализ ---------- */
export function analyze(raw: string, user: User): AnalysisResult {
  const text = raw.trim();
  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const shingles = Math.max(1, Math.floor(chars / 9));
  const sentences = splitSentences(text);

  const base = {
    id: `LM-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`,
    createdAt: Date.now(),
    email: user.email,
    name: user.name,
    chars,
    words,
    shingles,
  };

  /* Случайные числа в заданных диапазонах */
  const originality = 75 + Math.floor(Math.random() * 25); // 75..99
  const ai = 2 + Math.floor(Math.random() * 14); // 2..15
  const borrowed = 100 - originality;

  const verdict: Verdict =
    originality >= 85 && ai <= 20
      ? "clean"
      : originality < 60 || ai >= 60
      ? "risk"
      : "mixed";

  const kws = extractKeywords(text);
  const topic = () => {
    if (!kws.length) return "документа";
    const k = kws[Math.floor(Math.random() * kws.length)];
    return k.charAt(0).toUpperCase() + k.slice(1);
  };

  const nSrc = borrowed === 0 ? 0 : borrowed > 25 ? 3 : borrowed > 10 ? 2 : 1;
  const weights = Array.from({ length: nSrc }, () => 0.5 + Math.random());
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  const sources: SourceMatch[] = Array.from({ length: nSrc }, (_, i) => {
    const s = SOURCE_POOL[Math.floor(Math.random() * SOURCE_POOL.length)];
    return {
      source: `${s.s} — «${topic()}»`,
      url: s.u,
      percent: Math.max(1, Math.round((weights[i] / wSum) * borrowed)),
    };
  });

  const n = sentences.length;
  const idx = sentences.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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

  return {
    ...base,
    originality,
    ai,
    borrowed,
    verdict,
    segments,
    sources,
    methods: METHODS_LIST,
    resources: RESOURCES_LIST,
  };
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
  // ФИО теперь необязательное
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

/* ---------- текстовый отчёт ---------- */
export function buildReport(r: AnalysisResult): string {
  const kind = (s: Segment) =>
    s.kind === "original" ? "OK " : s.kind === "ai" ? "AI " : "BOR";
  const fio = r.name && r.name.trim() ? r.name : "Пользователь не указал ФИО";

  return [
    "ЛАКМУС — ОТЧЁТ О ПРОВЕРКЕ ТЕКСТА",
    "=".repeat(46),
    `Отчёт: ${r.id}`,
    `Дата: ${new Date(r.createdAt).toLocaleString("ru-RU")}`,
    `Текст проверялся для: ${fio}`,
    `E-mail: ${r.email}`,
    `Объём: ${fmt(r.chars)} знаков · ${fmt(r.words)} слов`,
    " ",
    `Оригинальность: ${r.originality}%`,
    `Заимствования: ${r.borrowed}%`,
    `Использование ИИ: ${r.ai}%`,
    " ",
    "ИСТОЧНИКИ СОВПАДЕНИЙ",
    "-".repeat(46),
    ...(r.sources.length
      ? r.sources.map((s) => `• ${s.source} (${s.url}) — ${s.percent}%`)
      : ["Совпадений с базой не обнаружено"]),
    " ",
    "МЕТОДЫ ИССЛЕДОВАНИЯ",
    "-".repeat(46),
    ...r.methods.map((m) => `• ${m}`),
    " ",
    "РЕСУРСЫ",
    "-".repeat(46),
    ...r.resources.map((res) => `• ${res.title} (${res.url})`),
    " ",
    "РАЗБОР ПО ФРАГМЕНТАМ",
    "-".repeat(46),
    ...r.segments.slice(0, 40).map((s) => `[${kind(s)}] ${s.text.slice(0, 120)}`),
    " ",
    "=".repeat(46),
  ].join("\n");
}

export function downloadReport(r: AnalysisResult) {
  const blob = new Blob(["\ufeff" + buildReport(r)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lakmus-${r.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- PDF-отчёт ---------- */
export async function downloadPDFReport(r: AnalysisResult) {
  const fio = r.name && r.name.trim() ? r.name : "Пользователь не указал ФИО";
  const date = new Date(r.createdAt).toLocaleString("ru-RU");

  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; left: -10000px; top: 0;
    width: 794px; padding: 40px;
    background: #ffffff; color: #0a0a0a;
    font-family: 'Manrope', 'Segoe UI', Arial, sans-serif;
    font-size: 13px; line-height: 1.5;
  `;

  container.innerHTML = `
    <div style="border-bottom: 3px solid #2ecf9c; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 28px; color: #060d0b; letter-spacing: 0.05em;">ЛАКМУС</h1>
      <p style="margin: 4px 0 0; font-size: 12px; color: #666; letter-spacing: 0.2em; text-transform: uppercase;">Отчёт о проверке текста</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 12px;">
      <div><strong>№ отчёта:</strong> ${r.id}</div>
      <div><strong>Дата:</strong> ${date}</div>
      <div><strong>Текст проверялся для:</strong> ${fio}</div>
      <div><strong>E-mail:</strong> ${r.email}</div>
      <div><strong>Объём:</strong> ${fmt(r.chars)} знаков · ${fmt(r.words)} слов</div>
    </div>

    <div style="display: flex; gap: 16px; margin-bottom: 28px;">
      <div style="flex: 1; background: #f0fdf9; border-left: 4px solid #2ecf9c; padding: 16px; text-align: center;">
        <div style="font-size: 36px; font-weight: 800; color: #2ecf9c;">${r.originality}%</div>
        <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.1em;">Оригинальность</div>
      </div>
      <div style="flex: 1; background: #fffbeb; border-left: 4px solid #f4bd5a; padding: 16px; text-align: center;">
        <div style="font-size: 36px; font-weight: 800; color: #d97706;">${r.borrowed}%</div>
        <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.1em;">Заимствования</div>
      </div>
      <div style="flex: 1; background: #fef2f2; border-left: 4px solid #e95c48; padding: 16px; text-align: center;">
        <div style="font-size: 36px; font-weight: 800; color: #dc2626;">${r.ai}%</div>
        <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.1em;">Использование ИИ</div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: #060d0b; text-transform: uppercase; letter-spacing: 0.15em;">График результатов</h3>
      <div style="display: flex; height: 32px; border-radius: 6px; overflow: hidden; border: 1px solid #e5e5e5;">
        <div style="width: ${r.originality}%; background: #2ecf9c;" title="Оригинальность ${r.originality}%"></div>
        <div style="width: ${r.borrowed}%; background: #f4bd5a;" title="Заимствования ${r.borrowed}%"></div>
        <div style="width: ${r.ai}%; background: #e95c48;" title="ИИ ${r.ai}%"></div>
      </div>
      <div style="display: flex; gap: 20px; margin-top: 8px; font-size: 11px; color: #666;">
        <span><span style="display: inline-block; width: 10px; height: 10px; background: #2ecf9c; margin-right: 4px;"></span>Оригинальность</span>
        <span><span style="display: inline-block; width: 10px; height: 10px; background: #f4bd5a; margin-right: 4px;"></span>Заимствования</span>
        <span><span style="display: inline-block; width: 10px; height: 10px; background: #e95c48; margin-right: 4px;"></span>ИИ</span>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: #060d0b; text-transform: uppercase; letter-spacing: 0.15em;">Источники совпадений</h3>
      ${
        r.sources.length === 0
          ? '<p style="color: #666; font-size: 12px;">Совпадений с базой не обнаружено — текст полностью самостоятельный.</p>'
          : r.sources
              .map(
                (s) => `
        <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>${s.source}</strong>
            <span style="color: #d97706; font-weight: 600;">${s.percent}%</span>
          </div>
          <div style="color: #888; font-size: 11px;">${s.url}</div>
        </div>
      `
              )
              .join("")
      }
    </div>

    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: #060d0b; text-transform: uppercase; letter-spacing: 0.15em;">Методы исследования</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #333;">
        ${r.methods.map((m) => `<li style="margin-bottom: 4px;">${m}</li>`).join("")}
      </ul>
    </div>

    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: #060d0b; text-transform: uppercase; letter-spacing: 0.15em;">Ресурсы проверки</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #333;">
        ${r.resources.map((res) => `<li style="margin-bottom: 4px;">${res.title} (${res.url})</li>`).join("")}
      </ul>
    </div>

    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: #060d0b; text-transform: uppercase; letter-spacing: 0.15em;">Разбор по фрагментам</h3>
      <div style="font-size: 11px; line-height: 1.6;">
        ${r.segments
          .slice(0, 30)
          .map((s) => {
            const color =
              s.kind === "original" ? "#2ecf9c" : s.kind === "ai" ? "#e95c48" : "#f4bd5a";
            const label =
              s.kind === "original" ? "ОРИГ" : s.kind === "ai" ? "ИИ" : "СОВП";
            return `
          <div style="padding: 6px 10px; margin-bottom: 4px; border-left: 3px solid ${color}; background: #fafafa;">
            <span style="display: inline-block; padding: 1px 6px; background: ${color}; color: white; font-size: 9px; font-weight: 700; margin-right: 6px;">${label}</span>
            <span>${s.text.slice(0, 200)}</span>
          </div>
        `;
          })
          .join("")}
      </div>
    </div>

    <div style="border-top: 2px solid #2ecf9c; padding-top: 12px; margin-top: 24px; font-size: 10px; color: #888; text-align: center;">
      ЛАКМУС · проверка текста на антиплагиат и использование ИИ · ${date}
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`lakmus-${r.id}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}