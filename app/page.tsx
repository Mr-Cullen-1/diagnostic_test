"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import MathDiagnostic from "./math-diagnostic";
import { mathTestItems58 } from "./math-test-items-5-8";
import { mathTestItems911 } from "./math-test-items-9-11";
import { mathTestItems } from "./math-test-items";
import EnglishDiagnostic from "./english-diagnostic(1)";
import PlatformButton from "./platform-button";

type Locale = "ru" | "uz";
type LocalText = Record<Locale, string>;
type Course = "math" | "english";
type Interest = { id: string; label: LocalText };
type DropdownKind = "interests";
const MIN_INTERESTS = 3;
const MAX_INTERESTS = 5;

const L = (ru: string, uz: string): LocalText => ({ ru, uz });

const text = {
  ru: {
    level: "Выбор направления", learn: "Выбери курс,", youKnow: "который хочешь", can: "изучать",
    choose: "Мы сохраним твою анкету и поможем команде Junior подобрать подходящий курс.",
    math: "Математика", mathDesc: "Решай примеры\nи узнай свой уровень.",
    english: "Английский\nязык", englishDesc: "Определи свой уровень\nанглийского языка.",
    start: "Начать тест", chooseCourse: "Выбрать курс", class: "класс", close: "Закрыть",
    faqHelp: "Нужна помощь?", faq: "Частые вопросы", faq1: "Зачем нужна анкета?",
    faq1a: "Она помогает команде Junior лучше узнать интересы ученика.", faq2: "Кто подберёт курс?",
    faq2a: "Рекомендацию даст команда Junior после просмотра анкеты.", faq3: "Нужно ли проходить тест сейчас?",
    faq3a: "Нет, следующий шаг пока готовит команда Junior.",
  },
  uz: {
    level: "Yo‘nalishni tanlash", learn: "O‘rganmoqchi", youKnow: "bo‘lgan", can: "kursingizni tanlang",
    choose: "Anketangizni saqlaymiz va Junior jamoasiga sizga mos kursni tanlashga yordam beramiz.",
    math: "Matematika", mathDesc: "Misollarni yeching\nva darajangizni biling.",
    english: "Ingliz tili", englishDesc: "Ingliz tili bo‘yicha\ndarajangizni aniqlang.",
    start: "Testni boshlash", chooseCourse: "Kursni tanlash", class: "sinf", close: "Yopish",
    faqHelp: "Yordam kerakmi?", faq: "Ko‘p so‘raladigan savollar", faq1: "Anketa nima uchun kerak?",
    faq1a: "U Junior jamoasiga o‘quvchining qiziqishlarini yaxshiroq bilishga yordam beradi.", faq2: "Kursni kim tavsiya qiladi?",
    faq2a: "Tavsiyani Junior jamoasi anketani ko‘rib chiqqandan keyin beradi.", faq3: "Hozir testdan o‘tish kerakmi?",
    faq3a: "Yo‘q, keyingi qadamni Junior jamoasi tayyorlayapti.",
  },
};

const profileText = {
  ru: {
    eyebrow: "Анкета ученика", robot: "Junior говорит", title: "Расскажи о себе",
    description: "Выбери от трёх до пяти интересов — так нашей команде будет проще понять, что тебе нравится.",
    name: "Имя и фамилия", namePlaceholder: "Например, Азиза Каримова", age: "Возраст", agePlaceholder: "Например, 9",
    classLabel: "Класс", classPlaceholder: "Выбери класс", interests: "Интересы", interestsTitle: "Что тебе нравится? Выбери от 3 до 5", interestsHint: "Выбери от 3 до 5",
    error: "Выбери от 3 до 5 интересов.", continue: "Продолжить", backToProfile: "Назад к анкете",
  },
  uz: {
    eyebrow: "O‘quvchi anketasi", robot: "Junior gapiryapti", title: "O‘zing haqingda aytib ber",
    description: "3 tadan 5 tagacha qiziqishni tanlang — shunda jamoamiz sizga nimalar yoqishini yaxshiroq tushunadi.",
    name: "Ism va familiya", namePlaceholder: "Masalan, Aziza Karimova", age: "Yosh", agePlaceholder: "Masalan, 9",
    classLabel: "Sinf", classPlaceholder: "Sinfni tanlang", interests: "Qiziqishlar", interestsTitle: "Senga nima yoqadi? 3 tadan 5 tagacha tanla", interestsHint: "3 tadan 5 tagacha tanlang",
    error: "3 tadan 5 tagacha qiziqishni tanlang.", continue: "Davom etish", backToProfile: "Anketaga qaytish",
  },
};

