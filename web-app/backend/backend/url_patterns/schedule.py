from django.urls import path
from backend.views.schedule import (
    CreateScheduledWorkoutView, ScheduledWorkoutListView, SchedulesWorkoutDeleteView,
    CreatePersonalTrainerScheduledWorkoutView, PersonalTrainerScheduledWorkoutListView,
    PersonalTrainerScheduledWorkoutDeleteView
)

urlpatterns = [
    path("workout/create/", CreateScheduledWorkoutView.as_view(), name="scheduled_workout-create"),
    path("workout/delete/<int:pk>/", SchedulesWorkoutDeleteView.as_view(), name="scheduled_workout-delete"),
    path("workout/", ScheduledWorkoutListView.as_view(), name="scheduled_workouts-list"),
    path("pt_workout/create/", CreatePersonalTrainerScheduledWorkoutView.as_view(), name="pt_scheduled_workout-create"),
    path("pt_workout/delete/<int:pk>/", PersonalTrainerScheduledWorkoutDeleteView.as_view(), name="pt_scheduled_workout-delete"),
    path("pt_workout/", PersonalTrainerScheduledWorkoutListView.as_view(), name="pt_scheduled_workouts-list"),
]
