from django.test import TestCase
from django.urls import resolve
from backend.views import CreateUserView, CreatePersonalTrainerView, ExerciseListView

class GymUrlTest(TestCase):
    
    def test_gym_url_resolve_to_create_user_page(self):
        view = resolve('/user/register/')
        self.assertEqual(view.func.view_class, CreateUserView)
    
    def test_gym_url_to_create_personal_trainer_page(self):
        view = resolve('/personal_trainer/register/')
        self.assertEqual(view.func.view_class, CreatePersonalTrainerView)
    
    def test_gym_url_to_list_exercises_page(self):
        view = resolve('/exercises/')
        self.assertEqual(view.func.view_class, ExerciseListView)