from copy import deepcopy
from pathlib import Path
import sys

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor


SOURCE = Path(r"C:\Users\User\Downloads\TZ_English_Placement_40_questions_RU_v4.docx")
OUTPUT = Path(r"D:\Projects\diagnostic_test\TZ_English_Placement_15_questions_RU_v5_1.docx")

ACCENT = "2F6BFF"
INK = RGBColor(22, 50, 79)
MUTED = RGBColor(78, 92, 110)
LIGHT_BLUE = "EAF1FF"
LIGHT_ORANGE = "FFF2E8"
LIGHT_GRAY = "F4F6F8"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{side}"))
        if node is None:
            node = OxmlElement(f"w:{side}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_table_widths(table, widths):
    grid = table._tbl.tblGrid
    for grid_col, width in zip(grid.gridCol_lst, widths):
        grid_col.set(qn("w:w"), str(width))
    for row in table.rows:
        for cell, width in zip(row.cells, widths):
            cell.width = width
            cell._tc.tcPr.tcW.set(qn("w:w"), str(width))
            cell._tc.tcPr.tcW.set(qn("w:type"), "dxa")


def clear_document_body(doc):
    body = doc._element.body
    for child in list(body):
        if child.tag != qn("w:sectPr"):
            body.remove(child)


def set_run_font(run, size=None, bold=None, color=None):
    run.font.name = "Arimo"
    r_fonts = run._element.get_or_add_rPr().get_or_add_rFonts()
    r_fonts.set(qn("w:ascii"), "Arimo")
    r_fonts.set(qn("w:hAnsi"), "Arimo")
    r_fonts.set(qn("w:cs"), "Arimo")
    if size:
        run.font.size = Pt(size)
    if bold is not None:
        run.font.bold = bold
    if color:
        run.font.color.rgb = color


def paragraph(doc, text="", style="Normal", bold_prefix=None, center=False, keep=False):
    p = doc.add_paragraph(style=style)
    if center:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if keep:
        p.paragraph_format.keep_with_next = True
    if bold_prefix and text.startswith(bold_prefix):
        lead = p.add_run(bold_prefix)
        set_run_font(lead, bold=True)
        rest = p.add_run(text[len(bold_prefix):])
        set_run_font(rest)
    else:
        run = p.add_run(text)
        set_run_font(run)
    return p


def title(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(5)
    run = p.add_run(text)
    set_run_font(run, size=22, bold=True, color=INK)
    return p


def subtitle(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    run = p.add_run(text)
    set_run_font(run, size=11, bold=False, color=MUTED)
    return p


def h1(doc, text):
    p = doc.add_paragraph(style="Heading 1")
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, size=17, bold=True, color=INK)
    return p


def h2(doc, text):
    p = doc.add_paragraph(style="Heading 2")
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, size=12, bold=True, color=RGBColor(47, 107, 255))
    return p


def bullet(doc, text, level=0):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.left_indent = Pt(18 + level * 16)
    p.paragraph_format.first_line_indent = Pt(-10)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(text)
    set_run_font(run, size=10)
    return p


def note_box(doc, label, text, fill=LIGHT_ORANGE):
    table = doc.add_table(rows=1, cols=1)
    table.autofit = False
    set_table_widths(table, [8200])
    set_repeat_table_header(table.rows[0])
    cell = table.cell(0, 0)
    set_cell_shading(cell, fill)
    set_cell_margins(cell, top=130, start=170, bottom=130, end=170)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    lead = p.add_run(label + ": ")
    set_run_font(lead, size=10, bold=True, color=INK)
    rest = p.add_run(text)
    set_run_font(rest, size=10, color=INK)
    return table


def standard_table(doc, headers, rows, widths):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.autofit = False
    set_table_widths(table, widths)
    header = table.rows[0]
    set_repeat_table_header(header)
    for cell, text in zip(header.cells, headers):
        set_cell_shading(cell, ACCENT)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(text)
        set_run_font(run, size=9, bold=True, color=RGBColor(255, 255, 255))
    for index, row in enumerate(rows):
        cells = table.add_row().cells
        for cell, text in zip(cells, row):
            set_cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            if index % 2 == 1:
                set_cell_shading(cell, LIGHT_GRAY)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text)
            set_run_font(run, size=9, color=INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def page_break(doc):
    doc.add_paragraph().add_run().add_break()


def set_footer(doc):
    for section in doc.sections:
        footer = section.footer
        for p in footer.paragraphs:
            p._element.getparent().remove(p._element)
        p = footer.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("English Placement Test  |  ТЗ v5.1  |  15 вопросов")
        set_run_font(run, size=8, color=MUTED)


def build_document():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    doc = Document(SOURCE)
    clear_document_body(doc)
    set_footer(doc)

    title(doc, "ТЕХНИЧЕСКОЕ ЗАДАНИЕ")
    title(doc, "Адаптивный Placement Test по английскому языку")
    subtitle(doc, "Версия 5.1 | 6 августа 2026 | Обновлённая логика 15 вопросов")

    note_box(
        doc,
        "Главная идея",
        "Самооценка и возраст выбирают безопасный маршрут. Каждый тестовый маршрут состоит из 15 вопросов: 6 лёгких, 6 средних и 3 сложных. Сложный блок подтверждает готовность к среднему уровню, но не может сам по себе выдать более высокий уровень.",
        LIGHT_BLUE,
    )

    h1(doc, "1. Цель Placement")
    paragraph(doc, "Placement не является экзаменом, сертификатом CEFR или проверкой всех навыков английского языка. Его задача - рекомендовать безопасную точку старта курса.")
    bullet(doc, "Результат показывает стартовый курс, а не официальный международный уровень владения языком.")
    bullet(doc, "Ученик не видит названия CEFR-уровней до завершения теста.")
    bullet(doc, "Для ученика старше 10 лет Kids никогда не выдаётся: минимальный возможный результат - Foundation.")
    bullet(doc, "Math Placement и его логика не входят в область действия этого ТЗ.")

    h2(doc, "Пользовательские результаты")
    standard_table(
        doc,
        ["Результат в интерфейсе", "Внутренний ключ", "Смысл рекомендации"],
        [
            ["Kids", "preA1", "Буквы, базовые слова, короткие фразы."],
            ["Foundation", "Foundation", "Мост между Kids и A1: базовые предложения, there is/are, simple present и present continuous."],
            ["A1", "A1", "Начинающий уровень."],
            ["A2", "A2", "Элементарный уровень."],
            ["B1", "B1", "Средний уровень."],
        ],
        [2050, 1500, 4650],
    )
    note_box(doc, "Ограничение", "B2 присутствует в банке как сложный/stretch-блок для проверки B1, но B2 не может быть выдан итоговым результатом этого 15-вопросного Placement.")

    h1(doc, "2. Самооценка ученика")
    paragraph(doc, "Перед тестом ученик выбирает описание, а не полосу CEFR. Самооценка не является результатом: она только выбирает подходящую сложность первого маршрута.")
    standard_table(
        doc,
        ["Группа", "Варианты на экране", "Как используется"],
        [
            ["Низкая", "Я начинаю английский с нуля.\nЯ знаю отдельные английские слова.", "Для детей 8-10 лет даёт Kids без теста; для остальных начинает маршрут Foundation -> A1 -> A2."],
            ["Средняя", "Я могу читать простые слова и короткие предложения.\nЯ могу свободно написать 2-3 предложения с небольшими грамматическими ошибками.", "Выбирает детский или подростковый маршрут по возрасту."],
            ["Высокая", "Я могу рассказать о знакомой теме, но иногда сомневаюсь и делаю паузы.\nЯ уверенно общаюсь и хорошо понимаю английский.", "Выбирает более высокий стартовый маршрут."],
        ],
        [1200, 3650, 3350],
    )

    h1(doc, "3. Модель 6 / 6 / 3 и Bloom-informed blueprint")
    paragraph(doc, "Каждый тестовый маршрут содержит ровно 15 заданий. Распределение отражает не отдельные CEFR-уровни, а три слоя доказательств: базовые знания, применение и stretch-проверку.")
    standard_table(
        doc,
        ["Слой", "Количество", "Доля", "Когнитивная цель", "Роль в решении"],
        [
            ["Лёгкий", "6", "40%", "Remember + Understand", "Проверяет prerequisite-навыки нижнего уровня."],
            ["Средний", "6", "40%", "Understand + Apply", "Проверяет уровень, который может быть выдан."],
            ["Сложный", "3", "20%", "Apply в менее знакомом контексте", "Подтверждает готовность к среднему уровню; не выдаёт свой уровень напрямую."],
        ],
        [1050, 800, 700, 2200, 3450],
    )
    note_box(doc, "Важно", "Bloom's taxonomy используется как принцип проектирования заданий, а не как самостоятельная шкала CEFR. Итоговый Placement строится по уровню английских заданий и порогам ниже.")

    h2(doc, "Единое правило результата для тестового маршрута")
    standard_table(
        doc,
        ["Условие", "Решение"],
        [
            ["Все 15 ответов неверны", "Игнорировать самооценку: до 10 лет выдать Kids; старше 10 лет выдать Foundation."],
            ["Лёгкий блок < 4/6", "Выдать fallback маршрута (уровень ниже лёгкого блока или безопасный минимум маршрута)."],
            ["Лёгкий >= 4/6, но средний < 4/6", "Выдать лёгкий уровень."],
            ["Лёгкий >= 4/6 и средний >= 4/6, но сложный = 0/3", "Выдать лёгкий уровень."],
            ["Лёгкий >= 4/6, средний >= 4/6 и сложный >= 1/3", "Выдать средний уровень - это максимальный результат маршрута."],
        ],
        [3550, 4650],
    )
    paragraph(doc, "Пороги: 4/6 = 67%; 1/3 = 33%. Общий процент из 15 вопросов не используется как единственный критерий: важно, в каком именно слое были правильные ответы.")

    page_break(doc)
    h1(doc, "4. Маршруты по возрасту и самооценке")
    paragraph(doc, "Во всех строках ниже порядок одинаков: 6 лёгких -> 6 средних -> 3 сложных. Уровень сложного блока никогда не становится итоговым результатом этой попытки.")
    standard_table(
        doc,
        ["Возраст и самооценка", "15 вопросов", "Fallback при лёгком <4/6", "Максимум маршрута"],
        [
            ["8-10, низкая", "Теста нет", "Kids сразу", "Kids"],
            ["8-10, средняя", "6 Kids + 6 Foundation + 3 A1", "Kids", "Foundation"],
            ["8-10, высокая", "6 Foundation + 6 A1 + 3 A2", "Kids", "A1"],
            ["11-18, низкая", "6 Foundation + 6 A1 + 3 A2", "Foundation", "A1"],
            ["11-15, средняя", "6 A1 + 6 A2 + 3 B1", "Foundation", "A2"],
            ["11-18, высокая; 16-18, средняя", "6 A2 + 6 B1 + 3 B2", "A1", "B1"],
        ],
        [2000, 2800, 1900, 1500],
    )

    h2(doc, "Детальная логика результатов")
    standard_table(
        doc,
        ["Маршрут", "Нижний результат", "Лёгкий уровень", "Итоговый средний уровень"],
        [
            ["8-10, средняя", "Kids: Kids <4/6, либо Foundation <4/6, либо A1 = 0/3.", "-", "Foundation: Kids >=4/6, Foundation >=4/6, A1 >=1/3."],
            ["8-10, высокая", "Kids: Foundation <4/6.", "Foundation: Foundation >=4/6, но A1 <4/6 или A2 = 0/3.", "A1: Foundation >=4/6, A1 >=4/6, A2 >=1/3."],
            ["11-18, низкая", "Foundation: Foundation <4/6, A1 <4/6 или A2 = 0/3.", "-", "A1: Foundation >=4/6, A1 >=4/6, A2 >=1/3."],
            ["11-15, средняя", "Foundation: A1 <4/6.", "A1: A1 >=4/6, но A2 <4/6 или B1 = 0/3.", "A2: A1 >=4/6, A2 >=4/6, B1 >=1/3."],
            ["11-18 high / 16-18 moderate", "Foundation: все 15 ответов неверны. A1: A2 <4/6 и есть хотя бы один правильный ответ.", "A2: A2 >=4/6, но B1 <4/6 или B2 = 0/3.", "B1: A2 >=4/6, B1 >=4/6, B2 >=1/3."],
        ],
        [1600, 2400, 2200, 2000],
    )

    h1(doc, "5. Алгоритм")
    h2(doc, "Псевдокод")
    code = [
        "selfReport = student.selectSelfAssessment()",
        "lane = getEnglishPlacementLane(age, selfReport)",
        "",
        "if lane == directKids:",
        "  return complete(level=Kids, course=Kids, totalQuestions=0)",
        "",
        "items = 6 * lane.lower + 6 * lane.target + 3 * lane.stretch",
        "answers = runTest(items)",
        "easy = correct(answers, lane.lower)",
        "medium = correct(answers, lane.target)",
        "hard = correct(answers, lane.stretch)",
        "total = easy + medium + hard",
        "",
        "if total == 0:",
        "  return complete(level=lane.zeroScoreFallback, totalQuestions=15)",
        "",
        "if easy >= 4 and medium >= 4 and hard >= 1:",
        "  result = lane.target",
        "elif easy >= 4:",
        "  result = lane.lower",
        "else:",
        "  result = lane.fallback",
        "",
        "return complete(level=result, totalQuestions=15)",
        "",
        "if studentFinishesEarly:",
        "  return incomplete(level=null, answeredCount, totalQuestions=15)",
    ]
    code_table = doc.add_table(rows=1, cols=1)
    code_table.style = "Table Grid"
    set_table_widths(code_table, [8200])
    set_repeat_table_header(code_table.rows[0])
    cell = code_table.cell(0, 0)
    set_cell_shading(cell, "F5F7FA")
    set_cell_margins(cell, top=160, start=180, bottom=160, end=180)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    for index, line in enumerate(code):
        run = p.add_run(line)
        set_run_font(run, size=8, color=INK)
        if index < len(code) - 1:
            run.add_break()

    note_box(doc, "Нет confirmation test", "Дополнительные 10 вопросов подтверждения удалены. Никакой маршрут не открывает вторую часть и не может поднять ученика с target до stretch-уровня.")

    h1(doc, "6. Банк заданий")
    standard_table(
        doc,
        ["Уровень", "Количество в банке", "Распределение по навыкам", "Использование"],
        [
            ["Kids / preA1", "30", "10 language use, 10 reading, 10 listening", "Лёгкий блок для детского Foundation-маршрута."],
            ["Foundation", "30", "10 language use, 10 reading, 10 listening", "Лёгкий или средний блок."],
            ["A1", "30", "10 language use, 10 reading, 10 listening", "Средний или сложный блок."],
            ["A2", "30", "10 language use, 10 reading, 10 listening", "Средний или сложный блок."],
            ["B1", "30", "10 language use, 10 reading, 10 listening", "Средний или сложный блок."],
            ["B2", "30", "10 language use, 10 reading, 10 listening", "Только сложный блок для B1-маршрута."],
        ],
        [1300, 1450, 2850, 2600],
    )
    bullet(doc, "Внутри каждого навыка: 3 лёгких, 4 средних и 3 сложных item'а.")
    bullet(doc, "В шести-вопросном блоке: 2 language use, 2 reading, 2 listening. В трёх-вопросном hard-блоке: по одному заданию каждого навыка.")
    bullet(doc, "Каждый вопрос проверяет одну главную вещь, имеет один правильный ответ, естественный контекст и корректную пунктуацию.")
    bullet(doc, "Не использовать бессмысленные вопросы на механическое считывание расписания; короткое чтение должно проверять понятную инструкцию, сообщение или ситуацию.")
    bullet(doc, "Контрольный item A1-r-07: “The lift is out of order. Please use the stairs. What should people do?” Правильный ответ: “Use the stairs”.")

    page_break(doc)
    h1(doc, "7. Требования к интерфейсу и сессии")
    h2(doc, "До теста")
    bullet(doc, "При входе в English Placement всегда показывать страницу самооценки. После незавершённого выхода и нового входа самооценка должна запрашиваться снова.")
    bullet(doc, "Для детей 8-10 лет с низкой самооценкой сразу показать единственный результат Kids без вопросов.")
    bullet(doc, "Шкала самооценки содержит шесть описательных вариантов и иллюстрации в едином стиле; не показывает A1, B1 и другие CEFR-полосы.")

    h2(doc, "Во время теста")
    bullet(doc, "Один вопрос на экране. Показывать общий счётчик: «Задание N из 15». Вверху - один прогресс-бар для единственного тестового маршрута.")
    bullet(doc, "Кнопки: «Ответить», «Не знаю» и «Назад». «Назад» позволяет изменить ответ только внутри активного 15-вопросного маршрута.")
    bullet(doc, "Не показывать верно/неверно, промежуточный результат, предполагаемый уровень или результат по блоку.")
    bullet(doc, "Перед первым listening - проверка звука; аудио можно прослушать максимум два раза.")
    bullet(doc, "Вопрос, самооценка, итог и incomplete-экран должны помещаться без вертикальной прокрутки страницы и внутренних контейнеров. Нижние действия всегда видимы.")

    h2(doc, "Выход и повторная попытка")
    bullet(doc, "«Завершить тест» открывает подтверждение: «Если завершить тест сейчас, уровень не будет определён. Чтобы получить рекомендацию, нужно ответить на все вопросы». ")
    bullet(doc, "После подтверждённого выхода показать: «Тест не завершён», «Уровень пока не определён», количество отвеченных заданий из 15 и кнопку повторного прохождения.")
    bullet(doc, "Непоказанные вопросы не считаются ошибками. Incomplete не содержит placementLevel, курс, итоговый балл или статистику навыков.")
    bullet(doc, "Схема сессии: version 8. Старые незавершённые сессии с удалённым confirmation-stage не восстанавливаются.")

    h2(doc, "Итоговый экран")
    bullet(doc, "Показывать один финальный экран после ответа на вопрос 15 либо сразу после direct Kids.")
    bullet(doc, "Компактно показывать рекомендованный уровень, курс, верные ответы, сильные навыки, навыки для тренировки и действия «Пройти заново» / «К выбору курса». ")
    bullet(doc, "Badge Foundation должен иметь адаптивную ширину и не пересекаться с описанием курса.")

    h1(doc, "8. Формат результата")
    standard_table(
        doc,
        ["Поле", "Смысл"],
        [
            ["placementLevel", "preA1 | Foundation | A1 | A2 | B1. В интерфейсе preA1 отображается как Kids."],
            ["recommendedCourse", "Kids | Foundation | A1 | A2 | B1."],
            ["answeredCount / totalQuestions", "15 для тестового маршрута; 0 для direct Kids; фактическое количество и 15 для incomplete."],
            ["score", "Общее число правильных ответов. Не используется как единственный порог результата."],
            ["levelStats / skillStats", "Статистика по показанным заданиям для объяснения сильных сторон и зон тренировки."],
            ["reasonCode", "Например: ZERO_EVIDENCE_FALLBACK, TIER_GATE_PASSED, EASY_TIER_NOT_PASSED, MEDIUM_OR_HARD_TIER_NOT_PASSED, STUDENT_EXITED_BEFORE_COMPLETION."],
        ],
        [2500, 5700],
    )

    h1(doc, "9. Критерии готовности")
    checklist = [
        "Для 8-10 + low результат Kids выдаётся без теста.",
        "Каждый тестовый маршрут содержит ровно 15 вопросов: 6 + 6 + 3.",
        "Средний уровень выдаётся только при easy >=4/6, medium >=4/6 и hard >=1/3.",
        "Hard/stretch-уровень никогда не выдаётся итогом маршрута.",
        "При 0/15 самооценка не удерживает высокий старт: до 10 лет итог Kids, старше 10 лет итог Foundation.",
        "Для каждого маршрута ученика старше 10 лет результат Kids запрещён; минимальный placementLevel - Foundation.",
        "B2 не выдаётся результатом текущей версии Placement.",
        "После 15-го ответа сразу показан один финальный экран; confirmation test отсутствует.",
        "Выход до завершения создаёт incomplete / unknown, а не Kids или другой уровень.",
        "Возврат к вопросу доступен внутри активного маршрута; повторный вход после выхода всегда начинается с самооценки.",
        "На desktop и mobile нет вертикальной прокрутки, обрезанных вопросов и недоступных нижних кнопок.",
        "Есть unit-тесты минимум для direct Kids, порога 4/6-4/6-1/3, fallback и caps Foundation/A1/A2/B1.",
    ]
    for item in checklist:
        bullet(doc, "□ " + item)

    h1(doc, "10. Пилот и калибровка")
    paragraph(doc, "Пороги 4/6, 4/6 и 1/3 являются продуктовыми гипотезами. Они разумно разделяют prerequisite, применение и stretch-сигнал, но не являются готовым научным стандартом.")
    bullet(doc, "Сравнить рекомендацию Placement с независимой оценкой преподавателя.")
    bullet(doc, "Проверить успеваемость и отвал в первые 3-5 уроков рекомендованного курса.")
    bullet(doc, "Проверить каждый distractor, время ответа, слишком быстрые ответы и ошибки аудио.")
    bullet(doc, "Отдельно проверить 1/3 hard: это слабый сигнал готовности и не должен называться mastery более высокого уровня.")
    bullet(doc, "После пилота при необходимости уточнить пороги, но сохранить принцип: hard-блок подтверждает target, а не повышает выше него.")

    h1(doc, "11. Источники и ограничения")
    bullet(doc, "Council of Europe. CEFR level descriptions and Companion Volume.")
    bullet(doc, "Anderson, L. W., and Krathwohl, D. R. A taxonomy for learning, teaching, and assessing. Bloom-informed design используется только как blueprint заданий.")
    bullet(doc, "Результат Placement не заменяет Speaking и Writing assessment, поэтому не является официальной CEFR-сертификацией.")

    doc.core_properties.title = "ТЗ English Placement Test - версия 5.1"
    doc.core_properties.subject = "Логика 15-вопросного English Placement"
    doc.core_properties.comments = "Обновлено для маршрутов с самооценкой, возрастом и логикой 6/6/3."
    doc.core_properties.author = "Junior"
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build_document()
