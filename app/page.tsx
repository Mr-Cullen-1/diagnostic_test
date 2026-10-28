"use client";

import { useState, useSyncExternalStore } from "react";
import MathPlacement from "./math-placement";

type Lang = "uz" | "ru" | "en";
type LogEntry = { at: string; kind: "onProgress" | "onComplete"; payload: unknown };

const LANGS: Lang[] = ["uz", "ru", "en"];
const TOOLBAR_HEIGHT = 52;

const noopSubscribe = () => () => {};
const getSearch = () => window.location.search;

// Mahalliy sinov uchun LMS o‘rnini bosuvchi sahifa: ?lang=ru&grade=5&embed=1
export default function Home() {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const search = useSyncExternalStore(noopSubscribe, getSearch, () => "");
  const params = new URLSearchParams(search);
  const embed = params.get("embed") === "1";
  const paramLang = params.get("lang");
  const paramGrade = params.get("grade");

  const [langPick, setLangPick] = useState<Lang | null>(null);
  const [gradePick, setGradePick] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const lang: Lang = langPick ?? (LANGS.includes(paramLang as Lang) ? (paramLang as Lang) : "uz");
  const gradeValue = gradePick ?? paramGrade ?? "";

  const push = (kind: LogEntry["kind"], payload: unknown) =>
    setLog((current) => [{ at: new Date().toLocaleTimeString(), kind, payload }, ...current].slice(0, 40));

  if (!mounted) return null;

  const component = (
    <MathPlacement
      key={`${attempt}-${lang}-${gradeValue}`}
      lang={lang}
      studentGrade={gradeValue ? Number(gradeValue) : undefined}
      storageKey={`math-placement-local-${attempt}`}
      onHome={() => setAttempt((current) => current + 1)}
      onProgress={(payload: unknown) => push("onProgress", payload)}
      onComplete={(payload: unknown) => push("onComplete", payload)}
    />
  );

  if (embed) return component;

  const lastComplete = log.find((entry) => entry.kind === "onComplete");
  return (
    <main style={{ "--mp-min-h": `calc(100dvh - ${TOOLBAR_HEIGHT}px)` } as React.CSSProperties}>
      <div className="lms-toolbar" style={{ height: TOOLBAR_HEIGHT }}>
        <strong>LMS sinov paneli</strong>
        <div className="lms-group" role="group" aria-label="lang">
          {LANGS.map((value) => (
            <button key={value} type="button" className={value === lang ? "on" : ""} onClick={() => setLangPick(value)}>{value.toUpperCase()}</button>
          ))}
        </div>
        <label>
          studentGrade
          <select value={gradeValue} onChange={(event) => setGradePick(event.target.value)}>
            <option value="">— bermaydi —</option>
            {Array.from({ length: 11 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setAttempt((current) => current + 1)}>Qayta boshlash</button>
        <button type="button" className={panelOpen ? "on" : ""} onClick={() => setPanelOpen((open) => !open)}>
          Callback’lar ({log.length})
        </button>
      </div>
      {component}
      {panelOpen && (
        <aside className="lms-panel" aria-label="callback log">
          <h2>onComplete (oxirgi natija)</h2>
          <pre>{lastComplete ? JSON.stringify(lastComplete.payload, null, 2) : "— hali yo‘q —"}</pre>
          <h2>Voqealar</h2>
          <ol>
            {log.map((entry, index) => (
              <li key={index}><b>{entry.at}</b> {entry.kind} <code>{JSON.stringify(entry.payload, (key, value) => (key === "responses" ? `[${(value as unknown[]).length}]` : value))}</code></li>
            ))}
          </ol>
        </aside>
      )}
    </main>
  );
}
