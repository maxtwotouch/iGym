from django.test import TestCase
from django.urls import resolve
from backend.views.trainer import (
    PersonalTrainerListView, UpdatePersonalTrainerView, PersonalTrainerDetailView, ClientsListView,
    ListScheduledWorkoutsOfClientView, ListWorkoutSessionsOfClientsView, ListWorkoutsOfClientsListView
)

class TrainerUrlsTest(TestCase):
    def test_gym_url_to_list_personal_trainers_endpoint(self):
        view = resolve("/trainer/")
        self.assertEqual(view.func.view_class, PersonalTrainerListView)
    
    def test_gym_url_to_update_personal_trainer_endpoint(self):
        view = resolve("/trainer/update/1/")
        self.assertEqual(view.func.view_class, UpdatePersonalTrainerView)
    
    def test_gym_url_to_get_personal_trainer_detail_endpoint(self):
        view = resolve("/trainer/1/")
        self.assertEqual(view.func.view_class, PersonalTrainerDetailView)
    
    def test_gym_url_to_list_clients_endpoint(self):
        view = resolve("/trainer/clients/")
        self.assertEqual(view.func.view_class, ClientsListView)
    
    def test_gym_url_to_list_scheduled_workouts_of_client_endpoint(self):
        view = resolve("/trainer/client/1/scheduled_workouts/")
        self.assertEqual(view.func.view_class, ListScheduledWorkoutsOfClientView)
    
    def test_gym_url_to_list_workout_sessions_of_client_endpoint(self):
        view = resolve("/trainer/client/1/workout_sessions/")
        self.assertEqual(view.func.view_class, ListWorkoutSessionsOfClientsView)
        
    def test_gym_url_to_list_workouts_of_client_endpoint(self):
        view = resolve("/trainer/client/1/workouts/")
        self.assertEqual(view.func.view_class, ListWorkoutsOfClientsListView)
