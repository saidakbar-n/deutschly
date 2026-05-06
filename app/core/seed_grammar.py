from sqlalchemy.orm import Session
from app.models.grammar_book import GrammarBook
from app.models.grammar_chapter import GrammarChapter
from app.models.grammar_rule import GrammarRule
from app.models.grammar_exercise import GrammarExercise

BOOKS = [
    {"level": "A1", "title": "Netzwerk Neu A1", "description": "Beginner German — 12 chapters", "sort_order": 1},
    {"level": "A2", "title": "Netzwerk Neu A2", "description": "Elementary German — 12 chapters", "sort_order": 2},
    {"level": "B1", "title": "Netzwerk Neu B1", "description": "Intermediate German — 12 chapters", "sort_order": 3},
    {"level": "B2", "title": "Netzwerk Neu B2", "description": "Upper Intermediate German — 12 chapters", "sort_order": 4},
    {"level": "C1", "title": "Netzwerk Neu C1", "description": "Advanced German — 10 chapters", "sort_order": 5},
]

CHAPTERS = {
    "A1": [
        {"number": 1, "title": "Kapitel 1: Guten Tag! Ich bin...", "topic": "Verb sein, Personal pronouns"},
        {"number": 2, "title": "Kapitel 2: Meine Familie", "topic": "Possessive articles, Verb haben"},
        {"number": 3, "title": "Kapitel 3: Was machst du?", "topic": "Present tense regular verbs"},
        {"number": 4, "title": "Kapitel 4: Essen und Trinken", "topic": "Nominativ articles, Indefinite article"},
        {"number": 5, "title": "Kapitel 5: Mein Tag", "topic": "Separable verbs, Time expressions"},
        {"number": 6, "title": "Kapitel 6: Wohnen", "topic": "Akkusativ case, haben + Akkusativ"},
        {"number": 7, "title": "Kapitel 7: Freizeit", "topic": "Modal verbs (können, mögen, wollen)"},
        {"number": 8, "title": "Kapitel 8: Einkaufen", "topic": "Negation (kein/nicht), Numbers"},
        {"number": 9, "title": "Kapitel 9: Gesundheit", "topic": "Imperativ, Body parts"},
        {"number": 10, "title": "Kapitel 10: Reisen", "topic": "Dative prepositions (in, an, auf)"},
        {"number": 11, "title": "Kapitel 11: Arbeit", "topic": "zu + infinitive, Connectors"},
        {"number": 12, "title": "Kapitel 12: Feste feiern", "topic": "Past tense intro (war, hatte), Review"},
    ],
    "A2": [
        {"number": 1, "title": "Kapitel 1: Mein Alltag", "topic": "Perfekt with haben"},
        {"number": 2, "title": "Kapitel 2: Reise und Transport", "topic": "Perfekt with sein"},
        {"number": 3, "title": "Kapitel 3: Essen und Kochen", "topic": "Akkusativ pronouns"},
        {"number": 4, "title": "Kapitel 4: Wohnung und Haus", "topic": "Dativ case, Two-way prepositions"},
        {"number": 5, "title": "Kapitel 5: Einkaufen und Mode", "topic": "Comparative, Adjective endings"},
        {"number": 6, "title": "Kapitel 6: Beziehungen", "topic": "Dativ pronouns, Reflexive verbs"},
        {"number": 7, "title": "Kapitel 7: Gesundheit", "topic": "Konjunktiv II (polite requests)"},
        {"number": 8, "title": "Kapitel 8: Medien und Kommunikation", "topic": "Subordinate clauses (weil, dass, wenn)"},
        {"number": 9, "title": "Kapitel 9: Natur und Umwelt", "topic": "Genitive case"},
        {"number": 10, "title": "Kapitel 10: Berufe und Arbeit", "topic": "Passive voice intro"},
        {"number": 11, "title": "Kapitel 11: Kultur und Kunst", "topic": "Relative clauses"},
        {"number": 12, "title": "Kapitel 12: Zukunft", "topic": "Future tense (werden), Review"},
    ],
    "B1": [
        {"number": 1, "title": "Kapitel 1: Gesellschaft", "topic": "Subordinate clauses (obwohl)"},
        {"number": 2, "title": "Kapitel 2: Arbeitswelt", "topic": "Nominalisierung"},
        {"number": 3, "title": "Kapitel 3: Medien", "topic": "Konjunktiv I (reported speech)"},
        {"number": 4, "title": "Kapitel 4: Reisen und Mobilität", "topic": "Two-way prepositions with Akk/Dat"},
        {"number": 5, "title": "Kapitel 5: Technik im Alltag", "topic": "Infinitive clauses (um...zu, ohne...zu)"},
        {"number": 6, "title": "Kapitel 6: Umwelt", "topic": "Passive with modal verbs"},
        {"number": 7, "title": "Kapitel 7: Gesundheit", "topic": "Extended participial phrases"},
        {"number": 8, "title": "Kapitel 8: Geschichte", "topic": "Plusquamperfekt"},
        {"number": 9, "title": "Kapitel 9: Sprache und Lernen", "topic": "Wortbildung — compound nouns"},
        {"number": 10, "title": "Kapitel 10: Globalisierung", "topic": "Conditional sentences"},
        {"number": 11, "title": "Kapitel 11: Kultur im Vergleich", "topic": "Indirect questions"},
        {"number": 12, "title": "Kapitel 12: Zukunftsvisionen", "topic": "Konzessive Konjunktionen, Review"},
    ],
    "B2": [
        {"number": 1, "title": "Kapitel 1: Sprache und Identität", "topic": "Extended attributive phrases"},
        {"number": 2, "title": "Kapitel 2: Wirtschaft und Arbeit", "topic": "Funktionsverbgefüge"},
        {"number": 3, "title": "Kapitel 3: Politik und Gesellschaft", "topic": "Konjunktiv II — complex"},
        {"number": 4, "title": "Kapitel 4: Wissenschaft", "topic": "Zustandspassiv"},
        {"number": 5, "title": "Kapitel 5: Kunst und Literatur", "topic": "Genitive prepositions"},
        {"number": 6, "title": "Kapitel 6: Medien und Kritik", "topic": "Nomen-Verb-Verbindungen"},
        {"number": 7, "title": "Kapitel 7: Mobilität", "topic": "Adversative Konjunktionen"},
        {"number": 8, "title": "Kapitel 8: Umwelt und Klima", "topic": "Textverknüpfungsmittel"},
        {"number": 9, "title": "Kapitel 9: Bildung", "topic": "Modalpartikeln"},
        {"number": 10, "title": "Kapitel 10: Geschichte und Erinnerung", "topic": "Partizipialkonstruktionen"},
        {"number": 11, "title": "Kapitel 11: Globale Themen", "topic": "Finalsätze (B2 level)"},
        {"number": 12, "title": "Kapitel 12: Zukunft der Arbeit", "topic": "Register — formal vs informal, Review"},
    ],
    "C1": [
        {"number": 1, "title": "Kapitel 1: Sprache und Stil", "topic": "Stilistische Variation, Nominalisierungen"},
        {"number": 2, "title": "Kapitel 2: Gesellschaft", "topic": "Mehrteilige Konnektoren"},
        {"number": 3, "title": "Kapitel 3: Wissenschaft und Forschung", "topic": "Konzessive Konstruktionen (C1)"},
        {"number": 4, "title": "Kapitel 4: Wirtschaft", "topic": "Passivumschreibungen (sein + zu + Inf)"},
        {"number": 5, "title": "Kapitel 5: Kulturelle Vielfalt", "topic": "Attribute chains and reduction"},
        {"number": 6, "title": "Kapitel 6: Medizin und Ethik", "topic": "Konjunktiv I in academic writing"},
        {"number": 7, "title": "Kapitel 7: Recht und Politik", "topic": "Erweiterte Nominalgruppen"},
        {"number": 8, "title": "Kapitel 8: Technologie und Innovation", "topic": "Wissenschaftlicher Schreibstil"},
        {"number": 9, "title": "Kapitel 9: Internationale Beziehungen", "topic": "Komplexe Satzgefüge"},
        {"number": 10, "title": "Kapitel 10: Zukunftsfragen", "topic": "Stilistische Kompetenz, Review"},
    ],
}

