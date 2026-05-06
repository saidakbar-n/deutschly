"""Simple integration tests for grammar API without FastAPI test client"""
import unittest
import requests
from app.core.deps import get_db
from app.models.grammar_rule import GrammarRule
from app.models.grammar_exercise import GrammarExercise

BASE_URL = "http://localhost:8000/api/v1"

class TestGrammarAPISimple(unittest.TestCase):
    """Test grammar API endpoints against running server"""
    
    def test_list_rules(self):
        """Test listing grammar rules"""
        response = requests.get(f"{BASE_URL}/grammar/rules")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
    
    def test_fetch_exercises(self):
        """Test fetching exercises for user"""
        response = requests.get(f"{BASE_URL}/grammar/exercises/1", params={"limit": 2})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
    
    def test_submit_correct_answer(self):
        """Test submitting a correct answer"""
        response = requests.post(
            f"{BASE_URL}/grammar/submit/1",
            json={"user_id": 1, "user_input": "dem"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("is_correct", data)
        self.assertIn("feedback_explanation", data)

if __name__ == '__main__':
    unittest.main()
