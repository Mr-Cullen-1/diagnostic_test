"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Locale = "ru" | "uz";
type LocalText = Record<Locale, string>;
type Course = "math" | "english";
type Interest = { id: string; label: LocalText };
type DropdownKind = "education" | "interests";

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
    english: "Ingliz\ntili", englishDesc: "Ingliz tili bo‘yicha\ndarajangizni aniqlang.",
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
    description: "Выбери минимум три интереса — так нашей команде будет проще понять, что тебе нравится.",
    name: "Имя и фамилия", namePlaceholder: "Например, Азиза Каримова", age: "Возраст", agePlaceholder: "Например, 9",
    classLabel: "Класс", classPlaceholder: "Выбери класс", interests: "Интересы", interestsTitle: "Что тебе нравится? Выбери как минимум 3", interestsHint: "Выбери не меньше 3",
    error: "Выбери ещё интересы: нужно минимум 3.", continue: "Продолжить", backToProfile: "Назад к анкете",
  },
  uz: {
    eyebrow: "O‘quvchi anketasi", robot: "Junior gapiryapti", title: "O‘zing haqingda aytib ber",
    description: "Kamida uchta qiziqishni tanlang — shunda jamoamiz sizga nimalar yoqishini yaxshiroq tushunadi.",
    name: "Ism va familiya", namePlaceholder: "Masalan, Aziza Karimova", age: "Yosh", agePlaceholder: "Masalan, 9",
    classLabel: "Sinf", classPlaceholder: "Sinfni tanlang", interests: "Qiziqishlar", interestsTitle: "Senga nima yoqadi? Kamida 3 tasini tanla", interestsHint: "Kamida 3 tasini tanlang",
    error: "Yana qiziqishlarni tanlang: kamida 3 ta bo‘lishi kerak.", continue: "Davom etish", backToProfile: "Anketaga qaytish",
  },
};

const confirmationText = {
  ru: { eyebrow: "Курс выбран", title: "Ты готов начать?", description: "Отлично! Приготовься: тест начнётся сразу после подтверждения.", edit: "Выбрать другой курс", start: "Да, я готов" },
  uz: { eyebrow: "Kurs tanlandi", title: "Boshlashga tayyormisan?", description: "Ajoyib! Tayyorgarlik ko‘ring: tasdiqlaganingizdan so‘ng test boshlanadi.", edit: "Boshqa kursni tanlash", start: "Ha, tayyorman" },
};

const educationLabel = L("Образование", "Ta’lim");
const subjectsLabel = L("Предметы", "Fanlar");

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

const posterSlides = [
  { src: "/poster-math.png", alt: "Matematika" },
  { src: "/poster-kids-english.png", alt: "Kids English" },
  { src: "/poster-typing.png", alt: "Typing" },
  { src: "/poster-english.png", alt: "English" },
];

