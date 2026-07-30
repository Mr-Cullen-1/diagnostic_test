"use client";

import { useEffect, useMemo, useState } from "react";
import { domainNames, localText, mathTestItems } from "./math-test-items";

const copy = {
  ru: {
    eyebrow: "Математика · адаптивная диагностика", back: "К выбору курса", progress: "Задание", of: "из", answer: "Следующий", reset: "Сбросить", erase: "Удалить", build: "Собери ответ", tap: "Нажимай карточки, чтобы собрать ответ", match: "Сначала выбери пример, затем — карточку с ответом", selected: "Выбрано", resultEyebrow: "Профиль знаний готов", resultTitle: "Твой уровень математики", class: "Рекомендуемый уровень: {grade} класс", score: "Верно решено: {score} из {total}", strong: "Уверенные навыки", improve: "Стоит потренировать", confidence: "Диагностика охватывает 20 заданий по ключевым навыкам выбранного диапазона классов.", again: "Вернуться на главную", courses: "Выбрать курс", empty: "Собери или введи ответ, чтобы продолжить.", correct: "Отлично!", next: "Следующее задание", finish: "Смотреть результат", skill: "Проверяем", keypad: "Введи число с помощью клавиатуры", resultLevels: { 1: "Базовый уровень 1 класса", 2: "Уверенный уровень 2 класса", 3: "Уверенный уровень 3 класса", 4: "Продвинутый уровень 4 класса" }, noStrong: "Продолжай — следующий тест поможет увидеть сильные стороны.", noImprove: "Критичных пробелов не обнаружено." },
  uz: {
    eyebrow: "Matematika · moslashuvchan diagnostika", back: "Kurs tanlashga", progress: "Topshiriq", of: "dan", answer: "Keyingi", reset: "Tozalash", erase: "O‘chirish", build: "Javobni tuzing", tap: "Javobni tuzish uchun kartochkalarni bosing", match: "Avval misolni, keyin javob yozilgan kartochkani tanlang", selected: "Tanlandi", resultEyebrow: "Bilimlar profili tayyor", resultTitle: "Sizning matematika darajangiz", class: "Tavsiya etilgan daraja: {grade}-sinf", score: "To‘g‘ri yechildi: {score} / {total}", strong: "Ishonchli ko‘nikmalar", improve: "Mashq qilish kerak", confidence: "Diagnostika tanlangan sinflar oralig‘ining asosiy ko‘nikmalari bo‘yicha 20 topshiriqni qamrab oladi.", again: "Bosh sahifaga qaytish", courses: "Kurs tanlash", empty: "Davom etish uchun javobni tuzing yoki kiriting.", correct: "Ajoyib!", next: "Keyingi topshiriq", finish: "Natijani ko‘rish", skill: "Tekshirilmoqda", keypad: "Raqamli klaviaturadan foydalanib sonni kiriting", resultLevels: { 1: "1-sinfning asosiy darajasi", 2: "2-sinfning ishonchli darajasi", 3: "3-sinfning ishonchli darajasi", 4: "4-sinfning ilg‘or darajasi" }, noStrong: "Davom eting — keyingi urinish kuchli tomonlarni ko‘rsatadi.", noImprove: "Muhim bo‘shliqlar aniqlanmadi." },
};

const finishCopy = {
  ru: { button: "Завершить", title: "Завершить диагностику?", description: "Нерешённые задания будут отмечены как неверные и повлияют на результат.", confirm: "Да, уверен", cancel: "Нет, порешаю" },
  uz: { button: "Yakunlash", title: "Diagnostikani yakunlaysizmi?", description: "Yechilmagan topshiriqlar noto‘g‘ri deb belgilanadi va natijaga ta’sir qiladi.", confirm: "Ha, ishonaman", cancel: "Yo‘q, yechaman" },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const arraysMatch = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);

