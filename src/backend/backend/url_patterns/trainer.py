from django.urls import path
from backend.views.trainer import (
    PersonalTrainerListView, UpdatePersonalTrainerView, PersonalTrainerDetailView, ClientsListView,
    ListScheduledWorkoutsOfClientView, ListWorkoutSessionsOfClientsView, ListWorkoutsOfClientsListView
)

urlpatterns = [
    path("", PersonalTrainerListView.as_view(), name="personal_trainer-list"),
    path("update/<int:pk>/", UpdatePersonalTrainerView.as_view(), name="personal_trainer-update"),
    path("<int:pk>/", PersonalTrainerDetailView.as_view(), name="personal_trainer-detail"),
    path("clients/", ClientsListView.as_view(), name="clients-list"),
    path("client/<int:pk>/scheduled_workouts/", ListScheduledWorkoutsOfClientView.as_view(), name="client-scheduled_workouts-list"),
    path("client/<int:pk>/workout_sessions/", ListWorkoutSessionsOfClientsView.as_view(), name="client-workout_sessions-list"),
    path("client/<int:pk>/workouts/", ListWorkoutsOfClientsListView.as_view(), name="client-workouts-list"),
]
