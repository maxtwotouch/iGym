from django.urls import path
from backend.views.exercise import ExerciseListView, ExerciseDetailView

urlpatterns = [
    path("", ExerciseListView.as_view(), name="exercise-list"),
    path("<int:pk>/", ExerciseDetailView.as_view(), name="get-exercise"),
]