function chooseNextItem(itemBank, usedIds, estimatedLevel, domainAttempts) {
  const remainingItems = itemBank.filter((item) => !usedIds.includes(item.id));
  const firstGrade = Math.min(...itemBank.map((item) => item.grade));
  const completedFoundation = usedIds.filter((id) => itemBank.find((item) => item.id === id)?.grade === firstGrade).length;
  const candidates = completedFoundation < 3 ? remainingItems.filter((item) => item.grade === firstGrade) : remainingItems;
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => {
    const aDistance = Math.abs(a.grade - estimatedLevel) + (domainAttempts[a.domain] || 0) * 0.18;
    const bDistance = Math.abs(b.grade - estimatedLevel) + (domainAttempts[b.domain] || 0) * 0.18;
    return aDistance - bDistance || a.grade - b.grade || a.id.localeCompare(b.id);
  })[0];
}

function getRecommendation(responses, itemBank) {
  const grades = [...new Set(itemBank.map((item) => item.grade))].sort((a, b) => a - b);
  const gradeStats = grades.map((grade) => {
    const items = responses.filter((response) => response.item.grade === grade);
    return { grade, correct: items.filter((response) => response.correct).length, total: items.length };
  });
  const solid = (grade) => {
    const stat = gradeStats.find((item) => item.grade === grade);
    return stat && stat.correct >= Math.ceil(stat.total * 0.6);
  };
  const recommendedGrade = grades.reduce((level, grade) => solid(grade) && grades.filter((current) => current < grade).every(solid) ? grade : level, grades[0]);
  const domainStats = Object.keys(domainNames).map((domain) => {
    const items = responses.filter((response) => response.item.domain === domain);
    return { domain, correct: items.filter((response) => response.correct).length, total: items.length };
  });
  return { recommendedGrade, gradeStats, domainStats };
}

