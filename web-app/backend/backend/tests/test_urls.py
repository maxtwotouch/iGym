from django.test import TestCase
from django.urls import resolve
from backend.views import CreateUserView, CreatePersonalTrainerView, CustomTokenObtainPairView, WorkoutListView, ExerciseListView, CreateWorkoutView, WorkoutDeleteView, UpdateWorkoutView, WorkoutDetailView, ExerciseDetailView, WorkoutSessionListView, CreateWorkoutSessionView, CreateExerciseSessionView, CreateSetView
from rest_framework_simplejwt.views import TokenRefreshView


class GymUrlTest(TestCase):
    
    def test_gym_url_resolve_to_create_user_endpoint(self):
        view = resolve('/user/register/')
        self.assertEqual(view.func.view_class, CreateUserView)
    
    def test_gym_url_to_create_personal_trainer_endpoint(self):
        view = resolve('/personal_trainer/register/')
        self.assertEqual(view.func.view_class, CreatePersonalTrainerView)

    def test_gym_url_to_obtain_token_endpoint(self):
        view = resolve('/token/')
        self.assertEqual(view.func.view_class, CustomTokenObtainPairView)

    def test_gym_url_to_refresh_token_endpoint(self):
        view = resolve('/user/refresh/')
        self.assertEqual(view.func.view_class, TokenRefreshView)
    
    def test_gym_url_to_list_workouts_endpoint(self):
        view = resolve('/workouts/')
        self.assertEqual(view.func.view_class, WorkoutListView)

    def test_gym_url_to_list_exercises_endpoint(self):
        view = resolve('/exercises/')
        self.assertEqual(view.func.view_class, ExerciseListView)
    
    def test_gym_url_to_create_workout_endpoint(self):
        view = resolve('/workouts/create/')
        self.assertEqual(view.func.view_class, CreateWorkoutView)
    
    def test_gym_url_to_delete_workout_endpoint(self):
        view = resolve('/workouts/delete/1/')
        self.assertEqual(view.func.view_class, WorkoutDeleteView)

    def test_gym_url_to_update_workout_endpoint(self):
        view = resolve('/workouts/update/1/')
        self.assertEqual(view.func.view_class, UpdateWorkoutView)

    def test_gym_url_to_get_workout_detail_endpoint(self):
        view = resolve('/workouts/1/')
        self.assertEqual(view.func.view_class, WorkoutDetailView)

    def test_gym_url_to_get_exercise_detail_endpoint(self):
        view = resolve('/exercises/1/')
        self.assertEqual(view.func.view_class, ExerciseDetailView)
    
    def test_gym_url_to_create_workout_session_endpoint(self):
        view = resolve('/workout/session/create/')
        self.assertEqual(view.func.view_class, CreateWorkoutSessionView)

    def test_gym_url_to_create_exercise_session_endpoint(self):
        view = resolve('/exercise/session/create/')
        self.assertEqual(view.func.view_class, CreateExerciseSessionView)
    
    def test_gym_url_to_create_set_endpoint(self):
        view = resolve('/set/create/')
        self.assertEqual(view.func.view_class, CreateSetView)
    
    def test_gym_url_to_list_workout_sessions_endpoint(self):
        view = resolve('/workouts_sessions/')
        self.assertEqual(view.func.view_class, WorkoutSessionListView)