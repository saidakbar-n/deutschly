from sqlalchemy.orm import Session
from app.models.grammar_rule import GrammarRule
from app.models.grammar_exercise import GrammarExercise

RULES = [
    {"name": "Nominativ Case", "description": "Subject of the sentence", "level": "A1", "category": "Cases"},
    {"name": "Akkusativ Case", "description": "Direct object of the sentence", "level": "A1", "category": "Cases"},
    {"name": "Dativ Case", "description": "Indirect object of the sentence", "level": "A2", "category": "Cases"},
]

EXERCISES = [
    {"rule_name": "Nominativ Case", "type": "cloze", "prompt_text": "_ Mann liest ein Buch.", "expected_answer": "Der", "difficulty": 1},
    {"rule_name": "Nominativ Case", "type": "cloze", "prompt_text": "_ Frau singt ein Lied.", "expected_answer": "Die", "difficulty": 1},
    {"rule_name": "Nominativ Case", "type": "reverse_translation", "native_sentence": "The dog is sleeping.", "expected_answer": "Der Hund schläft.", "difficulty": 2},
    {"rule_name": "Akkusativ Case", "type": "cloze", "prompt_text": "Ich sehe _ Mann.", "expected_answer": "den", "difficulty": 2},
    {"rule_name": "Akkusativ Case", "type": "cloze", "prompt_text": "Er kauft _ Buch.", "expected_answer": "ein", "difficulty": 2},
    {"rule_name": "Akkusativ Case", "type": "reverse_translation", "native_sentence": "She is reading the newspaper.", "expected_answer": "Sie liest die Zeitung.", "difficulty": 2},
    {"rule_name": "Akkusativ Case", "type": "blurting", "prompt_text": "You are buying a gift for your friend. Say what you are buying in German.", "expected_answer": "Ich kaufe ein Geschenk.", "difficulty": 3},
    {"rule_name": "Dativ Case", "type": "cloze", "prompt_text": "Ich gebe _ Kind das Buch.", "expected_answer": "dem", "infinitive_verb": "geben", "difficulty": 3},
    {"rule_name": "Dativ Case", "type": "cloze", "prompt_text": "Er hilft _ Frau.", "expected_answer": "der", "infinitive_verb": "helfen", "difficulty": 3},
    {"rule_name": "Dativ Case", "type": "reverse_translation", "native_sentence": "She gives the man the key.", "expected_answer": "Sie gibt dem Mann den Schlüssel.", "difficulty": 4},
    {"rule_name": "Dativ Case", "type": "blurting", "prompt_text": "You are at a restaurant. Tell the waiter you are giving the menu to the woman.", "expected_answer": "Ich gebe der Frau die Speisekarte.", "difficulty": 4},
]

def seed_grammar(db: Session):
    if db.query(GrammarRule).count() > 0:
        return

    rule_map = {}
    for r in RULES:
        rule = GrammarRule(**r)
        db.add(rule)
        db.flush()
        rule_map[r["name"]] = rule.id

    for e in EXERCISES:
        rule_name = e.pop("rule_name")
        exercise = GrammarExercise(rule_id=rule_map[rule_name], **e)
        db.add(exercise)

    db.commit()
    print("✅ Grammar rules and exercises seeded")
