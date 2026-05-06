import unittest
from unittest.mock import patch, MagicMock
from app.core.llm_client import generate_exercise_content, analyze_grammar_feedback

class TestLLMClient(unittest.TestCase):
    
    @patch('app.core.llm_client.requests.post')
    def test_generate_exercise_content_success(self, mock_post):
        """Test successful exercise generation"""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "response": '{"prompt_text": "Ich gebe _ Kind das Buch.", "expected_answer": "dem", "native_sentence": "I give the child the book.", "infinitive_verb": "geben"}'
        }
        mock_post.return_value = mock_response
        
        result = generate_exercise_content("Dativ Case", "cloze", "A1")
        
        self.assertIn("prompt_text", result)
        self.assertIn("expected_answer", result)
        mock_post.assert_called_once()
    
    @patch('app.core.llm_client.requests.post')
    def test_generate_exercise_content_failure(self, mock_post):
        """Test fallback when Ollama fails"""
        mock_post.side_effect = Exception("Connection error")
        
        result = generate_exercise_content("Dativ Case", "cloze", "A1")
        
        self.assertIn("prompt_text", result)
        self.assertIn("expected_answer", result)
    
    @patch('app.core.llm_client.requests.post')
    def test_analyze_grammar_feedback_correct(self, mock_post):
        """Test feedback for correct answer"""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "response": '{"is_correct": true, "correction": "dem Kind", "explanation": "Correct!", "rule_missed_id": null}'
        }
        mock_post.return_value = mock_response
        
        result = analyze_grammar_feedback("dem Kind", "dem Kind", "Dativ Case")
        
        self.assertTrue(result["is_correct"])
        self.assertEqual(result["explanation"], "Correct!")
    
    @patch('app.core.llm_client.requests.post')
    def test_analyze_grammar_feedback_incorrect(self, mock_post):
        """Test feedback for incorrect answer"""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "response": '{"is_correct": false, "correction": "dem Kind", "explanation": "You used wrong case.", "rule_missed_id": 1}'
        }
        mock_post.return_value = mock_response
        
        result = analyze_grammar_feedback("den Kind", "dem Kind", "Dativ Case")
        
        self.assertFalse(result["is_correct"])
        self.assertIsNotNone(result["rule_missed_id"])
    
    @patch('app.core.llm_client.requests.post')
    def test_analyze_grammar_feedback_failure(self, mock_post):
        """Test fallback when Ollama fails"""
        mock_post.side_effect = Exception("Connection error")
        
        result = analyze_grammar_feedback("den Kind", "dem Kind", "Dativ Case")
        
        self.assertIn("is_correct", result)
        self.assertIn("explanation", result)

if __name__ == '__main__':
    unittest.main()
