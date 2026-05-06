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

LEVEL_GUIDANCE = {
    "A1": "Use very simple English. Explain in 1 short sentence. Focus on the single grammar point being tested (e.g., 'der = masculine subject').",
    "A2": "Use simple English. Explain in 1-2 sentences. Include a brief hint about the rule.",
    "B1": "Use clear English. Explain the grammar pattern. Show why the wrong form doesn't work.",
    "B2": "Use natural English. Give a thorough explanation with the underlying grammar pattern.",
}

def analyze_grammar_feedback(
    user_input: str,
    expected_answer: str,
    context_rule: str,
    user_level: str = "A1",
    exercise_type: str = "cloze",
    rule_description: str = "",
    infinitive_verb: str = ""
) -> dict:
    level_guidance = LEVEL_GUIDANCE.get(user_level, LEVEL_GUIDANCE["A1"])

    context_parts = []
    if infinitive_verb:
        context_parts.append(f"Key verb: '{infinitive_verb}' (this verb governs a specific case)")
    if rule_description:
        context_parts.append(f"Rule: {rule_description}")
    context_extra = "\n".join(context_parts)

    prompt = f"""You are an expert German (Deutsch) grammar tutor helping a {user_level} level student.

Exercise type: {exercise_type}
Grammar rule: {context_rule}
{context_extra}

Student's answer: "{user_input}"
Correct answer: "{expected_answer}"

Analyze the student's answer and return ONLY a JSON object with:
- "is_correct": boolean — true if the grammar (case, gender, number) is correct. Minor spelling differences should be forgiven.
- "explanation": a personalized teaching explanation in English. If correct, briefly confirm WHY it's right so they learn the pattern. If wrong, explain exactly what they got wrong, WHY the correct form is right, and give a memorable hint. Adapt to their level: {level_guidance}
- "rule_missed_id": integer or null — set to 1 if they made a case/gender/number mistake, null if correct.

Focus on helping them understand the grammar pattern, not just the answer. Use bold for German words. Keep the tone encouraging.
"""

    response = _call_ollama(prompt)
    try:
        data = json.loads(response)
        if "is_correct" in data and "explanation" in data:
            data["rule_missed_id"] = data.get("rule_missed_id")
            return data
    except:
        pass

    is_correct = user_input.strip().lower() == expected_answer.strip().lower()
    if is_correct:
        explanation = f"Correct! That's the right form for {context_rule}."
    else:
        explanation = (
            f"Not quite. The correct answer is **{expected_answer}**. "
            f"This is because {context_rule} requires this specific form. "
            f"Try to notice the pattern — it'll help you next time!"
        )

    return {
        "is_correct": is_correct,
        "explanation": explanation,
        "rule_missed_id": None if is_correct else 1
    }
