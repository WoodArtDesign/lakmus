import { useEffect, useState } from "react";
import { fmt } from "../lib/engine";
import { IconArrow, IconPlus, IconSpark, Logo, Reveal } from "./ui";

/* ---------- живой счётчик ---------- */

function useTicker(base: number, every = 2400, max = 18): number {
  const [v, setV] = useState(base);
  useEffect(() => {
    const id = window.setInterval(
      () => setV((p) => p + 3 + Math.floor(Math.random() * max)),
      every
    );
    return () => window.clearInterval(id);
  }, [every, max]);
  return v;
}

/* ---------- шапка-открытие ---------- */

export function Masthead({ onCta }: { onCta: () => void }) {
  const docs = useTicker(11_240_812_338, 2600, 42);
  const today = useTicker(48_211, 1900, 9);

  const rows = [
    { k: "база документов", v: fmt(docs), live: true },
    { k: "проверено сегодня", v: fmt(today), live: true },
    { k: "детекторы в сети", v: "7 / 7", live: false },
    { k: "среднее время отчёта", v: "13,8 с", live: false },
  ];

  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-12 pt-14 lg:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal>
          <div>
            <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.3em] text-mint-400">
              <span className="pulse-dot h-2 w-2 rounded-full bg-mint-400" />
              следствие по тексту · онлайн
            </p>
            <h1 className="mt-6 font-display text-[clamp(1.9rem,4.8vw,3.5rem)] font-bold leading-[1.06]">
              У каждого текста
              <br />
              есть{" "}
              <span className="relative whitespace-nowrap text-mint-400">
                происхождение
                <svg
                  viewBox="0 0 300 12"
                  className="absolute -bottom-2 left-0 w-full text-mint-500/50"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M2 9 Q 75 2 150 7 T 298 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              <span className="blink text-mint-400">_</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fog-300">
              «Лакмус» сравнивает документ с базой в 11,2 млрд страниц и прогоняет каждый
              фрагмент через нейродетектор генерации. Один отчёт — оригинальность,
              заимствования с источниками и доля ИИ-текста.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <button
                onClick={onCta}
                className="group flex items-center gap-2.5 rounded-lg bg-mint-500 px-6 py-3.5 text-sm font-bold text-ink-950 shadow-lg shadow-mint-500/25 transition-all hover:bg-mint-400 hover:shadow-mint-500/40 active:translate-y-px"
              >
                Проверить текст
                <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <span className="font-mono text-xs leading-relaxed text-fog-500">
                ≈ 14 секунд
                <br />
                до 200 000 знаков
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="relative overflow-hidden rounded-xl border border-ink-600 bg-ink-900/80 p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fog-500">
                состояние системы
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-mint-300">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint-400" /> live
              </span>
            </div>
            <dl className="mt-4 divide-y divide-ink-700">
              {rows.map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-fog-500">
                    {r.k}
                  </dt>
                  <dd className="font-mono text-sm font-semibold tabular-nums text-mint-300">
                    {r.v}
                    {r.live && <span className="blink ml-1 text-mint-500">·</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-2 flex h-10 items-end gap-1" aria-hidden="true">
              {[38, 52, 44, 66, 58, 74, 62, 88, 70, 95, 82, 60, 90, 76, 100, 84].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-sm bg-mint-500/25 transition-all hover:bg-mint-400/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-fog-600">
              проверки за последние 16 часов
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- бегущая строка ---------- */

const TICKER = [
  "11,2 млрд документов в индексе",
  "шинглы с шагом 9 символов",
  "нейродетектор ИИ · v2.4",
  "до 200 000 знаков за проверку",
  "среднее время отчёта — 14 с",
  "стилометрия и перплексия",
  "отчёт сохраняется в журнале",
  "проверка привязана к e-mail",
];

export function Ticker() {
  return (
    <div className="marquee relative overflow-hidden border-y border-ink-700 bg-ink-900/60 py-3.5">
      <div className="marquee-track flex w-max items-center">
        {[0, 1].map((k) => (
          <div key={k} aria-hidden={k === 1} className="flex items-center">
            {TICKER.map((t) => (
              <span key={t} className="flex items-center">
                <span className="whitespace-nowrap px-5 font-mono text-xs tracking-wider text-fog-500">
                  {t}
                </span>
                <IconSpark className="h-3 w-3 shrink-0 text-mint-500/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- метод ---------- */

const STEPS = [
  {
    n: "01",
    t: "Нормализация",
    d: "Убираем разметку, приводим регистр и пунктуацию, разбиваем документ на предложения и леммы — чтобы перестановка слов не маскировала заимствование.",
  },
  {
    n: "02",
    t: "Шинглы и отпечатки",
    d: "Текст режется на перекрывающиеся цепочки по 9 слов, из которых собираются компактные отпечатки — так сверка занимает секунды даже для 200 000 знаков.",
  },
  {
    n: "03",
    t: "Сверка с базой",
    d: "Отпечатки сравниваются с индексом в 11,2 млрд документов: интернет-архив, научные библиотеки, базы диссертаций и студенческих работ.",
  },
  {
    n: "04",
    t: "Нейродетектор ИИ",
    d: "Трансформерная модель оценивает перплексию, «температуру» стиля и маркеры машинной генерации в каждом фрагменте текста.",
  },
];

export function Method() {
  return (
    <section id="method" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-mint-400">
          // 01 · метод
        </p>
        <h2 className="mt-3 max-w-lg font-display text-3xl font-bold leading-tight sm:text-4xl">
          Четыре стадии — один отчёт
        </h2>
      </Reveal>

      <div className="relative mt-12 grid gap-10 md:grid-cols-2 md:gap-x-14 md:gap-y-14">
        <span
          className="absolute left-[27px] top-2 hidden h-[calc(100%-16px)] w-px bg-gradient-to-b from-mint-500/50 via-ink-600 to-transparent md:left-auto md:right-auto md:block lg:left-[27px]"
          aria-hidden="true"
        />
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 110} className={i % 2 === 1 ? "md:translate-y-6" : ""}>
            <div className="group flex gap-6">
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-mint-500/40 bg-ink-900 font-display text-lg font-bold text-mint-400 transition-all group-hover:border-mint-400 group-hover:bg-mint-500 group-hover:text-ink-950 group-hover:shadow-lg group-hover:shadow-mint-500/30">
                {s.n}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold transition-colors group-hover:text-mint-300">
                  {s.t}
                </h3>
                <p className="mt-2.5 leading-relaxed text-fog-300">{s.d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

const FAQS = [
  {
    q: "Насколько точен результат?",
    a: "Алгоритм даёт уверенную оценку по двум осям — совпадения с базой и статистические признаки генерации. Для спорных случаев смотрите разбор по фрагментам: каждый помечен отдельно — оригинал, совпадение с источником или вероятный ИИ-текст.",
  },
  {
    q: "Какие файлы можно загружать?",
    a: "Текстовые файлы .txt и .md, документы Word .docx и PDF — весом до 5 МБ. Текст извлекается автоматически: у Word берётся содержимое документа, у PDF — текстовый слой (сканы без текста не прочтутся). Лимит объёма — 200 000 знаков, примерно 110 страниц А4. Тот же лимит действует и для текста, вставленного в форму.",
  },
  {
    q: "Что означает процент ИИ?",
    a: "Доля фрагментов, в которых нейродетектор нашёл признаки машинной генерации: неестественно ровная перплексия, шаблонные связки, отсутствие «человеческого шума» в стиле.",
  },
  {
    q: "Куда попадают мои тексты?",
    a: "В этом демо текст не покидает ваш браузер: анализ выполняется локально на устройстве, а журнал проверок хранится в localStorage и виден только вам.",
  },
  {
    q: "Почему проверка требует e-mail?",
    a: "Отчёт привязывается к аккаунту, чтобы журнал проверок не терялся между сессиями на этом устройстве. Регистрация занимает несколько секунд и не требует подтверждения.",
  },
  {
    q: "Что делать, если оригинальность низкая?",
    a: "Откройте разбор по фрагментам: жёлтым помечены совпадения с источниками, красным — вероятная генерация ИИ. Переформулируйте эти фрагменты, добавьте авторские примеры и данные — затем прогоните текст ещё раз.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative mx-auto max-w-3xl scroll-mt-24 px-5 pb-24">
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-mint-400">
          // 02 · вопросы
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
          Спрашивают чаще всего
        </h2>
      </Reveal>
      <div className="mt-10 divide-y divide-ink-700 overflow-hidden rounded-xl border border-ink-600 bg-ink-900/60">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-ink-850 sm:px-6"
                aria-expanded={isOpen}
              >
                <span
                  className={`text-[15px] font-semibold transition-colors ${
                    isOpen ? "text-mint-300" : "text-fog-100"
                  }`}
                >
                  {f.q}
                </span>
                <IconPlus
                  className={`h-4 w-4 shrink-0 text-mint-400 transition-transform duration-300 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-fog-300 sm:px-6">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- подвал ---------- */

export function Footer() {
  return (
    <footer className="relative border-t border-ink-700 bg-ink-950/90">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <span className="flex items-center gap-3">
            <Logo className="h-7 w-7 text-mint-400" />
            <span className="font-display text-base font-bold tracking-wide">ЛАКМУС</span>
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-fog-500">
            Демонстрационный сервис проверки текста на заимствования и машинную генерацию.
            Результаты носят справочный характер и не являются юридическим заключением.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-fog-600">разделы</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              ["#checker", "Проверка текста"],
              ["#method", "Как это работает"],
              ["#faq", "Вопросы и ответы"],
            ].map(([href, t]) => (
              <li key={href}>
                <a href={href} className="text-fog-300 transition-colors hover:text-mint-300">
                  {t}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-fog-600">система</p>
          <ul className="mt-4 space-y-2.5 font-mono text-xs text-fog-500">
            <li className="flex justify-between gap-4">
              <span>версия</span>
              <span className="text-fog-300">2.4.1</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>статус</span>
              <span className="flex items-center gap-1.5 text-mint-300">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint-400" /> работает
              </span>
            </li>
            <li className="flex justify-between gap-4">
              <span>языки индекса</span>
              <span className="text-fog-300">27</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>аптайм</span>
              <span className="text-fog-300">99,97%</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-700/70">
        <p className="mx-auto max-w-6xl px-5 py-5 font-mono text-[11px] text-fog-600">
          © 2026 «Лакмус» · сделано для честных текстов
        </p>
      </div>
    </footer>
  );
}