const confirmationText = {
  ru: { eyebrow: "Курс выбран", title: "Ты готов начать?", description: "Отлично! Приготовься: тест начнётся сразу после подтверждения.", edit: "Выбрать другой курс", start: "Да, я готов" },
  uz: { eyebrow: "Kurs tanlandi", title: "Boshlashga tayyormisan?", description: "Ajoyib! Tayyorgarlik ko‘ring: tasdiqlaganingizdan so‘ng test boshlanadi.", edit: "Boshqa kursni tanlash", start: "Ha, tayyorman" },
};

const educationLabel = L("Образование", "Ta’lim");

const educationSubtopics: Interest[] = [
  { id: "history", label: L("История", "Tarix") }, { id: "math", label: L("Математика", "Matematika") },
  { id: "music", label: L("Музыка", "Musiqa") }, { id: "art", label: L("Искусство", "San’at") },
  { id: "physics", label: L("Физика", "Fizika") }, { id: "physical-education", label: L("Физкультура", "Jismoniy tarbiya") },
  { id: "english", label: L("Английский язык", "Ingliz tili") }, { id: "literature", label: L("Литература", "Adabiyot") },
  { id: "language", label: L("Язык", "Til") }, { id: "ona-tili", label: L("Родной язык", "Ona tili") },
  { id: "russian", label: L("Русский язык", "Rus tili") }, { id: "biology", label: L("Биология", "Biologiya") },
  { id: "chemistry", label: L("Химия", "Kimyo") }, { id: "geography", label: L("География", "Geografiya") },
  { id: "informatics", label: L("Информатика", "Informatika") }, { id: "astronomy", label: L("Астрономия", "Astronomiya") },
];

const interests: Interest[] = [
  { id: "reading", label: L("Чтение", "Kitob o‘qish") }, { id: "technology", label: L("Технологии", "Texnologiyalar") },
  { id: "it", label: L("IT", "IT") }, { id: "design", label: L("Дизайн", "Dizayn") },
  { id: "engineering", label: L("Инженерия", "Muhandislik") }, { id: "handicraft", label: L("Рукоделие", "Qo‘l mehnati") },
  { id: "dancing", label: L("Танцы", "Raqs") }, { id: "gaming", label: L("Игры", "O‘yinlar") },
  { id: "sport", label: L("Спорт", "Sport") }, { id: "business", label: L("Бизнес", "Biznes") },
];

const allInterests = [...educationSubtopics, ...interests];

const posterSlides = [
  { src: "/posters/poster-01.png", alt: "Junior IT Academy poster 1" },
  { src: "/posters/poster-02.png", alt: "Junior IT Academy poster 2" },
  { src: "/posters/poster-03.png", alt: "Junior IT Academy poster 3" },
  { src: "/posters/poster-04.png", alt: "Junior IT Academy poster 4" },
  { src: "/posters/poster-05.png", alt: "Junior IT Academy poster 5" },
  { src: "/posters/poster-06.png", alt: "Junior IT Academy poster 6" },
  { src: "/posters/poster-07.png", alt: "Junior IT Academy poster 7" },
  { src: "/posters/poster-08.png", alt: "Junior IT Academy poster 8" },
  { src: "/posters/poster-09.png", alt: "Junior IT Academy poster 9" },
  { src: "/posters/poster-10.png", alt: "Junior IT Academy poster 10" },
  { src: "/posters/poster-11.png", alt: "Junior IT Academy poster 11" },
  { src: "/posters/poster-12.png", alt: "Junior IT Academy poster 12" },
  { src: "/posters/poster-13.png", alt: "Junior IT Academy poster 13" },
  { src: "/posters/poster-14.png", alt: "Junior IT Academy poster 14" },
  { src: "/posters/poster-15.png", alt: "Junior IT Academy poster 15" },
  { src: "/posters/poster-16.png", alt: "Junior IT Academy poster 16" },
  { src: "/posters/poster-17.png", alt: "Junior IT Academy poster 17" },
  { src: "/posters/poster-18.png", alt: "Junior IT Academy poster 18" },
  { src: "/posters/poster-19.png", alt: "Junior IT Academy poster 19" },
  { src: "/posters/poster-20.png", alt: "Junior IT Academy poster 20" },
];

