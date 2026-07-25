"use client";

import { useMemo, useState } from "react";

type Question = {
  grade: number;
  topic: string;
  question: string;
  options: string[];
  answer: number;
  hint: string;
};

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

const gradeTopics = [
  ["Числа до 100", "Сложение и вычитание", "Задачи и величины"],
  ["Нумерация до 100", "Действия в пределах 100", "Умножение и геометрия"],
  ["Числа до 1000", "Умножение и деление", "Дроби и фигуры"],
  ["Многозначные числа", "Письменные действия", "Дроби, величины, задачи"],
];

export default function Home() {
  const [screen, setScreen] = useState<"welcome" | "test" | "result">("welcome");
  const [name, setName] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));

  const selected = answers[index];
  const scoreByGrade = useMemo(() => [1, 2, 3, 4].map((grade) => {
    const gradeQuestions = questions.filter((q) => q.grade === grade);
    const correct = gradeQuestions.filter((q) => answers[questions.indexOf(q)] === q.answer).length;
    return { grade, correct, total: gradeQuestions.length, percent: correct / gradeQuestions.length };
  }), [answers]);
  const totalCorrect = scoreByGrade.reduce((sum, item) => sum + item.correct, 0);
  const firstGap = scoreByGrade.find((item) => item.percent < 0.75);
  const recommendation = firstGap?.grade ?? 4;

  function begin() {
    setScreen("test");
    setIndex(0);
  }

  function choose(option: number) {
    const next = [...answers];
    next[index] = option;
    setAnswers(next);
  }

  function nextQuestion() {
    if (index === questions.length - 1) setScreen("result");
    else setIndex(index + 1);
  }

  function restart() {
    setAnswers(Array(questions.length).fill(null));
    setIndex(0);
    setScreen("welcome");
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Математика по ступенькам">
          <span className="brand-mark">∑</span>
          <span>Математика<br /><b>по ступенькам</b></span>
        </a>
        <span className="topbar-note">Диагностика 1–4 классов</span>
      </header>

      {screen === "welcome" && (
        <section id="top" className="welcome-shell">
          <div className="hero-copy">
            <p className="eyebrow">Стартовая диагностика</p>
            <h1>Найдём класс,<br /><em>в котором учиться</em><br />будет уверенно</h1>
            <p className="lead">16 коротких заданий по ключевым темам программы. Без оценок и таймера — только честный старт.</p>
            <div className="name-row">
              <label htmlFor="student-name">Имя ученика <span>необязательно</span></label>
              <input id="student-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Азиза" />
            </div>
            <button className="primary-button" onClick={begin}>Начать диагностику <span>→</span></button>
            <p className="small-note">Обычно занимает 8–12 минут</p>
          </div>
          <div className="hero-card" aria-label="Маршрут по классам">
            <div className="paper-tape">Твой маршрут</div>
            <div className="path-line" />
            {[1, 2, 3, 4].map((grade) => <div key={grade} className={`grade-stop grade-${grade}`}><strong>{grade}</strong><span>класс</span></div>)}
            <div className="hero-card-caption"><b>От простого к сложному</b><br />Проверяем фундамент, а не скорость.</div>
          </div>
        </section>
      )}

      {screen === "welcome" && <section className="program-section">
        <div><p className="eyebrow">Что проверяем</p><h2>Опираемся на темы<br />вашей программы</h2></div>
        <div className="program-grid">
          {gradeTopics.map((topics, i) => <article key={i} className="program-card"><span>0{i + 1}</span><h3>{i + 1} класс</h3>{topics.map((topic) => <p key={topic}>{topic}</p>)}</article>)}
        </div>
      </section>}

      {screen === "test" && (
        <section className="test-shell">
          <div className="test-head"><div><p className="eyebrow">Вопрос {index + 1} из {questions.length}</p><h2>{questions[index].topic}</h2></div><button className="exit-button" onClick={() => setScreen("welcome")}>Выйти</button></div>
          <div className="progress" aria-label={`Прогресс: ${index + 1} из ${questions.length}`}><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
          <div className="question-layout">
            <aside className="grade-pill"><strong>{questions[index].grade}</strong><span>класс</span></aside>
            <article className="question-card">
              <p className="question-number">Задание {index + 1}</p>
              <h1>{questions[index].question}</h1>
              <div className="answers">
                {questions[index].options.map((option, optionIndex) => <button key={option} className={`answer ${selected === optionIndex ? "selected" : ""}`} onClick={() => choose(optionIndex)}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}
              </div>
              <div className="question-actions"><button className="back-button" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Назад</button><button className="primary-button" disabled={selected === null} onClick={nextQuestion}>{index === questions.length - 1 ? "Показать результат" : "Дальше →"}</button></div>
            </article>
          </div>
        </section>
      )}

      {screen === "result" && (
        <section className="result-shell">
          <p className="eyebrow">Диагностика завершена</p>
          <h1>{name ? `${name}, отличный старт!` : "Отличный старт!"}</h1>
          <p className="result-lead">Верных ответов: <b>{totalCorrect} из {questions.length}</b>. Мы смотрим на устойчивость знаний в каждой ступени.</p>
          <div className="recommendation"><span>Рекомендуем начать с</span><strong>{recommendation} класса</strong><p>{firstGap ? `Перед переходом дальше полезно укрепить темы ${recommendation} класса.` : "Фундамент устойчивый: можно уверенно работать по программе 4 класса."}</p></div>
          <div className="result-grid">{scoreByGrade.map((item) => <article key={item.grade} className={item.percent >= 0.75 ? "mastered" : "review"}><div><span>{item.grade} класс</span><b>{item.correct}/{item.total}</b></div><div className="mini-progress"><i style={{ width: `${item.percent * 100}%` }} /></div><p>{item.percent >= 0.75 ? "Освоено уверенно" : "Стоит повторить"}</p></article>)}</div>
          <button className="primary-button" onClick={restart}>Пройти ещё раз <span>↻</span></button>
        </section>
      )}
    </main>
  );
}
