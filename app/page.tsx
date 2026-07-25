"use client";

import { useMemo, useState } from "react";

type Question = { grade: number; topic: string; question: string; options: string[]; answer: number; hint: string };
const questions: Question[] = [
  { grade: 1, topic: "Сложение и вычитание до 10", question: "Сколько будет 8 − 3?", options: ["4", "5", "6", "7"], answer: 1, hint: "Можно отсчитать 3 шага назад от 8." },
  { grade: 1, topic: "Переход через десяток", question: "Сколько будет 14 + 5?", options: ["18", "19", "20", "21"], answer: 1, hint: "До 20 не хватает 6, значит прибавляем 5." },
  { grade: 1, topic: "Двузначные числа", question: "Какое число больше?", options: ["34", "43", "Они равны", "Нельзя узнать"], answer: 1, hint: "Сначала сравни десятки." },
  { grade: 1, topic: "Задача на остаток", question: "У Маши было 12 яблок. 5 она отдала. Сколько осталось?", options: ["5", "6", "7", "17"], answer: 2, hint: "Слово «отдала» подсказывает вычитание." },
  { grade: 2, topic: "Десятки и единицы", question: "Какое число состоит из 7 десятков и 4 единиц?", options: ["47", "70", "74", "704"], answer: 2, hint: "Семь десятков — это 70." },
  { grade: 2, topic: "Сложение в пределах 100", question: "Сколько будет 46 + 27?", options: ["63", "72", "73", "83"], answer: 2, hint: "Сложи единицы, затем десятки." },
  { grade: 2, topic: "Вычитание с переходом", question: "Сколько будет 63 − 28?", options: ["35", "45", "41", "25"], answer: 0, hint: "Удобно: 63 − 20 − 8." },
  { grade: 2, topic: "Табличное умножение", question: "Сколько будет 4 × 6?", options: ["10", "20", "24", "28"], answer: 2, hint: "Это четыре группы по шесть." },
  { grade: 3, topic: "Деление", question: "Сколько будет 72 : 8?", options: ["8", "9", "10", "11"], answer: 1, hint: "Вспомни, сколько раз 8 поместится в 72." },
  { grade: 3, topic: "Порядок действий", question: "Сколько будет 3 × 4 + 5?", options: ["17", "27", "20", "12"], answer: 0, hint: "Сначала выполняют умножение." },
  { grade: 3, topic: "Периметр прямоугольника", question: "У прямоугольника стороны 5 см и 3 см. Какой у него периметр?", options: ["8 см", "15 см", "16 см", "30 см"], answer: 2, hint: "Периметр — сумма всех четырёх сторон." },
  { grade: 3, topic: "Часть числа", question: "Чему равна половина от 18?", options: ["6", "8", "9", "12"], answer: 2, hint: "Половина — это разделить на 2." },
  { grade: 4, topic: "Умножение многозначных чисел", question: "Сколько будет 254 × 3?", options: ["652", "712", "762", "782"], answer: 2, hint: "Умножь отдельно единицы, десятки и сотни." },
  { grade: 4, topic: "Деление", question: "Сколько будет 840 : 4?", options: ["21", "120", "210", "240"], answer: 2, hint: "84 : 4 = 21, затем учти ноль." },
  { grade: 4, topic: "Сравнение дробей", question: "Какая дробь больше?", options: ["2/3", "3/4", "Они равны", "Нельзя сравнить"], answer: 1, hint: "Можно представить обе дроби на одном рисунке." },
  { grade: 4, topic: "Задачи на движение", question: "Машина ехала 3 часа со скоростью 60 км/ч. Сколько километров она проехала?", options: ["20 км", "63 км", "180 км", "360 км"], answer: 2, hint: "Расстояние = скорость × время." },
];

function Header({ onHome }: { onHome: () => void }) {
  return <header className="junior-header"><button className="logo-button" onClick={onHome} aria-label="На главную"><img src="/junior-logo.png" alt="Junior" /></button><nav><button onClick={onHome}>Главная</button><span>Диагностика</span></nav><div className="header-actions"><span className="lang">RU</span><span className="profile-dot">◔</span></div></header>;
}

