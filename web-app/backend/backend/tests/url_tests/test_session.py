from django.test import TestCase
from django.urls import resolve
from backend.views.session import (
    WorkoutSessionListView, CreateWorkoutSessionView, CreateExerciseSessionView, CreateSetView
)

class SessionUrlsTest(TestCase):
    def test_gym_url_to_list_workout_sessions_endpoint(self):
        view = resolve('/session/workout/')
        self.assertEqual(view.func.view_class, WorkoutSessionListView)

    def test_gym_url_to_create_workout_session_endpoint(self):
        view = resolve('/session/workout/create/')
        self.assertEqual(view.func.view_class, CreateWorkoutSessionView)

    def test_gym_url_to_create_exercise_session_endpoint(self):
        view = resolve('/session/exercise/create/')
        self.assertEqual(view.func.view_class, CreateExerciseSessionView)

    def test_gym_url_to_create_set_endpoint(self):
        view = resolve('/session/set/create/')
        self.assertEqual(view.func.view_class, CreateSetView)
    