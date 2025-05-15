from django.urls import path
from backend.views.session import (
    WorkoutSessionListView, CreateWorkoutSessionView, CreateExerciseSessionView, CreateSetView
)

urlpatterns = [
    path("workout/create/", CreateWorkoutSessionView.as_view(), name="workout_session-create"),
    path("exercise/create/", CreateExerciseSessionView.as_view(), name="exercise_session-create"),
    path("set/create/", CreateSetView.as_view(), name="set-create"),
    path("workout/", WorkoutSessionListView.as_view(), name="workout_session-list"),
]
