from django.test import TestCase
from django.urls import resolve
from backend.views.schedule import (
    CreateScheduledWorkoutView, ScheduledWorkoutListView, SchedulesWorkoutDeleteView,
    CreatePersonalTrainerScheduledWorkoutView, PersonalTrainerScheduledWorkoutListView,
    PersonalTrainerScheduledWorkoutDeleteView
)

class ScheduleUrlsTest(TestCase):
    def test_gym_url_to_create_scheduled_workout_endpoint(self):
        view = resolve('/schedule/workout/create/')
        self.assertEqual(view.func.view_class, CreateScheduledWorkoutView)

    def test_gym_url_to_delete_scheduled_workout_endpoint(self):
        view = resolve('/schedule/workout/delete/1/')
        self.assertEqual(view.func.view_class, SchedulesWorkoutDeleteView)

    def test_gym_url_to_list_scheduled_workouts_endpoint(self):
        view = resolve('/schedule/workout/')
        self.assertEqual(view.func.view_class, ScheduledWorkoutListView)

    def test_gym_url_to_create_pt_scheduled_workout_endpoint(self):
        view = resolve('/schedule/pt_workout/create/')
        self.assertEqual(view.func.view_class, CreatePersonalTrainerScheduledWorkoutView)

    def test_gym_url_to_delete_pt_scheduled_workout_endpoint(self):
        view = resolve('/schedule/pt_workout/delete/1/')
        self.assertEqual(view.func.view_class, PersonalTrainerScheduledWorkoutDeleteView)

    def test_gym_url_to_list_pt_scheduled_workouts_endpoint(self):
        view = resolve('/schedule/pt_workout/')
        self.assertEqual(view.func.view_class, PersonalTrainerScheduledWorkoutListView)