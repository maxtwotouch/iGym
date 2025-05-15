from django.test import TestCase
from django.urls import resolve
from backend.views.workout import (
    WorkoutListView, CreateWorkoutView, WorkoutDeleteView, WorkoutDetailView, 
    UpdateWorkoutView, ListExercisesInWorkoutView
)

class WorkoutUrlsTest(TestCase):
    def test_gym_url_to_list_workouts_endpoint(self):
        view = resolve('/workout/')
        self.assertEqual(view.func.view_class, WorkoutListView)

    def test_gym_url_to_create_workout_endpoint(self):
        view = resolve('/workout/create/')
        self.assertEqual(view.func.view_class, CreateWorkoutView)

    def test_gym_url_to_delete_workout_endpoint(self):
        view = resolve('/workout/delete/1/')
        self.assertEqual(view.func.view_class, WorkoutDeleteView)

    def test_gym_url_to_update_workout_endpoint(self):
        view = resolve('/workout/update/1/')
        self.assertEqual(view.func.view_class, UpdateWorkoutView)

    def test_gym_url_to_get_workout_detail_endpoint(self):
        view = resolve('/workout/1/')
        self.assertEqual(view.func.view_class, WorkoutDetailView)
    
    def test_gym_url_to_list_exercises_in_workout_endpoint(self):
        view = resolve('/workout/1/exercises/')
        self.assertEqual(view.func.view_class, ListExercisesInWorkoutView)
    