function Header({ locale, setLocale }: { locale: Locale; setLocale: (locale: Locale) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return <>
    <header className="junior-header">
      <div className="junior-nav-inner">
        <button className="mobile-menu-button" type="button" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
        <span className="logo-button" aria-label="Junior"><Image src="/junior-logo.png" alt="Junior" width={160} height={41} /></span>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button type="button">Kurslar</button>
          <button type="button">CoinShop</button>
          <button className="diagnostic-nav-link is-active" type="button" aria-current="page">Диагностика</button>
        </nav>
        <div className="header-actions">
          <button className="nav-icon nav-bell" type="button" aria-label="Notifications"><span className="notification-dot" /></button>
          <button className="nav-icon nav-history" type="button" aria-label="Coin history" />
          <button className="nav-icon nav-profile" type="button" aria-label="Profile" />
          <button className="booking-link" type="button">Qo&apos;shimcha darsga yozilish</button>
          <div className="language-switch" aria-label="Language"><button className={locale === "ru" ? "active" : ""} onClick={() => setLocale("ru")}>RU</button><i>|</i><button className={locale === "uz" ? "active" : ""} onClick={() => setLocale("uz")}>UZ</button></div>
        </div>
      </div>
      <div className={`mobile-nav ${menuOpen ? "open" : ""}`}>
        <button type="button">Kurslar</button>
        <button type="button">CoinShop</button>
        <button className="is-active" type="button" aria-current="page">Диагностика</button>
        <button type="button">Qo&apos;shimcha darsga yozilish</button>
        <button type="button">Profile</button>
      </div>
    </header>
    <div className="junior-header-spacer" aria-hidden="true" />
  </>;
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("ru");
  const [screen, setScreen] = useState<"profile" | "subjects" | "math-test" | "english-test">("profile");
  const [faqOpen, setFaqOpen] = useState(false);
  const [readyOpen, setReadyOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [interestError, setInterestError] = useState(false);
  const [gradeError, setGradeError] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKind | null>(null);
  const [closingDropdown, setClosingDropdown] = useState<DropdownKind | null>(null);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [gradeDropdownPlacement, setGradeDropdownPlacement] = useState<"up" | "down">("down");
  const [gradeDropdownMaxHeight, setGradeDropdownMaxHeight] = useState(280);
  const [interestSearch, setInterestSearch] = useState("");
  const [dropdownPlacement, setDropdownPlacement] = useState<"up" | "down">("down");
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(280);
  const [profile, setProfile] = useState({ name: "", age: "", grade: "", interests: [] as string[] });
  const gradeDropdownRef = useRef<HTMLDivElement>(null);
  const interestsDropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = text[locale];
  const profileCopy = profileText[locale];
  const readyCopy = confirmationText[locale];
  const selectedInterests = allInterests.filter((interest) => profile.interests.includes(interest.id));
  const searchPlaceholder = locale === "ru" ? "Поиск" : "Qidirish";
  const noResultsText = locale === "ru" ? "Ничего не найдено" : "Hech narsa topilmadi";
  const split = (value: string) => value.split("\n").map((line, index) => <span key={index}>{line}{index === value.split("\n").length - 1 ? null : <br />}</span>);

  function toggleInterest(id: string) {
    setProfile((current) => {
      const isSelected = current.interests.includes(id);
      if (!isSelected && current.interests.length >= MAX_INTERESTS) return current;
      const nextInterests = isSelected ? current.interests.filter((item) => item !== id) : [...current.interests, id];
      if (nextInterests.length >= MIN_INTERESTS) setInterestError(false);
      return { ...current, interests: nextInterests };
    });
  }

  function clearInterests() {
    setInterestError(false);
    setProfile((current) => ({ ...current, interests: [] }));
  }

  function calculateDropdownPosition() {
    const element = interestsDropdownRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const placement = below >= above ? "down" : "up";
    const available = placement === "down" ? below : above;
    setDropdownPlacement(placement);
    setDropdownMaxHeight(Math.max(0, Math.min(320, available)));
  }

  const closeDropdown = useCallback(() => {
    if (!activeDropdown) return;
    setClosingDropdown(activeDropdown);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => { setActiveDropdown(null); setClosingDropdown(null); }, 180);
  }, [activeDropdown]);

  function toggleDropdown() {
    if (activeDropdown === "interests") return closeDropdown();
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosingDropdown(null);
    calculateDropdownPosition();
    setActiveDropdown("interests");
  }

  function selectGrade(grade: number) {
    setProfile((current) => ({ ...current, grade: String(grade) }));
    setGradeError(false);
    setGradeDropdownOpen(false);
  }

  function calculateGradeDropdownPosition() {
    const element = gradeDropdownRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const placement = below >= above ? "down" : "up";
    const available = placement === "down" ? below : above;
    setGradeDropdownPlacement(placement);
    setGradeDropdownMaxHeight(Math.max(0, Math.min(320, available)));
  }

  function toggleGradeDropdown() {
    if (gradeDropdownOpen) return setGradeDropdownOpen(false);
    calculateGradeDropdownPosition();
    setGradeDropdownOpen(true);
  }

  function renderSelectionChips(selected: Interest[], placeholder: string) {
    if (!selected.length) return <span className="interest-placeholder">{placeholder}</span>;
    return <span className="selected-interest-chips">{selected.slice(0, 2).map((interest) => <span key={interest.id}>{interest.label[locale]}</span>)}{selected.length > 2 && <b>+{selected.length - 2}</b>}</span>;
  }

  useEffect(() => {
    if (!activeDropdown && !gradeDropdownOpen) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!interestsDropdownRef.current?.contains(target) && !gradeDropdownRef.current?.contains(target)) {
        closeDropdown();
        setGradeDropdownOpen(false);
      }
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeDropdown();
      setGradeDropdownOpen(false);
    };
    const reposition = () => {
      if (activeDropdown) calculateDropdownPosition();
      if (gradeDropdownOpen) calculateGradeDropdownPosition();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
      window.removeEventListener("resize", reposition);
    };
  }, [activeDropdown, gradeDropdownOpen, closeDropdown]);

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile.grade) return setGradeError(true);
    if (profile.interests.length < MIN_INTERESTS || profile.interests.length > MAX_INTERESTS) return setInterestError(true);
    setScreen("subjects");
  }

  function selectCourse(course: Course) { setSelectedCourse(course); setReadyOpen(true); }
  function startDiagnostic() {
    setReadyOpen(false);
    if (selectedCourse === "math") setScreen("math-test");
    if (selectedCourse === "english") setScreen("english-test");
  }

  const mathTestBank = Number(profile.grade) <= 4 ? mathTestItems : Number(profile.grade) <= 8 ? mathTestItems58 : mathTestItems911;

  return <main className={`app-shell screen-${screen}`} lang={locale}>
    <Header locale={locale} setLocale={setLocale} />
    {screen === "profile" && <section className="profile-screen">
      <form className="profile-form" onSubmit={submitProfile}>
        <div className="profile-form-top"><p>{profileCopy.eyebrow}</p></div>
        <div className="profile-heading"><div><h1>{profileCopy.title}</h1><span>{profileCopy.description}</span></div><Image className="profile-form-robot" src="/robot-form.png" alt="" width={512} height={512} /></div>
        <div className="profile-fields">
          <label className="wide"><span>{profileCopy.name}</span><input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder={profileCopy.namePlaceholder} /></label>
          <label><span>{profileCopy.age}</span><input required inputMode="numeric" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} placeholder={profileCopy.agePlaceholder} /></label>
          <div className="profile-field"><span>{profileCopy.classLabel}</span><div ref={gradeDropdownRef} className={`interests-dropdown grade-dropdown ${gradeDropdownOpen ? `open ${gradeDropdownPlacement}` : ""} ${gradeError ? "has-error" : ""}`}><button className="interests-trigger grade-trigger" type="button" aria-expanded={gradeDropdownOpen} onClick={toggleGradeDropdown}><span className={profile.grade ? "" : "interest-placeholder"}>{profile.grade ? `${profile.grade} ${t.class}` : profileCopy.classPlaceholder}</span><i>⌄</i></button>{gradeDropdownOpen && <div className={`interests-menu grade-menu ${gradeDropdownPlacement}`} style={{ maxHeight: gradeDropdownMaxHeight }} role="listbox" aria-label={profileCopy.classLabel}>{Array.from({ length: 11 }, (_, index) => index + 1).map((grade) => <button key={grade} className={`grade-option ${profile.grade === String(grade) ? "selected" : ""}`} type="button" role="option" aria-selected={profile.grade === String(grade)} onClick={() => selectGrade(grade)}>{grade} {t.class}</button>)}</div>}</div></div>
          <fieldset className={`interests-field ${interestError ? "has-error" : ""}`}>
            <div className="interests-heading"><legend>{profileCopy.interests}</legend></div>
            <div ref={interestsDropdownRef} className={`interests-dropdown ${activeDropdown === "interests" ? `open ${dropdownPlacement}` : ""}`}>
              <div className="interest-select-control"><button className="interests-trigger" type="button" aria-expanded={activeDropdown === "interests"} onClick={toggleDropdown}>{renderSelectionChips(selectedInterests, profileCopy.interestsHint)}<i>⌄</i></button>{selectedInterests.length > 0 && <button className="interests-clear" type="button" aria-label={profileCopy.interests} onClick={clearInterests}>×</button>}</div>
              {activeDropdown === "interests" && <div className={`interests-menu ${dropdownPlacement} ${closingDropdown === "interests" ? "closing" : ""}`} style={{ maxHeight: dropdownMaxHeight }} role="listbox" aria-multiselectable="true"><label className="interest-search"><input autoFocus type="search" value={interestSearch} onChange={(event) => setInterestSearch(event.target.value)} placeholder={searchPlaceholder} /></label><p className="interest-list-label">{educationLabel[locale]}</p><div className="interest-list">{educationSubtopics.filter((interest) => interest.label[locale].toLocaleLowerCase().includes(interestSearch.trim().toLocaleLowerCase())).map((interest) => { const isSelected = profile.interests.includes(interest.id); return <label key={interest.id} className={isSelected ? "selected" : ""}><input type="checkbox" checked={isSelected} disabled={!isSelected && profile.interests.length >= MAX_INTERESTS} onChange={() => toggleInterest(interest.id)} /><span>{interest.label[locale]}</span></label>; })}</div><p className="interest-list-label">{profileCopy.interests}</p><div className="interest-list">{interests.filter((interest) => interest.label[locale].toLocaleLowerCase().includes(interestSearch.trim().toLocaleLowerCase())).map((interest) => { const isSelected = profile.interests.includes(interest.id); return <label key={interest.id} className={isSelected ? "selected" : ""}><input type="checkbox" checked={isSelected} disabled={!isSelected && profile.interests.length >= MAX_INTERESTS} onChange={() => toggleInterest(interest.id)} /><span>{interest.label[locale]}</span></label>; })}</div>{!allInterests.some((interest) => interest.label[locale].toLocaleLowerCase().includes(interestSearch.trim().toLocaleLowerCase())) && <p className="interest-no-results">{noResultsText}</p>}</div>}
            </div>
            {interestError && <p className="interest-error" role="alert">{profileCopy.error}</p>}
          </fieldset>
        </div>
        <PlatformButton className="profile-submit" type="submit">{profileCopy.continue} →</PlatformButton>
      </form>
      <aside className="poster-carousel" aria-label="Junior IT Academy courses">
        <div className="poster-viewport">
          <div className="poster-track">
            {[...posterSlides, ...posterSlides].map((poster, index) => <Image key={`${poster.src}-${index}`} src={poster.src} alt={index < posterSlides.length ? poster.alt : ""} width={1672} height={941} sizes="(max-width: 860px) 100vw, (max-width: 1200px) 30vw, 400px" />)}
          </div>
        </div>
      </aside>
    </section>}
    {screen === "subjects" && <section className="subject-screen"><button className="back-link profile-return" type="button" onClick={() => setScreen("profile")}>← {profileCopy.backToProfile}</button><div className="subject-intro"><p>{t.level}</p><h1>{t.learn}<br />{t.youKnow} <i>{t.can}</i></h1><span>{t.choose}</span></div><div className="subject-cards"><article className="subject-card math-card"><div className="card-content"><h2>{t.math}</h2><p>{split(t.mathDesc)}</p></div><span className="robot-bubble">2 + 2 = 4</span><button className="start-test" type="button" onClick={() => selectCourse("math")}>{t.start} <em>→</em></button><Image className="card-robot" src="/junior-robot.png" alt="Робот Junior" width={593} height={441} /></article><article className="subject-card english-card"><div className="card-content"><h2>{split(t.english)}</h2><p>{split(t.englishDesc)}</p></div><span className="robot-bubble">Hello!</span><button className="start-test" type="button" onClick={() => selectCourse("english")}>{t.start} <em>→</em></button><Image className="card-robot" src="/junior-robot.png" alt="Робот Junior" width={593} height={441} /></article></div></section>}
    {screen === "math-test" && <MathDiagnostic locale={locale} itemBank={mathTestBank} onBack={() => setScreen("subjects")} onHome={() => setScreen("profile")} />}
    {screen === "english-test" && <EnglishDiagnostic locale={locale} studentAge={Number(profile.age)} onHome={() => setScreen("subjects")} />}
    {readyOpen && <div className="ready-overlay" role="dialog" aria-modal="true" aria-labelledby="ready-title"><section className="ready-dialog"><p>{readyCopy.eyebrow}</p><h2 id="ready-title">{readyCopy.title}</h2><span>{readyCopy.description}</span>{selectedCourse && <strong className="selected-course">{selectedCourse === "math" ? t.math : t.english.replace("\n", " ")}</strong>}<div className="ready-actions"><PlatformButton variant="secondary" onClick={() => setReadyOpen(false)}>{readyCopy.edit}</PlatformButton><PlatformButton className="pending-start" onClick={startDiagnostic}>{readyCopy.start}</PlatformButton></div></section></div>}
    {faqOpen && <div className="faq-overlay" role="dialog" aria-modal="true" aria-labelledby="faq-title" onClick={() => setFaqOpen(false)}><section className="faq-dialog" onClick={(event) => event.stopPropagation()}><button className="faq-close" type="button" aria-label={t.close} onClick={() => setFaqOpen(false)}>×</button><Image src="/junior-robot.png" alt="" width={593} height={441} /><p>{t.faqHelp}</p><h2 id="faq-title">{t.faq}</h2><div className="faq-list"><article><b>{t.faq1}</b><span>{t.faq1a}</span></article><article><b>{t.faq2}</b><span>{t.faq2a}</span></article><article><b>{t.faq3}</b><span>{t.faq3a}</span></article></div></section></div>}
    <button className="faq-button" type="button" aria-label={t.faq} onClick={() => setFaqOpen(true)}><Image src="/faq-robot.png" alt="" width={440} height={440} /></button>
  </main>;
}
