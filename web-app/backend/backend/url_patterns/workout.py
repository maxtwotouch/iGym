from django.urls import path
from backend.views.workout import (
    WorkoutListView, CreateWorkoutView, WorkoutDeleteView, WorkoutDetailView, 
    UpdateWorkoutView, ListExercisesInWorkoutView
)

urlpatterns = [
    path("", WorkoutListView.as_view(), name="workout-list"),
    path("create/", CreateWorkoutView.as_view(), name="workout-create"),
    path("delete/<int:pk>/", WorkoutDeleteView.as_view(), name="workout-delete"),
    path("update/<int:pk>/", UpdateWorkoutView.as_view(), name="workout-update"),
    path("<int:pk>/", WorkoutDetailView.as_view(), name="get-workout"),
    path("<int:pk>/exercises/", ListExercisesInWorkoutView.as_view(), name="workout-exercises"),
]