export default function MathDiagnostic({ locale, onBack, onHome = onBack, itemBank = mathTestItems }) {
  const t = copy[locale];
  const finish = finishCopy[locale];
  const [usedIds, setUsedIds] = useState([]);
  const [responses, setResponses] = useState([]);
  const [estimatedLevel, setEstimatedLevel] = useState(2);
  const [domainAttempts, setDomainAttempts] = useState({});
  const [currentItem, setCurrentItem] = useState(() => itemBank[0]);
  const [numberDraft, setNumberDraft] = useState("");
  const [textDraft, setTextDraft] = useState("");
  const [choiceDraft, setChoiceDraft] = useState("");
  const [builtDraft, setBuiltDraft] = useState([]);
  const [matchDraft, setMatchDraft] = useState({});
  const [activePair, setActivePair] = useState(null);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);

  useEffect(() => {
    setNumberDraft("");
    setTextDraft("");
    setChoiceDraft("");
    setBuiltDraft([]);
    setMatchDraft({});
    setActivePair(null);
    setMessage("");
  }, [currentItem?.id]);

  const result = useMemo(() => getRecommendation(responses, itemBank), [responses, itemBank]);
  const itemPrompt = currentItem ? localText(currentItem.prompt, locale) : "";

  function resetDiagnostic() {
    setUsedIds([]);
    setResponses([]);
    setEstimatedLevel(2);
    setDomainAttempts({});
    setCurrentItem(itemBank[0]);
    setFinishConfirmOpen(false);
    setFinished(false);
  }

  function finishDiagnostic() {
    const unanswered = itemBank.filter((item) => !usedIds.includes(item.id));
    setUsedIds(itemBank.map((item) => item.id));
    setResponses((currentResponses) => [...currentResponses, ...unanswered.map((item) => ({ item, correct: false }))]);
    setFinishConfirmOpen(false);
    setFinished(true);
  }

  function isAnswerComplete() {
    if (currentItem.type === "number") return numberDraft.length > 0;
    if (currentItem.type === "text") return textDraft.trim().length > 0;
    if (currentItem.type === "choice") return choiceDraft.length > 0;
    if (currentItem.type === "sequence" || currentItem.type === "equation") return builtDraft.length === currentItem.expected.length;
    return currentItem.pairs.every((pair) => matchDraft[pair.id]);
  }

  function isCorrect() {
    if (currentItem.type === "number") return numberDraft === currentItem.answer;
    if (currentItem.type === "text") return textDraft.trim().replaceAll(" ", "").replace(",", ".") === String(currentItem.answer).replaceAll(" ", "").replace(",", ".");
    if (currentItem.type === "choice") return choiceDraft === currentItem.answer;
    if (currentItem.type === "sequence" || currentItem.type === "equation") return arraysMatch(builtDraft, currentItem.expected);
    return currentItem.pairs.every((pair) => matchDraft[pair.id] === pair.right);
  }

  function submitAnswer() {
    if (!isAnswerComplete()) return setMessage(t.empty);
    const correct = isCorrect();
    const nextUsedIds = [...usedIds, currentItem.id];
    const nextResponses = [...responses, { item: currentItem, correct }];
    const nextLevel = clamp(estimatedLevel + (correct ? 0.55 : -0.45) + (currentItem.grade - estimatedLevel) * (correct ? 0.12 : 0.04), 1, 4);
    const nextAttempts = { ...domainAttempts, [currentItem.domain]: (domainAttempts[currentItem.domain] || 0) + 1 };
    setUsedIds(nextUsedIds);
    setResponses(nextResponses);
    setEstimatedLevel(nextLevel);
    setDomainAttempts(nextAttempts);
    if (nextUsedIds.length === itemBank.length) return setFinished(true);
    setMessage(correct ? t.correct : "");
    setCurrentItem(chooseNextItem(itemBank, nextUsedIds, nextLevel, nextAttempts));
  }

  function addToken(token) {
    if (builtDraft.length < currentItem.expected.length) setBuiltDraft((draft) => [...draft, token]);
  }

  if (finished) {
    const score = responses.filter((response) => response.correct).length;
    const strengths = result.domainStats.filter((stat) => stat.total && stat.correct / stat.total >= 0.7);
    const improvements = result.domainStats.filter((stat) => stat.total && stat.correct / stat.total < 0.55);
    return <section className="math-diagnostic-screen">
      <div className="diagnostic-result-card">
        <p className="diagnostic-eyebrow">{t.resultEyebrow}</p>
        <h1>{t.resultTitle}</h1>
        <div className="result-grade"><b>{result.recommendedGrade}</b><span>{locale === "ru" ? `Уровень ${result.recommendedGrade} класса` : `${result.recommendedGrade}-sinf darajasi`}</span></div>
        <strong>{t.class.replace("{grade}", result.recommendedGrade)}</strong>
        <p className="result-score">{t.score.replace("{score}", score).replace("{total}", itemBank.length)}</p>
        <div className="result-columns"><article><h2>{t.strong}</h2>{strengths.length ? strengths.map((stat) => <p key={stat.domain}>✓ {localText(domainNames[stat.domain], locale)}</p>) : <p>{t.noStrong}</p>}</article><article><h2>{t.improve}</h2>{improvements.length ? improvements.map((stat) => <p key={stat.domain}>• {localText(domainNames[stat.domain], locale)}</p>) : <p>{t.noImprove}</p>}</article></div>
        <p className="result-note">{t.confidence}</p>
        <div className="diagnostic-actions"><button type="button" className="text-button" onClick={onHome}>{t.again}</button><button type="button" className="orange-button" onClick={onBack}>{t.courses}</button></div>
      </div>
    </section>;
  }

  const progress = usedIds.length + 1;
  const skill = localText(currentItem.skill, locale);
  return <section className="math-diagnostic-screen">
    <div className="diagnostic-shell">
      <button className="finish-test-button" type="button" onClick={() => setFinishConfirmOpen(true)}>{finish.button}</button>
      <aside className="diagnostic-side"><p>{t.eyebrow}</p><h1>{t.progress} <b>{progress}</b> {t.of} {itemBank.length}</h1><div className="diagnostic-progress"><span style={{ width: `${(progress / itemBank.length) * 100}%` }} /></div><img src="/robot-form.png" alt="" /></aside>
      <article className="diagnostic-card"><div className="skill-tag"><span>{t.skill}</span>{skill}</div><h2>{itemPrompt}</h2>
        {currentItem.type === "number" && <div className="number-task"><p>{t.keypad}</p><div className="number-answer" aria-live="polite">{numberDraft || "—"}</div><div className="number-keypad">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => <button key={digit} type="button" onClick={() => setNumberDraft((draft) => draft.length < 6 ? `${draft}${digit}` : draft)}>{digit}</button>)}<button type="button" className="keypad-action" onClick={() => setNumberDraft((draft) => draft.slice(0, -1))}>⌫</button><button type="button" className="keypad-action" onClick={() => setNumberDraft("")}>×</button></div></div>}
        {currentItem.type === "text" && <div className="written-task"><label>{locale === "ru" ? "Введи свой ответ" : "Javobingizni yozing"}<input autoFocus value={textDraft} onChange={(event) => setTextDraft(event.target.value)} placeholder={locale === "ru" ? "Напиши ответ" : "Javobni yozing"} /></label></div>}
        {currentItem.type === "choice" && <div className="choice-task">{currentItem.options.map((option) => <button key={option} type="button" className={choiceDraft === option ? "selected" : ""} onClick={() => setChoiceDraft(option)}>{option}</button>)}</div>}
        {(currentItem.type === "sequence" || currentItem.type === "equation") && <div className="builder-task"><p>{t.tap}</p><div className="built-answer">{builtDraft.length ? builtDraft.map((token, index) => <button key={`${token}-${index}`} type="button" onClick={() => setBuiltDraft((draft) => draft.filter((_, itemIndex) => itemIndex !== index))}>{token}</button>) : <span>{t.build}</span>}</div><div className="token-pool">{currentItem.tokens.map((token, index) => <button key={`${token}-${index}`} type="button" disabled={builtDraft.includes(token)} onClick={() => addToken(token)}>{token}</button>)}</div><button className="builder-reset" type="button" onClick={() => setBuiltDraft([])}>{t.reset}</button></div>}
        {currentItem.type === "match" && <div className="match-task"><p>{t.match}</p><div className="match-pairs">{currentItem.pairs.map((pair) => <button key={pair.id} type="button" className={`match-pair ${activePair === pair.id ? "active" : ""}`} onClick={() => setActivePair(pair.id)}><span>{pair.left}</span><b>{matchDraft[pair.id] || "?"}</b></button>)}</div><div className="match-answers">{currentItem.answers.map((answer, index) => <button key={`${answer}-${index}`} type="button" className={Object.values(matchDraft).includes(answer) ? "used" : ""} onClick={() => activePair && setMatchDraft((draft) => ({ ...draft, [activePair]: answer }))}>{answer}</button>)}</div></div>}
        {message && <p className="diagnostic-message" role="alert">{message}</p>}
        <div className="diagnostic-navigation"><button className="orange-button diagnostic-submit" type="button" onClick={submitAnswer}>{progress === itemBank.length ? t.finish : t.answer} →</button></div>
      </article>
      {finishConfirmOpen && <div className="finish-overlay" role="dialog" aria-modal="true" aria-labelledby="finish-title"><section className="finish-dialog"><p>{finish.button}</p><h2 id="finish-title">{finish.title}</h2><span>{finish.description}</span><div><button className="text-button" type="button" onClick={() => setFinishConfirmOpen(false)}>{finish.cancel}</button><button className="orange-button" type="button" onClick={finishDiagnostic}>{finish.confirm}</button></div></section></div>}
    </div>
  </section>;
}