RULES = {
    "A1_ch1": [
        {"name": "Verb sein — present tense", "description": "ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind", "category": "Verb Conjugation"},
        {"name": "Personal pronouns", "description": "ich, du, er, sie, es, wir, ihr, sie/Sie", "category": "Pronouns"},
    ],
    "A1_ch2": [
        {"name": "Possessive articles — mein/dein", "description": "mein, mein(e), mein(e), unser, euer, ihr/Ihr", "category": "Possessives"},
        {"name": "Verb haben — present tense", "description": "ich habe, du hast, er hat, wir haben, ihr habt, sie haben", "category": "Verb Conjugation"},
    ],
    "A1_ch3": [
        {"name": "Present tense — regular verbs", "description": "Add -e, -st, -t, -en, -t, -en endings to the stem", "category": "Verb Conjugation"},
        {"name": "Verb conjugation patterns", "description": "Regular and common irregular verb patterns", "category": "Verb Conjugation"},
    ],
    "A1_ch4": [
        {"name": "Nominativ articles", "description": "der (m), die (f), das (n), die (pl) — subject case", "category": "Cases"},
        {"name": "Indefinite article", "description": "ein (m/n), eine (f) — for non-specific nouns", "category": "Articles"},
    ],
    "A1_ch5": [
        {"name": "Separable verbs", "description": "Verbs like aufstehen, anrufen — prefix separates in main clause", "category": "Verbs"},
        {"name": "Time expressions", "description": "um, am, im — telling time and dates", "category": "Adverbs"},
    ],
    "A1_ch6": [
        {"name": "Akkusativ case", "description": "den (m), die (f), das (n), die (pl) — direct object", "category": "Cases"},
        {"name": "haben + Akkusativ", "description": "haben always takes Akkusativ object", "category": "Verbs"},
    ],
    "A1_ch7": [
        {"name": "Modal verbs — können", "description": "ich kann, du kannst, er kann — ability/possibility", "category": "Modal Verbs"},
        {"name": "Modal verbs — mögen/wollen", "description": "mögen = like, wollen = want to", "category": "Modal Verbs"},
    ],
    "A1_ch8": [
        {"name": "Negation — kein", "description": "kein/keine/keinen negates nouns with indefinite article or no article", "category": "Negation"},
        {"name": "Negation — nicht", "description": "nicht negates verbs, adjectives, and specific elements", "category": "Negation"},
    ],
    "A1_ch9": [
        {"name": "Imperativ", "description": "Command form: du → stem + e, ihr → stem + t, Sie → infinitive + Sie", "category": "Mood"},
        {"name": "Body parts vocabulary", "description": "Der Kopf, die Hand, der Fuß — with articles", "category": "Vocabulary"},
    ],
    "A1_ch10": [
        {"name": "Dative prepositions — in/an/auf", "description": "With places: in der Stadt, an der Wand, auf dem Tisch", "category": "Prepositions"},
        {"name": "Dativ case intro", "description": "dem (m/n), der (f), den (pl) — indirect object", "category": "Cases"},
    ],
    "A1_ch11": [
        {"name": "zu + infinitive", "description": "Ich habe Lust, Deutsch zu lernen", "category": "Infinitive"},
        {"name": "Sentence connectors", "description": "und, oder, aber, denn — connecting main clauses", "category": "Connectors"},
    ],
    "A1_ch12": [
        {"name": "Past tense — war/hatte", "description": "Präteritum of sein (war) and haben (hatte)", "category": "Past Tense"},
        {"name": "Review A1", "description": "Consolidation of all A1 grammar points", "category": "Review"},
    ],
    "A2_ch1": [
        {"name": "Perfekt with haben", "description": "Regular verbs: ich habe gekauft, ich habe gespielt", "category": "Past Tense"},
        {"name": "Perfekt — ge- prefix", "description": "Past participle formation: ge + stem + t/en", "category": "Past Tense"},
    ],
    "A2_ch2": [
        {"name": "Perfekt with sein", "description": "Movement/change of state verbs: ich bin gegangen, ich bin gefahren", "category": "Past Tense"},
        {"name": "Perfekt — irregular verbs", "description": "Strong verbs: ich habe gesehen, ich habe geschrieben", "category": "Past Tense"},
    ],
    "A2_ch3": [
        {"name": "Akkusativ pronouns", "description": "ihn (m), sie (f), es (n) — direct object pronouns", "category": "Pronouns"},
        {"name": "Pronoun word order", "description": "Pronouns come before nouns in Akkusativ", "category": "Syntax"},
    ],
    "A2_ch4": [
        {"name": "Dativ case full", "description": "dem (m/n), der (f), den + n (pl) — indirect object", "category": "Cases"},
        {"name": "Two-way prepositions", "description": "in, an, auf, neben, zwischen, vor, hinter, über, unter — Dativ = location", "category": "Prepositions"},
    ],
    "A2_ch5": [
        {"name": "Comparative and superlative", "description": "größer, am größten; besser, am besten", "category": "Adjectives"},
        {"name": "Adjective endings intro", "description": "After definite article: der gute Mann, die gute Frau", "category": "Adjectives"},
    ],
    "A2_ch6": [
        {"name": "Dativ pronouns", "description": "ihm (m/n), ihr (f), ihnen (pl) — indirect object pronouns", "category": "Pronouns"},
        {"name": "Reflexive verbs intro", "description": "sich freuen, sich interessieren — with Akkusativ reflexive", "category": "Verbs"},
    ],
    "A2_ch7": [
        {"name": "Konjunktiv II — polite requests", "description": "würde + infinitive, hätte, wäre — polite form", "category": "Mood"},
        {"name": "Höfliche Fragen", "description": "Könnten Sie...? Würden Sie bitte...?", "category": "Mood"},
    ],
    "A2_ch8": [
        {"name": "Subordinate clause — weil", "description": "weil sends verb to end: Ich lerne, weil ich Deutsch mag", "category": "Clauses"},
        {"name": "Subordinate clause — dass/wenn", "description": "dass = that, wenn = if/when — verb at end", "category": "Clauses"},
    ],
    "A2_ch9": [
        {"name": "Genitive case intro", "description": "des Mannes, der Frau — possession", "category": "Cases"},
        {"name": "Genitive prepositions", "description": "wegen, trotz, während + Genitiv", "category": "Prepositions"},
    ],
    "A2_ch10": [
        {"name": "Passive voice intro", "description": "werden + Partizip II: Das Buch wird gelesen", "category": "Voice"},
        {"name": "Passive — agent", "description": "von + Dativ for the doer: Das Buch wird von dem Schüler gelesen", "category": "Voice"},
    ],
    "A2_ch11": [
        {"name": "Relative clauses", "description": "der, die, das — relative pronouns match gender and case", "category": "Clauses"},
        {"name": "Relative pronoun cases", "description": "Nominativ and Akkusativ relative pronouns", "category": "Clauses"},
    ],
    "A2_ch12": [
        {"name": "Future tense — werden", "description": "Ich werde Deutsch lernen — future with werden + infinitive", "category": "Future Tense"},
        {"name": "Review A2", "description": "Consolidation of all A2 grammar points", "category": "Review"},
    ],
    "B1_ch1": [
        {"name": "Subordinate clause — obwohl", "description": "obwohl = although — verb at end: Obwohl es raining ist, gehe ich raus", "category": "Clauses"},
        {"name": "Konzessive Sätze", "description": "trotzdem + main clause, obwohl + subordinate clause", "category": "Clauses"},
    ],
    "B1_ch2": [
        {"name": "Nominalisierung", "description": "Verb → noun: lernen → das Lernen, fahren → die Fahrt", "category": "Word Formation"},
        {"name": "Nominal style", "description": "Formal writing uses more nouns than verbs", "category": "Style"},
    ],
    "B1_ch3": [
        {"name": "Konjunktiv I — reported speech", "description": "er/sie/es habe, sei, werde — indirect speech", "category": "Mood"},
        {"name": "Indirekte Rede", "description": "Reporting what someone else said", "category": "Mood"},
    ],
    "B1_ch4": [
        {"name": "Two-way prepositions — deep dive", "description": "Akkusativ = direction/destination, Dativ = location/position", "category": "Prepositions"},
        {"name": "Preposition practice", "description": "Context-based exercises with all 9 two-way prepositions", "category": "Prepositions"},
    ],
    "B1_ch5": [
        {"name": "Infinitive clauses — um...zu", "description": "um...zu = in order to: Ich lerne, um besser zu werden", "category": "Infinitive"},
        {"name": "Infinitive clauses — ohne...zu/statt...zu", "description": "ohne...zu = without, statt...zu = instead of", "category": "Infinitive"},
    ],
    "B1_ch6": [
        {"name": "Passive with modal verbs", "description": "Das muss gemacht werden — passive + können, müssen, sollen", "category": "Voice"},
        {"name": "Passive — past form", "description": "wurde gemacht — Präteritum passive", "category": "Voice"},
    ],
    "B1_ch7": [
        {"name": "Extended participial phrases", "description": "Das von dem Mann gebaute Haus — attributive participles", "category": "Syntax"},
        {"name": "Partizip I and II as adjectives", "description": "das schlafende Kind, das geschriebene Buch", "category": "Adjectives"},
    ],
    "B1_ch8": [
        {"name": "Plusquamperfekt", "description": "hatte gemacht / war gegangen — past before past", "category": "Past Tense"},
        {"name": "Plusquamperfekt usage", "description": "Used with Präteritum to show sequence of past events", "category": "Past Tense"},
    ],
    "B1_ch9": [
        {"name": "Compound nouns", "description": "das Wohnzimmer, die Bahnhofshalle — combining words", "category": "Word Formation"},
        {"name": "Prefixes — ver-, be-, ent-", "description": "Inseparable prefixes change verb meaning", "category": "Word Formation"},
    ],
    "B1_ch10": [
        {"name": "Conditional sentences", "description": "Wenn ich Zeit hätte, würde ich kommen — Konjunktiv II conditionals", "category": "Clauses"},
        {"name": "Unreal wishes", "description": "Wenn ich doch...! Ich wünschte, ich hätte...", "category": "Mood"},
    ],
    "B1_ch11": [
        {"name": "Indirect questions", "description": "Ich frage mich, ob... / Können Sie mir sagen, wo...?", "category": "Clauses"},
        {"name": "Question word clauses", "description": "ob, wann, wo, wie, warum — embedded questions", "category": "Clauses"},
    ],
    "B1_ch12": [
        {"name": "Konzessive Konjunktionen", "description": "zwar...aber, einerseits...andererseits", "category": "Connectors"},
        {"name": "Review B1", "description": "Consolidation of all B1 grammar points", "category": "Review"},
    ],
    "B2_ch1": [
        {"name": "Extended attributive phrases", "description": "Der gestern angekommene Brief — complex noun modifiers", "category": "Syntax"},
        {"name": "Left bracket expansion", "description": "Extended attributes between article and noun", "category": "Syntax"},
    ],
    "B2_ch2": [
        {"name": "Funktionsverbgefüge", "description": "in Frage stellen, zum Ausdruck bringen — fixed verb-noun combos", "category": "Fixed Expressions"},
        {"name": "Business German phrases", "description": "Formal expressions for professional contexts", "category": "Fixed Expressions"},
    ],
    "B2_ch3": [
        {"name": "Konjunktiv II — complex conditionals", "description": "Advanced hypothetical situations and polite distancing", "category": "Mood"},
        {"name": "Irrealis sentences", "description": "Past unreal: Wenn ich das gewusst hätte, wäre ich...", "category": "Mood"},
    ],
    "B2_ch4": [
        {"name": "Zustandspassiv", "description": "ist gemacht — state resulting from an action", "category": "Voice"},
        {"name": "Vorgangspassiv vs Zustandspassiv", "description": "wird gemacht (process) vs ist gemacht (state)", "category": "Voice"},
    ],
    "B2_ch5": [
        {"name": "Genitive prepositions — advanced", "description": "angesichts, infolge, kraft, laut, zufolge", "category": "Prepositions"},
        {"name": "wegen, trotz, während — deep dive", "description": "Usage nuances and common mistakes", "category": "Prepositions"},
    ],
    "B2_ch6": [
        {"name": "Nomen-Verb-Verbindungen", "description": "eine Entscheidung treffen, Kritik üben — formal equivalents", "category": "Fixed Expressions"},
        {"name": "Academic N-V combinations", "description": "zur Anwendung kommen, in Betracht ziehen", "category": "Fixed Expressions"},
    ],
    "B2_ch7": [
        {"name": "Adversative Konjunktionen", "description": "während, wohingegen, im Gegensatz dazu — contrast", "category": "Connectors"},
        {"name": "Contrasting structures", "description": "zwar...aber, nicht nur...sondern auch", "category": "Connectors"},
    ],
    "B2_ch8": [
        {"name": "Textverknüpfungsmittel", "description": "deshalb, dennoch, jedoch, folglich — logical connectors", "category": "Connectors"},
        {"name": "Cohesion in writing", "description": "Building coherent arguments with connectors", "category": "Writing"},
    ],
    "B2_ch9": [
        {"name": "Modalpartikeln", "description": "doch, eigentlich, mal, halt, eben, ja — flavoring words", "category": "Particles"},
        {"name": "Modalpartikeln in context", "description": "How particles change tone: Mach das! vs Mach das mal!", "category": "Particles"},
    ],
    "B2_ch10": [
        {"name": "Partizipialkonstruktionen", "description": "Using participles to replace relative clauses", "category": "Syntax"},
        {"name": "Nominalizing participles", "description": "der/die Reisende — participles as nouns", "category": "Word Formation"},
    ],
    "B2_ch11": [
        {"name": "Finalsätze — B2 level", "description": "damit, um...zu with complex clause structures", "category": "Clauses"},
        {"name": "Purpose and intention", "description": "Expressing goals at B2 precision level", "category": "Clauses"},
    ],
    "B2_ch12": [
        {"name": "Register — formal vs informal", "description": "Switching between Umgangssprache and Bildungssprache", "category": "Register"},
        {"name": "Review B2", "description": "Consolidation of all B2 grammar points", "category": "Review"},
    ],
    "C1_ch1": [
        {"name": "Stilistische Variation", "description": "Varying sentence structure for sophisticated expression", "category": "Style"},
        {"name": "Advanced Nominalisierungen", "description": "Complex noun phrases replacing entire clauses", "category": "Style"},
    ],
    "C1_ch2": [
        {"name": "Mehrteilige Konnektoren", "description": "je...desto, sowohl...als auch, nicht nur...sondern auch", "category": "Connectors"},
        {"name": "Paired conjunctions", "description": "zwar...aber, einerseits...andererseits — advanced usage", "category": "Connectors"},
    ],
    "C1_ch3": [
        {"name": "Konzessive Konstruktionen — C1", "description": "Ungeachtet, dessen ungeachtet, nichtsdestotrotz", "category": "Connectors"},
        {"name": "Advanced concessive structures", "description": "Sophisticated expression of contrast and concession", "category": "Connectors"},
    ],
    "C1_ch4": [
        {"name": "Passivumschreibungen", "description": "sein + zu + Infinitiv: Das ist zu erledigen = must be done", "category": "Voice"},
        {"name": "Alternative passive forms", "description": "sich lassen + Infinitiv, zu + Partizip I", "category": "Voice"},
    ],
    "C1_ch5": [
        {"name": "Attribute chains", "description": "Multiple stacked attributes before nouns", "category": "Syntax"},
        {"name": "Attribute reduction", "description": "Converting attribute chains into relative clauses and vice versa", "category": "Syntax"},
    ],
    "C1_ch6": [
        {"name": "Konjunktiv I — academic writing", "description": "Scientific reporting and citation conventions", "category": "Mood"},
        {"name": "Indirect speech in academic texts", "category": "Academic Writing"},
    ],
    "C1_ch7": [
        {"name": "Erweiterte Nominalgruppen", "description": "Complex noun phrases with multiple modifiers", "category": "Syntax"},
        {"name": "Nominal style in legal texts", "category": "Register"},
    ],
    "C1_ch8": [
        {"name": "Wissenschaftlicher Schreibstil", "description": "Passive, nominalization, and impersonal constructions", "category": "Academic Writing"},
        {"name": "Hedging in academic writing", "category": "Academic Writing"},
    ],
    "C1_ch9": [
        {"name": "Komplexe Satzgefüge", "description": "Multiple nested subordinate clauses", "category": "Syntax"},
        {"name": "Sentence bracket mastery", "category": "Syntax"},
    ],
    "C1_ch10": [
        {"name": "Stilistische Kompetenz", "description": "Register switching, tone adjustment, audience awareness", "category": "Style"},
        {"name": "Review C1", "description": "Consolidation of all C1 grammar points", "category": "Review"},
    ],
}

