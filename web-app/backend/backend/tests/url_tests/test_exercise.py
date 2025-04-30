from django.test import TestCase
from django.urls import resolve
from backend.views.exercise import ExerciseListView, ExerciseDetailView

class ExerciseUrlsTest(TestCase):
    def test_gym_url_to_list_exercises_endpoint(self):
        view = resolve('/exercise/')
        self.assertEqual(view.func.view_class, ExerciseListView)
        
    def test_gym_url_to_get_exercise_detail_endpoint(self):
        view = resolve('/exercise/1/')
        self.assertEqual(view.func.view_class, ExerciseDetailView)