export default function Home() {
  const [screen, setScreen] = useState<"subjects" | "classes" | "test" | "result">("subjects");
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const selected = answers[index];
  const scoreByGrade = useMemo(() => [1, 2, 3, 4].map((grade) => { const qs = questions.filter((q) => q.grade === grade); const correct = qs.filter((q) => answers[questions.indexOf(q)] === q.answer).length; return { grade, correct, total: qs.length, percent: correct / qs.length }; }), [answers]);
  const totalCorrect = scoreByGrade.reduce((sum, item) => sum + item.correct, 0);
  const firstGap = scoreByGrade.find((item) => item.percent < 0.75);
  const recommendation = firstGap?.grade ?? 4;

  function chooseClass(grade: number) { setSelectedClass(grade); setIndex(Math.max(0, questions.findIndex((question) => question.grade === grade))); setScreen("test"); }
  function choose(option: number) { const next = [...answers]; next[index] = option; setAnswers(next); }
  function nextQuestion() { if (index === questions.length - 1) setScreen("result"); else setIndex(index + 1); }
  function reset() { setAnswers(Array(questions.length).fill(null)); setIndex(0); setSelectedClass(null); setScreen("subjects"); }

  return <main className={`app-shell screen-${screen}`}>
    <Header onHome={reset} />

    {screen === "subjects" && <section className="subject-screen"><div className="subject-intro"><p>Диагностика уровня</p><h1>Давай узнаем,<br />что ты уже <i>умеешь</i></h1><span>Выбери предмет — это займёт всего несколько минут.</span></div><div className="subject-cards">
      <button className="subject-card math-card" onClick={() => setScreen("classes")}><div><small>ДОСТУПНО СЕЙЧАС</small><h2>Математика</h2><p>Определим подходящий класс<br />и темы для старта.</p><b>Пройти тест <em>→</em></b></div><img src="/junior-robot.png" alt="Робот Junior" /></button>
      <div className="subject-card english-card" aria-label="Английский язык — скоро"><div><small>СКОРО</small><h2>Английский<br />язык</h2><p>Диагностика появится<br />совсем скоро.</p></div><span className="lock">⌁</span></div>
    </div></section>}

    {screen === "classes" && <section className="class-screen"><button className="back-link" onClick={() => setScreen("subjects")}>← Назад к предметам</button><div className="class-title"><p>Математика</p><h1>Выбери свой класс</h1><span>Подготовим задания, подходящие именно тебе.</span></div><div className="class-grid">{Array.from({ length: 11 }, (_, i) => i + 1).map((grade) => <button key={grade} className={`class-card ${grade > 4 ? "locked" : ""}`} disabled={grade > 4} onClick={() => chooseClass(grade)}><b>{grade}</b><span>класс</span>{grade > 4 && <small>Скоро</small>}</button>)}</div></section>}

    {screen === "test" && <section className="test-screen"><div className="test-top"><button className="back-link" onClick={() => setScreen("classes")}>← К выбору класса</button><span>Математика · {selectedClass} класс</span><span>{index + 1} / {questions.length}</span></div><div className="progress"><i style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><article className="test-card"><div className="test-label">{questions[index].topic}</div><h1>{questions[index].question}</h1><div className="answers">{questions[index].options.map((option, optionIndex) => <button key={option} className={selected === optionIndex ? "selected" : ""} onClick={() => choose(option)}><b>{String.fromCharCode(65 + optionIndex)}</b>{option}</button>)}</div><div className="test-actions"><button className="text-button" disabled={index === 0} onClick={() => setIndex(index - 1)}>Назад</button><button className="orange-button" disabled={selected === null} onClick={nextQuestion}>{index === questions.length - 1 ? "Показать результат" : "Продолжить →"}</button></div></article></section>}

    {screen === "result" && <section className="result-screen"><img src="/junior-robot.png" alt="" /><p>Диагностика завершена</p><h1>Отличная работа!</h1><span>Верных ответов: <b>{totalCorrect} из {questions.length}</b></span><div className="recommendation"><small>РЕКОМЕНДУЕМ НАЧАТЬ С</small><strong>{recommendation} класса</strong><p>{firstGap ? `Полезно повторить ключевые темы ${recommendation} класса.` : "Фундамент устойчивый — можно переходить к следующему уровню."}</p></div><button className="orange-button" onClick={reset}>Вернуться к предметам</button></section>}
  </main>;
}
