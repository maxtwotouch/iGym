"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from django.contrib import admin
from .views import CreateUserView, CreatePersonalTrainerView, WorkoutListCreate, WorkoutListView, ExerciseListView, CreateWorkoutView
from .views import WorkoutDelete, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Personal trainer and normal users have their own endpoints for registration (may have to be fixed)
    path("user/register/", CreateUserView.as_view(), name="register_user"),
    path("personal_trainer/register/", CreatePersonalTrainerView.as_view(), name="register_personal_trainer"),
    path("token/", CustomTokenObtainPairView.as_view(), name="get_token"),
    path("user/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("auth/", include("rest_framework.urls")),
    path("workouts/", WorkoutListView.as_view(), name="workout-list"),
    path("exercises/", ExerciseListView.as_view(), name="exercise-list"),
    path("workouts/create/", CreateWorkoutView.as_view, name="workout-create"),
    path("workouts/delete/<int:pk>/", WorkoutDelete.as_view(), name="delete-workout")
]