function Header({ locale, setLocale }: { locale: Locale; setLocale: (locale: Locale) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return <>
    <header className="junior-header">
      <div className="junior-nav-inner">
        <button className="mobile-menu-button" type="button" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
        <span className="logo-button" aria-label="Junior"><img src="/junior-logo.png" alt="Junior" /></span>
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
  const [screen, setScreen] = useState<"profile" | "subjects">("profile");
  const [faqOpen, setFaqOpen] = useState(false);
  const [readyOpen, setReadyOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [interestError, setInterestError] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKind | null>(null);
  const [closingDropdown, setClosingDropdown] = useState<DropdownKind | null>(null);
  const [educationSearch, setEducationSearch] = useState("");
  const [interestSearch, setInterestSearch] = useState("");
  const [dropdownPlacement, setDropdownPlacement] = useState<Record<DropdownKind, "up" | "down">>({ education: "down", interests: "down" });
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<Record<DropdownKind, number>>({ education: 280, interests: 280 });
  const [profile, setProfile] = useState({ name: "", age: "", grade: "", interests: [] as string[] });
  const educationDropdownRef = useRef<HTMLDivElement>(null);
  const interestsDropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = text[locale];
  const profileCopy = profileText[locale];
  const readyCopy = confirmationText[locale];
  const selectedEducation = educationSubtopics.filter((interest) => profile.interests.includes(interest.id));
  const selectedInterests = interests.filter((interest) => profile.interests.includes(interest.id));
  const searchPlaceholder = locale === "ru" ? "Поиск" : "Qidirish";
  const noResultsText = locale === "ru" ? "Ничего не найдено" : "Hech narsa topilmadi";
  const split = (value: string) => value.split("\n").map((line, index) => <span key={index}>{line}{index === value.split("\n").length - 1 ? null : <br />}</span>);

  function toggleInterest(id: string) {
    setProfile((current) => {
      const nextInterests = current.interests.includes(id) ? current.interests.filter((item) => item !== id) : [...current.interests, id];
      if (nextInterests.length >= 3) setInterestError(false);
      return { ...current, interests: nextInterests };
    });
  }

  function clearInterestGroup(group: Interest[]) {
    const ids = new Set(group.map((interest) => interest.id));
    setInterestError(false);
    setProfile((current) => ({ ...current, interests: current.interests.filter((id) => !ids.has(id)) }));
  }

  function calculateDropdownPosition(kind: DropdownKind) {
    const element = (kind === "education" ? educationDropdownRef : interestsDropdownRef).current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const placement = below >= above ? "down" : "up";
    const available = placement === "down" ? below : above;
    setDropdownPlacement((current) => ({ ...current, [kind]: placement }));
    setDropdownMaxHeight((current) => ({ ...current, [kind]: Math.max(0, Math.min(320, available)) }));
  }

  function closeDropdown() {
    if (!activeDropdown) return;
    setClosingDropdown(activeDropdown);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => { setActiveDropdown(null); setClosingDropdown(null); }, 180);
  }

  function toggleDropdown(kind: DropdownKind) {
    if (activeDropdown === kind) return closeDropdown();
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosingDropdown(null);
    calculateDropdownPosition(kind);
    setActiveDropdown(kind);
  }

  function renderSelectionChips(selected: Interest[], placeholder: string) {
    if (!selected.length) return <span className="interest-placeholder">{placeholder}</span>;
    return <span className="selected-interest-chips">{selected.slice(0, 2).map((interest) => <span key={interest.id}>{interest.label[locale]}</span>)}{selected.length > 2 && <b>+{selected.length - 2}</b>}</span>;
  }

  useEffect(() => {
    if (!activeDropdown) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!educationDropdownRef.current?.contains(target) && !interestsDropdownRef.current?.contains(target)) closeDropdown();
    };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closeDropdown(); };
    const reposition = () => calculateDropdownPosition(activeDropdown);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
      window.removeEventListener("resize", reposition);
    };
  }, [activeDropdown]);

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profile.interests.length < 3) return setInterestError(true);
    setScreen("subjects");
  }

  function selectCourse(course: Course) { setSelectedCourse(course); setReadyOpen(true); }
  function startDiagnostic() { setReadyOpen(false); }

  return <main className={`app-shell screen-${screen}`} lang={locale}>
    <Header locale={locale} setLocale={setLocale} />
    {screen === "profile" && <section className="profile-screen">
      <form className="profile-form" onSubmit={submitProfile}>
        <div className="profile-form-top"><p>{profileCopy.eyebrow}</p></div>
        <div className="profile-heading"><div><h1>{profileCopy.title}</h1><span>{profileCopy.description}</span></div><img className="profile-form-robot" src="/robot-form.png" alt="" /></div>
        <div className="profile-fields">
          <label className="wide"><span>{profileCopy.name}</span><input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder={profileCopy.namePlaceholder} /></label>
          <label><span>{profileCopy.age}</span><input required inputMode="numeric" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} placeholder={profileCopy.agePlaceholder} /></label>
          <label><span>{profileCopy.classLabel}</span><select required value={profile.grade} onChange={(event) => setProfile({ ...profile, grade: event.target.value })}><option value="" disabled>{profileCopy.classPlaceholder}</option>{Array.from({ length: 11 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>{grade} {t.class}</option>)}</select></label>
          <fieldset className={`interests-field ${interestError ? "has-error" : ""}`}>
            <div className="interests-heading"><legend>{profileCopy.interestsTitle}</legend></div>
            <div ref={educationDropdownRef} className={`interests-dropdown ${activeDropdown === "education" ? `open ${dropdownPlacement.education}` : ""}`}>
              <span className="interest-field-label">{educationLabel[locale]}</span>
              <div className="interest-select-control"><button className="interests-trigger" type="button" aria-expanded={activeDropdown === "education"} onClick={() => toggleDropdown("education")}>{renderSelectionChips(selectedEducation, subjectsLabel[locale])}<i>⌄</i></button>{selectedEducation.length > 0 && <button className="interests-clear" type="button" aria-label={locale === "ru" ? "Очистить образование" : "Ta’limni tozalash"} onClick={() => clearInterestGroup(educationSubtopics)}>×</button>}</div>
              {activeDropdown === "education" && <div className={`interests-menu ${dropdownPlacement.education} ${closingDropdown === "education" ? "closing" : ""}`} style={{ maxHeight: dropdownMaxHeight.education }} role="listbox" aria-multiselectable="true"><label className="interest-search"><input autoFocus type="search" value={educationSearch} onChange={(event) => setEducationSearch(event.target.value)} placeholder={searchPlaceholder} /></label><div className="interest-list">{educationSubtopics.filter((interest) => interest.label[locale].toLocaleLowerCase().includes(educationSearch.trim().toLocaleLowerCase())).map((interest) => <label key={interest.id} className={profile.interests.includes(interest.id) ? "selected" : ""}><input type="checkbox" checked={profile.interests.includes(interest.id)} onChange={() => toggleInterest(interest.id)} /><span>{interest.label[locale]}</span></label>)}{!educationSubtopics.some((interest) => interest.label[locale].toLocaleLowerCase().includes(educationSearch.trim().toLocaleLowerCase())) && <p className="interest-no-results">{noResultsText}</p>}</div></div>}
            </div>
            <div ref={interestsDropdownRef} className={`interests-dropdown ${activeDropdown === "interests" ? `open ${dropdownPlacement.interests}` : ""}`}>
              <span className="interest-field-label">{profileCopy.interests}</span>
              <div className="interest-select-control"><button className="interests-trigger" type="button" aria-expanded={activeDropdown === "interests"} onClick={() => toggleDropdown("interests")}>{renderSelectionChips(selectedInterests, profileCopy.interestsHint)}<i>⌄</i></button>{selectedInterests.length > 0 && <button className="interests-clear" type="button" aria-label={locale === "ru" ? "Очистить интересы" : "Qiziqishlarni tozalash"} onClick={() => clearInterestGroup(interests)}>×</button>}</div>
              {activeDropdown === "interests" && <div className={`interests-menu ${dropdownPlacement.interests} ${closingDropdown === "interests" ? "closing" : ""}`} style={{ maxHeight: dropdownMaxHeight.interests }} role="listbox" aria-multiselectable="true"><label className="interest-search"><input autoFocus type="search" value={interestSearch} onChange={(event) => setInterestSearch(event.target.value)} placeholder={searchPlaceholder} /></label><div className="interest-list">{interests.filter((interest) => interest.label[locale].toLocaleLowerCase().includes(interestSearch.trim().toLocaleLowerCase())).map((interest) => <label key={interest.id} className={profile.interests.includes(interest.id) ? "selected" : ""}><input type="checkbox" checked={profile.interests.includes(interest.id)} onChange={() => toggleInterest(interest.id)} /><span>{interest.label[locale]}</span></label>)}{!interests.some((interest) => interest.label[locale].toLocaleLowerCase().includes(interestSearch.trim().toLocaleLowerCase())) && <p className="interest-no-results">{noResultsText}</p>}</div></div>}
            </div>
            {interestError && <p className="interest-error" role="alert">{profileCopy.error}</p>}
          </fieldset>
        </div>
        <button className="orange-button profile-submit" type="submit">{profileCopy.continue} →</button>
      </form>
      <aside className="poster-carousel" aria-label="Junior IT Academy courses">
        <div className="poster-viewport">
          <div className="poster-track">
            {[...posterSlides, ...posterSlides].map((poster, index) => <img key={`${poster.src}-${index}`} src={poster.src} alt={index < posterSlides.length ? poster.alt : ""} />)}
          </div>
        </div>
      </aside>
    </section>}
    {screen === "subjects" && <section className="subject-screen"><button className="back-link profile-return" type="button" onClick={() => setScreen("profile")}>← {profileCopy.backToProfile}</button><div className="subject-intro"><p>{t.level}</p><h1>{t.learn}<br />{t.youKnow} <i>{t.can}</i></h1><span>{t.choose}</span></div><div className="subject-cards"><article className="subject-card math-card"><div className="card-content"><h2>{t.math}</h2><p>{split(t.mathDesc)}</p></div><span className="robot-bubble">2 + 2 = 4</span><button className="start-test" type="button" onClick={() => selectCourse("math")}>{t.start} <em>→</em></button><img className="card-robot" src="/junior-robot.png" alt="Робот Junior" /></article><article className="subject-card english-card"><div className="card-content"><h2>{split(t.english)}</h2><p>{split(t.englishDesc)}</p></div><span className="robot-bubble">Hello!</span><button className="start-test" type="button" onClick={() => selectCourse("english")}>{t.start} <em>→</em></button><img className="card-robot" src="/junior-robot.png" alt="Робот Junior" /></article></div></section>}
    {readyOpen && <div className="ready-overlay" role="dialog" aria-modal="true" aria-labelledby="ready-title"><section className="ready-dialog"><p>{readyCopy.eyebrow}</p><h2 id="ready-title">{readyCopy.title}</h2><span>{readyCopy.description}</span>{selectedCourse && <strong className="selected-course">{selectedCourse === "math" ? t.math : t.english.replace("\n", " ")}</strong>}<div className="ready-actions"><button className="text-button" type="button" onClick={() => setReadyOpen(false)}>{readyCopy.edit}</button><button className="orange-button pending-start" type="button" onClick={startDiagnostic}>{readyCopy.start}</button></div></section></div>}
    {faqOpen && <div className="faq-overlay" role="dialog" aria-modal="true" aria-labelledby="faq-title" onClick={() => setFaqOpen(false)}><section className="faq-dialog" onClick={(event) => event.stopPropagation()}><button className="faq-close" type="button" aria-label={t.close} onClick={() => setFaqOpen(false)}>×</button><img src="/junior-robot.png" alt="" /><p>{t.faqHelp}</p><h2 id="faq-title">{t.faq}</h2><div className="faq-list"><article><b>{t.faq1}</b><span>{t.faq1a}</span></article><article><b>{t.faq2}</b><span>{t.faq2a}</span></article><article><b>{t.faq3}</b><span>{t.faq3a}</span></article></div></section></div>}
    <button className="faq-button" type="button" aria-label={t.faq} onClick={() => setFaqOpen(true)}><img src="/faq-robot.png" alt="" /></button>
  </main>;
}