EXERCISES = {
    "Verb sein — present tense": [
        {"type": "cloze", "prompt_text": "Ich ___ Student.", "expected_answer": "bin", "difficulty": 1},
        {"type": "cloze", "prompt_text": "Er ___ aus Deutschland.", "expected_answer": "ist", "difficulty": 1},
        {"type": "cloze", "prompt_text": "Wir ___ aus Österreich.", "expected_answer": "sind", "difficulty": 1},
        {"type": "reverse_translation", "native_sentence": "You are a teacher.", "expected_answer": "Du bist Lehrer.", "difficulty": 2},
        {"type": "blurting", "prompt_text": "Introduce yourself: say your name and where you are from.", "expected_answer": "Ich bin [Name]. Ich bin aus [Stadt].", "difficulty": 2},
    ],
    "Personal pronouns": [
        {"type": "cloze", "prompt_text": "___ (I) gehe zur Schule.", "expected_answer": "Ich", "difficulty": 1},
        {"type": "cloze", "prompt_text": "___ (they, plural formal) kommen aus Berlin.", "expected_answer": "Sie", "difficulty": 1},
        {"type": "reverse_translation", "native_sentence": "She is my friend.", "expected_answer": "Sie ist meine Freundin.", "difficulty": 2},
    ],
    "Possessive articles — mein/dein": [
        {"type": "cloze", "prompt_text": "Das ist ___ (my) Buch.", "expected_answer": "mein", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Ist das ___ (your) Handy?", "expected_answer": "dein", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "Our house is big.", "expected_answer": "Unser Haus ist groß.", "difficulty": 3},
    ],
    "Verb haben — present tense": [
        {"type": "cloze", "prompt_text": "Ich ___ ein Auto.", "expected_answer": "habe", "difficulty": 1},
        {"type": "cloze", "prompt_text": "Sie ___ zwei Kinder.", "expected_answer": "hat", "difficulty": 1},
        {"type": "reverse_translation", "native_sentence": "We have a dog.", "expected_answer": "Wir haben einen Hund.", "difficulty": 2},
    ],
    "Present tense — regular verbs": [
        {"type": "cloze", "prompt_text": "Ich ___ Deutsch. (lernen)", "expected_answer": "lerne", "difficulty": 1},
        {"type": "cloze", "prompt_text": "Du ___ Fußball. (spielen)", "expected_answer": "spielst", "difficulty": 1},
        {"type": "cloze", "prompt_text": "Er ___ ein Buch. (lesen)", "expected_answer": "liest", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "She works in Berlin.", "expected_answer": "Sie arbeitet in Berlin.", "difficulty": 2},
    ],
    "Verb conjugation patterns": [
        {"type": "cloze", "prompt_text": "Du ___ Musik. (hören)", "expected_answer": "hörst", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Wir ___ nach Hause. (fahren)", "expected_answer": "fahren", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "He eats an apple.", "expected_answer": "Er isst einen Apfel.", "difficulty": 3},
    ],
    "Nominativ articles": [
        {"type": "cloze", "prompt_text": "___ Mann liest ein Buch.", "expected_answer": "Der", "difficulty": 1},
        {"type": "cloze", "prompt_text": "___ Frau singt ein Lied.", "expected_answer": "Die", "difficulty": 1},
        {"type": "cloze", "prompt_text": "___ Kind spielt im Garten.", "expected_answer": "Das", "difficulty": 1},
        {"type": "reverse_translation", "native_sentence": "The dog is sleeping.", "expected_answer": "Der Hund schläft.", "difficulty": 2},
    ],
    "Indefinite article": [
        {"type": "cloze", "prompt_text": "Das ist ___ Haus.", "expected_answer": "ein", "difficulty": 1},
        {"type": "cloze", "prompt_text": "Sie hat ___ Katze.", "expected_answer": "eine", "difficulty": 1},
        {"type": "reverse_translation", "native_sentence": "I have a brother.", "expected_answer": "Ich habe einen Bruder.", "difficulty": 2},
    ],
    "Separable verbs": [
        {"type": "cloze", "prompt_text": "Ich ___ um 7 Uhr ___. (aufstehen)", "expected_answer": "stehe ... auf", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Er ___ seine Mutter ___. (anrufen)", "expected_answer": "ruft ... an", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "I am cleaning up the room.", "expected_answer": "Ich räume das Zimmer auf.", "difficulty": 3},
    ],
    "Time expressions": [
        {"type": "cloze", "prompt_text": "Das Konzert ist ___ 20 Uhr. (at)", "expected_answer": "um", "difficulty": 1},
        {"type": "cloze", "prompt_text": "___ Montag habe ich Deutsch. (on)", "expected_answer": "Am", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "In summer I travel.", "expected_answer": "Im Sommer reise ich.", "difficulty": 2},
    ],
    "Akkusativ case": [
        {"type": "cloze", "prompt_text": "Ich sehe ___ Mann.", "expected_answer": "den", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Er kauft ___ Buch.", "expected_answer": "ein", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Sie hat ___ Hund.", "expected_answer": "einen", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "She is reading the newspaper.", "expected_answer": "Sie liest die Zeitung.", "difficulty": 2},
        {"type": "blurting", "prompt_text": "You are buying a gift for your friend. Say what you are buying in German.", "expected_answer": "Ich kaufe ein Geschenk.", "difficulty": 3},
    ],
    "haben + Akkusativ": [
        {"type": "cloze", "prompt_text": "Ich habe ___ Bruder.", "expected_answer": "einen", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Sie hat ___ Idee.", "expected_answer": "eine", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "He has a problem.", "expected_answer": "Er hat ein Problem.", "difficulty": 2},
    ],
    "Modal verbs — können": [
        {"type": "cloze", "prompt_text": "Ich ___ Deutsch sprechen. (can)", "expected_answer": "kann", "difficulty": 2},
        {"type": "cloze", "prompt_text": "___ Sie mir helfen? (can, formal)", "expected_answer": "Können", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "We can come tomorrow.", "expected_answer": "Wir können morgen kommen.", "difficulty": 3},
    ],
    "Modal verbs — mögen/wollen": [
        {"type": "cloze", "prompt_text": "Ich ___ Pizza essen. (want to)", "expected_answer": "will", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Sie ___ Schokolade. (likes)", "expected_answer": "mag", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "They want to go home.", "expected_answer": "Sie wollen nach Hause gehen.", "difficulty": 3},
    ],
    "Negation — kein": [
        {"type": "cloze", "prompt_text": "Ich habe ___ Zeit.", "expected_answer": "keine", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Er hat ___ Bruder.", "expected_answer": "keinen", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "We have no children.", "expected_answer": "Wir haben keine Kinder.", "difficulty": 2},
    ],
    "Negation — nicht": [
        {"type": "cloze", "prompt_text": "Das ist ___ gut.", "expected_answer": "nicht", "difficulty": 1},
        {"type": "cloze", "prompt_text": "Ich komme ___ heute.", "expected_answer": "nicht", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "She doesn't like coffee.", "expected_answer": "Sie mag Kaffee nicht.", "difficulty": 3},
    ],
    "Imperativ": [
        {"type": "cloze", "prompt_text": "___ die Tür! (öffnen, du form)", "expected_answer": "Öffne", "difficulty": 2},
        {"type": "cloze", "prompt_text": "___ bitte leise! (sein, Sie form)", "expected_answer": "Seien", "difficulty": 3},
        {"type": "blurting", "prompt_text": "Tell your friend to wait for you (informal).", "expected_answer": "Warte auf mich!", "difficulty": 2},
    ],
    "Body parts vocabulary": [
        {"type": "cloze", "prompt_text": "___ Kopf tut weh.", "expected_answer": "Der", "difficulty": 1},
        {"type": "cloze", "prompt_text": "Ich habe Schmerzen in ___ Hand.", "expected_answer": "der", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "My foot hurts.", "expected_answer": "Mein Fuß tut weh.", "difficulty": 2},
    ],
    "Dative prepositions — in/an/auf": [
        {"type": "cloze", "prompt_text": "Das Buch ist ___ dem Tisch.", "expected_answer": "auf", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Er wohnt ___ Berlin.", "expected_answer": "in", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "The picture is on the wall.", "expected_answer": "Das Bild ist an der Wand.", "difficulty": 3},
    ],
    "Dativ case intro": [
        {"type": "cloze", "prompt_text": "Ich gebe ___ Kind das Buch.", "expected_answer": "dem", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Er hilft ___ Frau.", "expected_answer": "der", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Ich danke ___ (you, formal).", "expected_answer": "Ihnen", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "She gives the man the key.", "expected_answer": "Sie gibt dem Mann den Schlüssel.", "difficulty": 4},
        {"type": "blurting", "prompt_text": "You are at a restaurant. Tell the waiter you are giving the menu to the woman.", "expected_answer": "Ich gebe der Frau die Speisekarte.", "difficulty": 4},
    ],
    "zu + infinitive": [
        {"type": "cloze", "prompt_text": "Ich habe Lust, Deutsch ___ lernen.", "expected_answer": "zu", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Er vergisst, das Buch ___ mitzunehmen.", "expected_answer": "zu", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "It's fun to play football.", "expected_answer": "Es macht Spaß, Fußball zu spielen.", "difficulty": 3},
    ],
    "Sentence connectors": [
        {"type": "cloze", "prompt_text": "Ich lerne Deutsch, ___ ich nach Deutschland gehen möchte.", "expected_answer": "weil", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Er ist krank, ___ er kommt nicht.", "expected_answer": "deshalb", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "I want to come, but I have no time.", "expected_answer": "Ich möchte kommen, aber ich habe keine Zeit.", "difficulty": 2},
    ],
    "Past tense — war/hatte": [
        {"type": "cloze", "prompt_text": "Ich ___ gestern krank.", "expected_answer": "war", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Er ___ keine Zeit.", "expected_answer": "hatte", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "We were at home yesterday.", "expected_answer": "Wir waren gestern zu Hause.", "difficulty": 3},
    ],
    "Review A1": [
        {"type": "cloze", "prompt_text": "Ich ___ heute Deutsch gelernt. (haben, Perfekt)", "expected_answer": "habe", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Sie ___ das Buch gelesen. (haben, Perfekt)", "expected_answer": "hat", "difficulty": 2},
        {"type": "blurting", "prompt_text": "Describe what you did yesterday using 3 sentences.", "expected_answer": "Ich bin aufgewacht. Ich habe gefrühstückt. Ich habe Deutsch gelernt.", "difficulty": 4},
    ],
    "Perfekt with haben": [
        {"type": "cloze", "prompt_text": "Ich ___ ein Buch gekauft.", "expected_answer": "habe", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Sie ___ Deutsch gelernt.", "expected_answer": "hat", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "We have played football.", "expected_answer": "Wir haben Fußball gespielt.", "difficulty": 3},
    ],
    "Perfekt — ge- prefix": [
        {"type": "cloze", "prompt_text": "Ich habe das Fenster ___ (öffnen).", "expected_answer": "geöffnet", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Er hat das Buch ___ (lesen).", "expected_answer": "gelesen", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "She has cooked dinner.", "expected_answer": "Sie hat das Abendessen gekocht.", "difficulty": 3},
    ],
    "Perfekt with sein": [
        {"type": "cloze", "prompt_text": "Ich ___ nach Berlin gefahren.", "expected_answer": "bin", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Er ___ nach Hause gegangen.", "expected_answer": "ist", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "We have flown to Munich.", "expected_answer": "Wir sind nach München geflogen.", "difficulty": 3},
    ],
    "Perfekt — irregular verbs": [
        {"type": "cloze", "prompt_text": "Ich habe ihn ___ (sehen).", "expected_answer": "gesehen", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Sie hat einen Brief ___ (schreiben).", "expected_answer": "geschrieben", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "He has brought a gift.", "expected_answer": "Er hat ein Geschenk mitgebracht.", "difficulty": 3},
    ],
    "Akkusativ pronouns": [
        {"type": "cloze", "prompt_text": "Ich kaufe das Buch. Ich kaufe ___.", "expected_answer": "es", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Kennst du den Mann? Ja, ich kenne ___.", "expected_answer": "ihn", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "I see her every day.", "expected_answer": "Ich sehe sie jeden Tag.", "difficulty": 3},
    ],
    "Pronoun word order": [
        {"type": "cloze", "prompt_text": "Ich gebe ___ dem Mann. (it, Akkusativ)", "expected_answer": "es", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Er zeigt ___ der Lehrerin. (it, Akkusativ)", "expected_answer": "es", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "I give it to him.", "expected_answer": "Ich gebe es ihm.", "difficulty": 3},
    ],
    "Dativ case full": [
        {"type": "cloze", "prompt_text": "Ich schenke ___ Frau Blumen.", "expected_answer": "der", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Das gehört ___ Kind.", "expected_answer": "dem", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "I am writing to the teacher.", "expected_answer": "Ich schreibe dem Lehrer.", "difficulty": 3},
    ],
    "Two-way prepositions": [
        {"type": "cloze", "prompt_text": "Das Bild hängt ___ der Wand. (location)", "expected_answer": "an", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Ich stelle die Vase ___ den Tisch. (direction)", "expected_answer": "auf", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "The cat is sitting on the chair.", "expected_answer": "Die Katze sitzt auf dem Stuhl.", "difficulty": 3},
    ],
    "Comparative and superlative": [
        {"type": "cloze", "prompt_text": "Berlin ist ___ als München. (big)", "expected_answer": "größer", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Das ist das ___ Buch. (good)", "expected_answer": "beste", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "German is more difficult than English.", "expected_answer": "Deutsch ist schwieriger als Englisch.", "difficulty": 3},
    ],
    "Adjective endings intro": [
        {"type": "cloze", "prompt_text": "Der ___ Mann kommt. (alt)", "expected_answer": "alte", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Die ___ Frau singt. (schön)", "expected_answer": "schöne", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "The small child plays.", "expected_answer": "Das kleine Kind spielt.", "difficulty": 3},
    ],
    "Dativ pronouns": [
        {"type": "cloze", "prompt_text": "Ich helfe ___ (him).", "expected_answer": "ihm", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Sie gibt ___ (her) das Buch.", "expected_answer": "ihr", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "I am writing to them.", "expected_answer": "Ich schreibe ihnen.", "difficulty": 3},
    ],
    "Reflexive verbs intro": [
        {"type": "cloze", "prompt_text": "Ich freue ___ auf das Wochenende.", "expected_answer": "mich", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Er interessiert ___ für Musik.", "expected_answer": "sich", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "I am washing myself.", "expected_answer": "Ich wasche mich.", "difficulty": 3},
    ],
    "Konjunktiv II — polite requests": [
        {"type": "cloze", "prompt_text": "___ Sie mir bitte helfen? (können, polite)", "expected_answer": "Könnten", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Ich ___ gerne kommen. (würden)", "expected_answer": "würde", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "I would have time.", "expected_answer": "Ich hätte Zeit.", "difficulty": 3},
    ],
    "Höfliche Fragen": [
        {"type": "cloze", "prompt_text": "___ Sie bitte das Fenster öffnen? (können, formal polite)", "expected_answer": "Könnten", "difficulty": 3},
        {"type": "blurting", "prompt_text": "Politely ask someone to open the window.", "expected_answer": "Könnten Sie bitte das Fenster öffnen?", "difficulty": 3},
    ],
    "Subordinate clause — weil": [
        {"type": "cloze", "prompt_text": "Ich lerne Deutsch, ___ ich in Berlin arbeiten möchte.", "expected_answer": "weil", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Er ist glücklich, ___ er eine neue Arbeit hat.", "expected_answer": "weil", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "I am studying because I want to travel.", "expected_answer": "Ich lerne, weil ich reisen möchte.", "difficulty": 3},
    ],
    "Subordinate clause — dass/wenn": [
        {"type": "cloze", "prompt_text": "Ich weiß, ___ er krank ist.", "expected_answer": "dass", "difficulty": 3},
        {"type": "cloze", "prompt_text": "___ es regnet, bleibe ich zu Hause.", "expected_answer": "Wenn", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "I hope that you come.", "expected_answer": "Ich hoffe, dass du kommst.", "difficulty": 3},
    ],
    "Genitive case intro": [
        {"type": "cloze", "prompt_text": "Das Auto ___ Mannes ist neu.", "expected_answer": "des", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Die Tasche ___ Frau ist rot.", "expected_answer": "der", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "The title of the book is interesting.", "expected_answer": "Der Titel des Buches ist interessant.", "difficulty": 4},
    ],
    "Genitive prepositions": [
        {"type": "cloze", "prompt_text": "___ des Regens bleiben wir zu Hause.", "expected_answer": "Wegen", "difficulty": 4},
        {"type": "cloze", "prompt_text": "___ der Arbeit habe ich keine Zeit.", "expected_answer": "Wegen", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "Despite the cold, he went outside.", "expected_answer": "Trotz der Kälte ging er nach draußen.", "difficulty": 4},
    ],
    "Passive voice intro": [
        {"type": "cloze", "prompt_text": "Das Buch ___ gelesen.", "expected_answer": "wird", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Die Tür ___ geöffnet.", "expected_answer": "wird", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "The letter is being written.", "expected_answer": "Der Brief wird geschrieben.", "difficulty": 3},
    ],
    "Passive — agent": [
        {"type": "cloze", "prompt_text": "Das Buch wird ___ dem Schüler gelesen.", "expected_answer": "von", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Das Haus wird ___ dem Architekten gebaut.", "expected_answer": "von", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "The cake is baked by the grandmother.", "expected_answer": "Der Kuchen wird von der Großmutter gebacken.", "difficulty": 4},
    ],
    "Relative clauses": [
        {"type": "cloze", "prompt_text": "Der Mann, ___ hier wohnt, ist nett.", "expected_answer": "der", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Das Buch, ___ ich lese, ist spannend.", "expected_answer": "das", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "The woman who is singing is my sister.", "expected_answer": "Die Frau, die singt, ist meine Schwester.", "difficulty": 4},
    ],
    "Relative pronoun cases": [
        {"type": "cloze", "prompt_text": "Der Mann, ___ ich kenne, ist Lehrer.", "expected_answer": "den", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Die Frau, ___ das Buch schreibt, ist berühmt.", "expected_answer": "die", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "The child that plays is happy.", "expected_answer": "Das Kind, das spielt, ist glücklich.", "difficulty": 3},
    ],
    "Future tense — werden": [
        {"type": "cloze", "prompt_text": "Ich ___ morgen nach Berlin fahren.", "expected_answer": "werde", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Wir ___ Deutsch lernen.", "expected_answer": "werden", "difficulty": 2},
        {"type": "reverse_translation", "native_sentence": "She will become a doctor.", "expected_answer": "Sie wird Ärztin werden.", "difficulty": 3},
    ],
    "Review A2": [
        {"type": "cloze", "prompt_text": "Er hat mir gesagt, dass er ___ (kommen, future).", "expected_answer": "kommen wird", "difficulty": 4},
        {"type": "blurting", "prompt_text": "Tell a story about something that happened last weekend using Perfekt.", "expected_answer": "Letztes Wochenende bin ich nach München gefahren. Ich habe meine Freunde besucht.", "difficulty": 4},
    ],
    "Subordinate clause — obwohl": [
        {"type": "cloze", "prompt_text": "___ es regnet, gehe ich spazieren.", "expected_answer": "Obwohl", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Er kommt zur Arbeit, ___ er krank ist.", "expected_answer": "obwohl", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "Although I'm tired, I study German.", "expected_answer": "Obwohl ich müde bin, lerne ich Deutsch.", "difficulty": 4},
    ],
    "Konzessive Sätze": [
        {"type": "cloze", "prompt_text": "Es regnet. ___ gehe ich spazieren.", "expected_answer": "Trotzdem", "difficulty": 4},
        {"type": "blurting", "prompt_text": "Express contrast: You're tired but still going to study.", "expected_answer": "Obwohl ich müde bin, lerne ich trotzdem.", "difficulty": 4},
    ],
    "Nominalisierung": [
        {"type": "cloze", "prompt_text": "Das ___ ist wichtig. (lernen)", "expected_answer": "Lernen", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Die ___ nach Berlin war lang. (Fahrt)", "expected_answer": "Reise", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "Reading is fun.", "expected_answer": "Lesen macht Spaß.", "difficulty": 3},
    ],
    "Nominal style": [
        {"type": "cloze", "prompt_text": "Statt ___ (dass er kommt) kommt er nicht.", "expected_answer": "dass er kommt", "difficulty": 4},
        {"type": "blurting", "prompt_text": "Rewrite in nominal style: 'Weil es regnet, bleiben wir zu Hause.'", "expected_answer": "Wegen des Regens bleiben wir zu Hause.", "difficulty": 5},
    ],
    "Konjunktiv I — reported speech": [
        {"type": "cloze", "prompt_text": "Er sagte, er ___ krank. (sein, Konj I)", "expected_answer": "sei", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Sie behauptete, sie ___ keine Zeit. (haben, Konj I)", "expected_answer": "habe", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "He said that he was coming.", "expected_answer": "Er sagte, er komme.", "difficulty": 5},
    ],
    "Indirekte Rede": [
        {"type": "cloze", "prompt_text": "Der Lehrer meinte, die Prüfung ___ schwer. (sein)", "expected_answer": "sei", "difficulty": 4},
        {"type": "blurting", "prompt_text": "Report: 'Ich bin krank' — in indirect speech (he said).", "expected_answer": "Er sagte, er sei krank.", "difficulty": 5},
    ],
    "Two-way prepositions — deep dive": [
        {"type": "cloze", "prompt_text": "Ich stelle das Buch ___ den Tisch. (direction)", "expected_answer": "auf", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Das Buch liegt ___ dem Tisch. (location)", "expected_answer": "auf", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "He puts the picture on the wall.", "expected_answer": "Er stellt das Bild an die Wand.", "difficulty": 4},
    ],
    "Preposition practice": [
        {"type": "cloze", "prompt_text": "Die Katze sitzt ___ dem Stuhl.", "expected_answer": "auf", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Ich hänge das Bild ___ die Wand.", "expected_answer": "an", "difficulty": 4},
        {"type": "blurting", "prompt_text": "Describe where things are in your room using 3 two-way prepositions.", "expected_answer": "Das Buch liegt auf dem Tisch. Der Stuhl steht neben dem Bett.", "difficulty": 4},
    ],
    "Infinitive clauses — um...zu": [
        {"type": "cloze", "prompt_text": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten kann.", "expected_answer": "um", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Er trainiert, ___ er stärker wird.", "expected_answer": "um", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "I save money in order to travel.", "expected_answer": "Ich spare Geld, um zu reisen.", "difficulty": 4},
    ],
    "Infinitive clauses — ohne...zu/statt...zu": [
        {"type": "cloze", "prompt_text": "Er ging, ___ etwas zu sagen.", "expected_answer": "ohne", "difficulty": 4},
        {"type": "cloze", "prompt_text": "___ zu lernen, spielte er Videospiele.", "expected_answer": "Statt", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "He left without saying goodbye.", "expected_answer": "Er ging, ohne sich zu verabschieden.", "difficulty": 5},
    ],
    "Passive with modal verbs": [
        {"type": "cloze", "prompt_text": "Die Aufgabe muss ___ werden. (machen)", "expected_answer": "gemacht", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Das kann nicht ___ werden. (vergessen)", "expected_answer": "vergessen", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "The letter must be sent.", "expected_answer": "Der Brief muss geschickt werden.", "difficulty": 5},
    ],
    "Passive — past form": [
        {"type": "cloze", "prompt_text": "Das Haus ___ gebaut. (Präteritum passive)", "expected_answer": "wurde", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Die Bücher ___ gelesen.", "expected_answer": "wurden", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "The cake was baked yesterday.", "expected_answer": "Der Kuchen wurde gestern gebacken.", "difficulty": 5},
    ],
    "Extended participial phrases": [
        {"type": "cloze", "prompt_text": "Das ___ Buch ist spannend. (schreiben)", "expected_answer": "geschriebene", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Der ___ Mann ist mein Vater. (arbeiten)", "expected_answer": "arbeitende", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "The house built by the architect is beautiful.", "expected_answer": "Das von dem Architekten gebaute Haus ist schön.", "difficulty": 5},
    ],
    "Partizip I and II as adjectives": [
        {"type": "cloze", "prompt_text": "Das ___ Kind schläft. (schlafen, Part I)", "expected_answer": "schlafende", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Die ___ Tür ist geschlossen. (öffnen, Part II)", "expected_answer": "geöffnete", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "The running dog is fast.", "expected_answer": "Der laufende Hund ist schnell.", "difficulty": 4},
    ],
    "Plusquamperfekt": [
        {"type": "cloze", "prompt_text": "Bevor er kam, ___ ich schon gegessen. (haben)", "expected_answer": "hatte", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Nachdem sie ___ war, aß sie. (ankommen)", "expected_answer": "angekommen", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "After he had finished, he left.", "expected_answer": "Nachdem er fertig gewesen war, ging er.", "difficulty": 5},
    ],
    "Plusquamperfekt usage": [
        {"type": "cloze", "prompt_text": "Er ___ das Buch gelesen, bevor er den Film sah.", "expected_answer": "hatte", "difficulty": 4},
        {"type": "blurting", "prompt_text": "Describe: First you studied, then you passed the test. Use Plusquamperfekt.", "expected_answer": "Nachdem ich gelernt hatte, bestand ich die Prüfung.", "difficulty": 5},
    ],
    "Compound nouns": [
        {"type": "cloze", "prompt_text": "Das ___ ist gemütlich. (Wohn + Zimmer)", "expected_answer": "Wohnzimmer", "difficulty": 2},
        {"type": "cloze", "prompt_text": "Die ___ ist groß. (Bahnhof + Halle)", "expected_answer": "Bahnhofshalle", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "The toothbrush is on the table.", "expected_answer": "Die Zahnbürste ist auf dem Tisch.", "difficulty": 3},
    ],
    "Prefixes — ver-, be-, ent-": [
        {"type": "cloze", "prompt_text": "Ich ___stehe nicht. (stehen → understand)", "expected_answer": "ver", "difficulty": 3},
        {"type": "cloze", "prompt_text": "Er ___kommt das Buch. (kommen → receive)", "expected_answer": "be", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "She is leaving the station.", "expected_answer": "Sie verlässt den Bahnhof.", "difficulty": 4},
    ],
    "Conditional sentences": [
        {"type": "cloze", "prompt_text": "Wenn ich Zeit ___, würde ich kommen.", "expected_answer": "hätte", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Wenn er reich ___, würde er reisen.", "expected_answer": "wäre", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "If I had money, I would buy a car.", "expected_answer": "Wenn ich Geld hätte, würde ich ein Auto kaufen.", "difficulty": 5},
    ],
    "Unreal wishes": [
        {"type": "cloze", "prompt_text": "___ ich doch reich wäre!", "expected_answer": "Wenn", "difficulty": 4},
        {"type": "blurting", "prompt_text": "Express an unreal wish about having more time.", "expected_answer": "Wenn ich doch mehr Zeit hätte!", "difficulty": 4},
    ],
    "Indirect questions": [
        {"type": "cloze", "prompt_text": "Ich frage mich, ___ er kommt.", "expected_answer": "ob", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Können Sie mir sagen, ___ der Bahnhof ist?", "expected_answer": "wo", "difficulty": 3},
        {"type": "reverse_translation", "native_sentence": "I wonder when he will arrive.", "expected_answer": "Ich frage mich, wann er ankommt.", "difficulty": 4},
    ],
    "Question word clauses": [
        {"type": "cloze", "prompt_text": "Er weiß nicht, ___ er das machen soll.", "expected_answer": "wie", "difficulty": 4},
        {"type": "cloze", "prompt_text": "Ich verstehe nicht, ___ er das sagt.", "expected_answer": "warum", "difficulty": 4},
        {"type": "reverse_translation", "native_sentence": "Tell me where you live.", "expected_answer": "Sag mir, wo du wohnst.", "difficulty": 4},
    ],
    "Konzessive Konjunktionen": [
        {"type": "cloze", "prompt_text": "Er ist ___ dumm ___ faul.", "expected_answer": "zwar ... aber", "difficulty": 5},
        {"type": "cloze", "prompt_text": "___ ist das Buch interessant, ___ ist es teuer.", "expected_answer": "Einerseits ... andererseits", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Use 'zwar...aber' to describe something with a positive and negative side.", "expected_answer": "Das Buch ist zwar interessant, aber teuer.", "difficulty": 5},
    ],
    "Review B1": [
        {"type": "cloze", "prompt_text": "Obwohl er krank ___, ging er zur Arbeit. (Konj II)", "expected_answer": "wäre", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Write a complex sentence using obwohl and Konjunktiv II.", "expected_answer": "Obwohl ich mehr Zeit hätte, würde ich nicht fernsehen.", "difficulty": 5},
    ],
    "Extended attributive phrases": [
        {"type": "cloze", "prompt_text": "Der gestern ___ Brief ist wichtig. (ankommen)", "expected_answer": "angekommene", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Das von ihm ___ Buch ist Bestseller.", "expected_answer": "geschriebene", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "The recently built house is modern.", "expected_answer": "Das kürzlich gebaute Haus ist modern.", "difficulty": 5},
    ],
    "Left bracket expansion": [
        {"type": "cloze", "prompt_text": "Der ___ Mann ist mein Nachbar. (in Berlin wohnend)", "expected_answer": "in Berlin wohnende", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "The book lying on the table is mine.", "expected_answer": "Das auf dem Tisch liegende Buch ist meins.", "difficulty": 5},
    ],
    "Funktionsverbgefüge": [
        {"type": "cloze", "prompt_text": "Seine Meinung ist nicht relevant. Das ist nicht ___ Frage.", "expected_answer": "von Bedeutung / in", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Er ___ seine Dankbarkeit zum Ausdruck.", "expected_answer": "brachte", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "We need to make a decision.", "expected_answer": "Wir müssen eine Entscheidung treffen.", "difficulty": 5},
    ],
    "Business German phrases": [
        {"type": "cloze", "prompt_text": "Ich möchte mich ___ Ihnen bedanken.", "expected_answer": "bei", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Formally request information in a business email.", "expected_answer": "Ich bitte Sie höflich um weitere Informationen.", "difficulty": 5},
    ],
    "Konjunktiv II — complex conditionals": [
        {"type": "cloze", "prompt_text": "Wenn ich das ___ hätte, wäre ich gekommen.", "expected_answer": "gewusst", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Hätte er mehr Zeit, ___ er mehr lesen.", "expected_answer": "würde", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "If I had known, I would have helped.", "expected_answer": "Wenn ich das gewusst hätte, hätte ich geholfen.", "difficulty": 5},
    ],
    "Irrealis sentences": [
        {"type": "cloze", "prompt_text": "Wenn ich das gewusst ___, wäre ich geblieben.", "expected_answer": "hätte", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Express a past regret: If only I had studied more!", "expected_answer": "Wenn ich doch mehr gelernt hätte!", "difficulty": 5},
    ],
    "Zustandspassiv": [
        {"type": "cloze", "prompt_text": "Die Tür ist ___. (schließen)", "expected_answer": "geschlossen", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Das Haus ist ___ worden. (bauen)", "expected_answer": "gebaut", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "The letter is written. (state)", "expected_answer": "Der Brief ist geschrieben.", "difficulty": 5},
    ],
    "Vorgangspassiv vs Zustandspassiv": [
        {"type": "cloze", "prompt_text": "Die Tür wird ___. (öffnen, Vorgang)", "expected_answer": "geöffnet", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Die Tür ist ___. (öffnen, Zustand)", "expected_answer": "geöffnet", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Describe a door being opened (process) and then being open (state).", "expected_answer": "Die Tür wird geöffnet. Die Tür ist geöffnet.", "difficulty": 5},
    ],
    "Genitive prepositions — advanced": [
        {"type": "cloze", "prompt_text": "___ der Lage können wir nichts ändern.", "expected_answer": "Angesichts", "difficulty": 5},
        {"type": "cloze", "prompt_text": "___ des Staus kam ich zu spät.", "expected_answer": "Infolge", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "During the meeting, he left.", "expected_answer": "Während des Meetings ging er.", "difficulty": 5},
    ],
    "wegen, trotz, während — deep dive": [
        {"type": "cloze", "prompt_text": "___ des schlechten Wetters blieben wir zu Hause.", "expected_answer": "Wegen", "difficulty": 5},
        {"type": "cloze", "prompt_text": "___ der Prüfung lernte er jeden Tag.", "expected_answer": "Während", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Use 'trotz' to describe doing something despite a difficulty.", "expected_answer": "Trotz der Schwierigkeiten gab er nicht auf.", "difficulty": 5},
    ],
    "Nomen-Verb-Verbindungen": [
        {"type": "cloze", "prompt_text": "Wir müssen eine Entscheidung ___.", "expected_answer": "treffen", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Er ___ Kritik an dem Plan.", "expected_answer": "übte", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "The plan came into question.", "expected_answer": "Der Plan wurde in Frage gestellt.", "difficulty": 5},
    ],
    "Academic N-V combinations": [
        {"type": "cloze", "prompt_text": "Die Theorie ___ zur Anwendung.", "expected_answer": "kommt", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Diese Option wird in Betracht ___.", "expected_answer": "gezogen", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "Consideration was given to the proposal.", "expected_answer": "Dem Vorschlag wurde Beachtung geschenkt.", "difficulty": 5},
    ],
    "Adversative Konjunktionen": [
        {"type": "cloze", "prompt_text": "Er mag Deutsch, ___ er mag Englisch nicht.", "expected_answer": "während", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Das eine ist teuer, ___ das andere ist günstig.", "expected_answer": "wohingegen", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "In contrast to his brother, he is quiet.", "expected_answer": "Im Gegensatz zu seinem Bruder ist er ruhig.", "difficulty": 5},
    ],
    "Contrasting structures": [
        {"type": "cloze", "prompt_text": "Er ist ___ intelligent ___ faul.", "expected_answer": "zwar ... aber", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Use 'nicht nur...sondern auch' to describe something with two positive aspects.", "expected_answer": "Er spricht nicht nur Deutsch, sondern auch Englisch.", "difficulty": 5},
    ],
    "Textverknüpfungsmittel": [
        {"type": "cloze", "prompt_text": "Es regnete. ___ gingen wir spazieren.", "expected_answer": "Dennoch", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Er war krank. ___ kam er zur Arbeit.", "expected_answer": "Trotzdem", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Use 'dennoch' in a sentence showing contrast.", "expected_answer": "Die Prüfung war schwer. Dennoch hat er bestanden.", "difficulty": 5},
    ],
    "Cohesion in writing": [
        {"type": "cloze", "prompt_text": "Es war kalt. ___ zog er einen Mantel an.", "expected_answer": "Deshalb", "difficulty": 4},
        {"type": "blurting", "prompt_text": "Connect these ideas: 'He studied hard. He passed the exam.' Use a connector.", "expected_answer": "Er lernte hart. Deshalb bestand er die Prüfung.", "difficulty": 4},
    ],
    "Modalpartikeln": [
        {"type": "cloze", "prompt_text": "Das ist ___ eine gute Idee! (emphasizing obviousness)", "expected_answer": "ja", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Komm ___ vorbei! (casual suggestion)", "expected_answer": "doch", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Make a casual request using 'mal'.", "expected_answer": "Komm mal her!", "difficulty": 5},
    ],
    "Modalpartikeln in context": [
        {"type": "cloze", "prompt_text": "Das weiß ich ___. (obviously)", "expected_answer": "doch", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Das ist ___ interessant. (surprise)", "expected_answer": "ja", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Use 'eigentlich' to ask what someone actually does for work.", "expected_answer": "Was machst du eigentlich beruflich?", "difficulty": 5},
    ],
    "Partizipialkonstruktionen": [
        {"type": "cloze", "prompt_text": "Der ___ Student lernt viel. (reisen, as noun)", "expected_answer": "Reisende", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "The woman sitting there is my teacher.", "expected_answer": "Die dort sitzende Frau ist meine Lehrerin.", "difficulty": 5},
    ],
    "Nominalizing participles": [
        {"type": "cloze", "prompt_text": "Die ___ freuen sich auf die Reise. (fahren, noun form)", "expected_answer": "Fahrenden", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "The employees are waiting.", "expected_answer": "Die Angestellten warten.", "difficulty": 5},
    ],
    "Finalsätze — B2 level": [
        {"type": "cloze", "prompt_text": "Er lernt hart, ___ er die Prüfung besteht.", "expected_answer": "damit", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Er spart Geld, ___ ein Auto ___ kaufen.", "expected_answer": "um ... zu", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "He studies so that he can succeed.", "expected_answer": "Er lernt, damit er Erfolg haben kann.", "difficulty": 5},
    ],
    "Purpose and intention": [
        {"type": "blurting", "prompt_text": "Express your purpose for learning German at B2 level.", "expected_answer": "Ich lerne Deutsch, um in Deutschland zu studieren.", "difficulty": 5},
    ],
    "Register — formal vs informal": [
        {"type": "cloze", "prompt_text": "Informal: Ich ___ dich, das zu machen. (bitten → formal)", "expected_answer": "bitte", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Rewrite formally: 'Hey, kannst du mir helfen?'", "expected_answer": "Sehr geehrte Damen und Herren, könnten Sie mir bitte helfen?", "difficulty": 5},
    ],
    "Review B2": [
        {"type": "cloze", "prompt_text": "Obwohl es ___ (schwer), hat er ___ (bestehen).", "expected_answer": "schwer war ... bestanden", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Write a complex sentence using a Funktionsverbgefüge and Konjunktiv II.", "expected_answer": "Er würde eine Entscheidung treffen, wenn er mehr Zeit hätte.", "difficulty": 5},
    ],
    "Stilistische Variation": [
        {"type": "cloze", "prompt_text": "Rewrite: 'Weil es regnet' as a nominal phrase: ___ des Regens", "expected_answer": "Wegen", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Express 'He came late because he missed the train' in two different styles.", "expected_answer": "Er kam zu spät, weil er den Zug verpasst hatte. Wegen des verpassten Zuges kam er zu spät.", "difficulty": 5},
    ],
    "Advanced Nominalisierungen": [
        {"type": "cloze", "prompt_text": "Die ___ der Daten ist wichtig. (analysieren → noun)", "expected_answer": "Analyse", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Convert to nominal style: 'Weil die Technologie sich entwickelt, ändern sich die Arbeitsplätze.'", "expected_answer": "Aufgrund der technologischen Entwicklung ändern sich die Arbeitsplätze.", "difficulty": 5},
    ],
    "Mehrteilige Konnektoren": [
        {"type": "cloze", "prompt_text": "___ mehr er lernt, ___ besser wird er.", "expected_answer": "Je ... desto", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Er spricht ___ Deutsch ___ Englisch.", "expected_answer": "sowohl ... als auch", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Use 'je...desto' to describe a relationship between effort and success.", "expected_answer": "Je mehr man übt, desto besser wird man.", "difficulty": 5},
    ],
    "Paired conjunctions": [
        {"type": "cloze", "prompt_text": "Das Buch ist ___ interessant ___ teuer.", "expected_answer": "zwar ... aber", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Use 'einerseits...andererseits' to discuss the pros and cons of living abroad.", "expected_answer": "Einerseits ist es spannend, im Ausland zu leben, andererseits ist es schwierig.", "difficulty": 5},
    ],
    "Konzessive Konstruktionen — C1": [
        {"type": "cloze", "prompt_text": "___ der Schwierigkeiten gab er nicht auf.", "expected_answer": "Ungeachtet", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Es war kalt. ___, gingen sie spazieren.", "expected_answer": "Nichtsdestotrotz", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Use 'des ungeachtet' in a formal sentence.", "expected_answer": "Die Prüfung war schwer. Dessen ungeachtet bestand er.", "difficulty": 5},
    ],
    "Advanced concessive structures": [
        {"type": "blurting", "prompt_text": "Express concession at C1 level: Despite all efforts, the project failed.", "expected_answer": "Ungeachtet aller Bemühungen scheiterte das Projekt.", "difficulty": 5},
    ],
    "Passivumschreibungen": [
        {"type": "cloze", "prompt_text": "Das Problem ist ___ lösen. (sein + zu)", "expected_answer": "zu", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Die Aufgabe lässt sich leicht ___. (lösen)", "expected_answer": "lösen", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "This question is to be answered immediately.", "expected_answer": "Diese Frage ist sofort zu beantworten.", "difficulty": 5},
    ],
    "Alternative passive forms": [
        {"type": "cloze", "prompt_text": "Das Buch lässt sich leicht ___. (lesen)", "expected_answer": "lesen", "difficulty": 5},
        {"type": "cloze", "prompt_text": "Der Text ist nicht ___ verstehen. (zu)", "expected_answer": "zu", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "The problem can be solved.", "expected_answer": "Das Problem lässt sich lösen.", "difficulty": 5},
    ],
    "Attribute chains": [
        {"type": "cloze", "prompt_text": "Der ___ Mann ist mein Onkel. (in Berlin wohnend + alt)", "expected_answer": "in Berlin wohnende alte", "difficulty": 5},
        {"type": "reverse_translation", "native_sentence": "The recently published, widely discussed book.", "expected_answer": "Das kürzlich veröffentlichte, viel diskutierte Buch.", "difficulty": 5},
    ],
    "Attribute reduction": [
        {"type": "cloze", "prompt_text": "Convert to relative clause: 'Der auf dem Tisch liegende Brief' → Der Brief, ___", "expected_answer": "der auf dem Tisch liegt", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Reduce this relative clause to an attribute: 'Das Buch, das gestern veröffentlicht wurde'", "expected_answer": "Das gestern veröffentlichte Buch", "difficulty": 5},
    ],
    "Konjunktiv I — academic writing": [
        {"type": "cloze", "prompt_text": "Der Autor behauptet, die Studie ___ (zeigen, Konj I) wichtige Ergebnisse.", "expected_answer": "zeige", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Report in academic style: 'Researchers found that the method works.'", "expected_answer": "Die Forscher fanden, dass die Methode funktioniere.", "difficulty": 5},
    ],
    "Indirect speech in academic texts": [
        {"type": "cloze", "prompt_text": "Laut dem Bericht ___ die Zahlen gestiegen. (sein, Konj I)", "expected_answer": "seien", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Cite a researcher's claim using Konjunktiv I.", "expected_answer": "Die Forscherin betonte, die Ergebnisse seien signifikant.", "difficulty": 5},
    ],
    "Erweiterte Nominalgruppen": [
        {"type": "cloze", "prompt_text": "Das ___ Gesetz wurde geändert. (letztes Jahr verabschiedet)", "expected_answer": "letztes Jahr verabschiedete", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Create an extended nominal group: 'the contract signed yesterday by the director'", "expected_answer": "der gestern vom Direktor unterzeichnete Vertrag", "difficulty": 5},
    ],
    "Nominal style in legal texts": [
        {"type": "blurting", "prompt_text": "Write a formal sentence using legal nominal style.", "expected_answer": "Infolge der Vertragsunterzeichnung durch beide Parteien...", "difficulty": 5},
    ],
    "Wissenschaftlicher Schreibstil": [
        {"type": "cloze", "prompt_text": "Es ___ davon ausgegangen, dass... (passive formal)", "expected_answer": "wird", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Write a sentence in scientific passive style about a study's results.", "expected_answer": "In der Studie wurde festgestellt, dass die Ergebnisse signifikant sind.", "difficulty": 5},
    ],
    "Hedging in academic writing": [
        {"type": "cloze", "prompt_text": "Die Ergebnisse ___ auf einen Zusammenhang ___ (suggest, hedged)", "expected_answer": "deuten ... hin", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Hedge this claim: 'The method is the best.'", "expected_answer": "Die Methode könnte möglicherweise die effektivste sein.", "difficulty": 5},
    ],
    "Komplexe Satzgefüge": [
        {"type": "cloze", "prompt_text": "___ er wusste, ___ die Prüfung schwer sein würde, lernte er hart.", "expected_answer": "Obwohl ... dass", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Write a sentence with two nested subordinate clauses.", "expected_answer": "Er sagte, dass er, obwohl er krank sei, zur Arbeit komme.", "difficulty": 5},
    ],
    "Sentence bracket mastery": [
        {"type": "cloze", "prompt_text": "Er hat das Buch, ___ er gestern gekauft hat, schon ___. (lesen, Perfekt)", "expected_answer": "das ... gelesen", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Write a sentence with a relative clause inside the sentence bracket.", "expected_answer": "Der Mann, den ich gestern gesehen habe, hat mir geholfen.", "difficulty": 5},
    ],
    "Stilistische Kompetenz": [
        {"type": "blurting", "prompt_text": "Rewrite this informally: 'Es sei darauf hingewiesen, dass die Frist abgelaufen ist.'", "expected_answer": "Die Frist ist übrigens abgelaufen.", "difficulty": 5},
        {"type": "blurting", "prompt_text": "Rewrite this formally: 'Du musst das schnell machen.'", "expected_answer": "Dies ist unverzüglich zu erledigen.", "difficulty": 5},
    ],
    "Review C1": [
        {"type": "blurting", "prompt_text": "Write a C1-level paragraph using at least 3 complex structures (nominalization, passive, Konjunktiv).", "expected_answer": "Aufgrund der zunehmenden Globalisierung sei darauf hinzuweisen, dass interkulturelle Kompetenz von großer Bedeutung sei. Es werde erwartet, dass...", "difficulty": 5},
    ],
}


def seed_grammar(db: Session):
    if db.query(GrammarBook).count() > 0:
        return

    book_map = {}
    for b in BOOKS:
        book = GrammarBook(**b)
        db.add(book)
        db.flush()
        book_map[b["level"]] = book.id

    chapter_map = {}
    for level, chapters in CHAPTERS.items():
        for ch in chapters:
            chapter = GrammarChapter(book_id=book_map[level], **ch)
            db.add(chapter)
            db.flush()
            chapter_map[f"{level}_ch{ch['number']}"] = chapter.id

    rule_map = {}
    for key, rules in RULES.items():
        ch_id = chapter_map[key]
        for i, r in enumerate(rules, 1):
            rule = GrammarRule(chapter_id=ch_id, sort_order=i, **r)
            db.add(rule)
            db.flush()
            rule_map[r["name"]] = rule.id

    for rule_name, exercises in EXERCISES.items():
        if rule_name not in rule_map:
            continue
        for ex in exercises:
            exercise = GrammarExercise(rule_id=rule_map[rule_name], **ex)
            db.add(exercise)

    db.commit()
    print(f" Grammar seeded: {len(BOOKS)} books, {len(CHAPTERS)} levels, {len(RULES)} rule groups, {sum(len(v) for v in EXERCISES.values())} exercise sets")
