import requests
import json
import time
from typing import Optional

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"

FALLBACK_EXERCISES = {
    "Nominativ Case": {
        "cloze": {"prompt_text": "_ Hund bellt laut.", "expected_answer": "Der", "native_sentence": "", "infinitive_verb": ""},
        "blurting": {"prompt_text": "Describe who is running in German.", "expected_answer": "Der Mann läuft schnell.", "native_sentence": "", "infinitive_verb": ""},
        "reverse_translation": {"prompt_text": "", "expected_answer": "Die Katze schläft.", "native_sentence": "The cat is sleeping.", "infinitive_verb": ""},
    },
    "Akkusativ Case": {
        "cloze": {"prompt_text": "Ich kaufe _ Apfel.", "expected_answer": "einen", "native_sentence": "", "infinitive_verb": "kaufen"},
        "blurting": {"prompt_text": "You are buying something at a store. Say what you buy.", "expected_answer": "Ich kaufe den Apfel.", "native_sentence": "", "infinitive_verb": ""},
        "reverse_translation": {"prompt_text": "", "expected_answer": "Er trinkt den Kaffee.", "native_sentence": "He drinks the coffee.", "infinitive_verb": ""},
    },
    "Dativ Case": {
        "cloze": {"prompt_text": "Ich helfe _ alten Mann.", "expected_answer": "dem", "native_sentence": "", "infinitive_verb": "helfen"},
        "blurting": {"prompt_text": "You're giving something to your mother. Describe it in German.", "expected_answer": "Ich gebe meiner Mutter eine Blume.", "native_sentence": "", "infinitive_verb": ""},
        "reverse_translation": {"prompt_text": "", "expected_answer": "Er gibt der Frau den Schlüssel.", "native_sentence": "He gives the woman the key.", "infinitive_verb": ""},
    },
}

def _call_ollama(prompt: str) -> str:
    """Call local Ollama instance with performance monitoring"""
    start_time = time.time()
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": prompt, "stream": False},
            timeout=30
        )
        response.raise_for_status()
        elapsed = time.time() - start_time
        print(f"Ollama response time: {elapsed:.2f}s")
        return response.json().get("response", "")
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"Ollama call failed after {elapsed:.2f}s: {e}")
        return ""

def generate_exercise_content(rule_name: str, exercise_type: str, level: str = "A1") -> dict:
    prompt = f"""Generate a German grammar exercise for the rule: {rule_name}
Exercise type: {exercise_type}
User level: {level}

Return ONLY a JSON object with:
- "prompt_text": The exercise prompt (scenario for blurting, sentence with blank for cloze, or native sentence for reverse translation)
- "expected_answer": The correct German sentence/word
- "native_sentence": English translation (for reverse translation type)
- "infinitive_verb": The infinitive form of the verb (for cloze exercises)

Focus on German cases (Nominativ, Akkusativ, Dativ). Example for cloze: prompt_text="Ich gebe _ Kind das Buch.", expected_answer="dem"
"""

    response = _call_ollama(prompt)
    try:
        data = json.loads(response)
        data["llm_prompt_used"] = prompt
        return data
    except:
        fallback = FALLBACK_EXERCISES.get(rule_name, {}).get(exercise_type, {})
        return {
            "prompt_text": fallback.get("prompt_text", f"Practice {rule_name}"),
            "expected_answer": fallback.get("expected_answer", ""),
            "native_sentence": fallback.get("native_sentence", ""),
            "infinitive_verb": fallback.get("infinitive_verb", ""),
            "llm_prompt_used": prompt
        }

def analyze_grammar_feedback(user_input: str, expected_answer: str, context_rule: str) -> dict:
    prompt = f"""Analyze this German grammar exercise attempt:
User input: {user_input}
Expected answer: {expected_answer}
Grammar rule being tested: {context_rule}

Return ONLY a JSON object with:
- "is_correct": boolean (true if user_input matches expected_answer semantically)
- "correction": the corrected sentence if incorrect
- "explanation": linguistic explanation in English (e.g., "You used Akkusativ, but 'geben' requires Dativ for the indirect object.")
- "rule_missed_id": null or 1 if mistake made

Consider minor spelling differences as correct if the grammar is right.
"""

    response = _call_ollama(prompt)
    try:
        return json.loads(response)
    except:
        is_correct = user_input.strip().lower() == expected_answer.strip().lower()
        return {
            "is_correct": is_correct,
            "correction": expected_answer if not is_correct else user_input,
            "explanation": "Correct!" if is_correct else f"Compare your answer with the correct form. The rule: {context_rule}",
            "rule_missed_id": None if is_correct else 1
        }
