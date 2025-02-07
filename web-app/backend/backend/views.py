from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib import messages
from .models import Workout, Exercise
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, PeronsalTrainerSerializer, WorkoutSerializer
from .serializers import ExerciseSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny


# View for creating a new user
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # Everyone is allowed to create a user
    permission_classes = [AllowAny]

# View for creating a new personal trainer
class CreatePersonalTrainerView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = PeronsalTrainerSerializer
    permission_classes = [AllowAny]

class WorkoutListCreate(generics.ListCreateAPIView):
    serializer_class = WorkoutSerializer
    # Only people with a valid access token are allowed to call this endpoint
    permission_classes = [IsAuthenticated]
    
    # Get all workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(author=user)
    
    # Overwriting the create method to associate the workout with the current user
    def perform_create(self, serializer):
        # Corrected: use self.request.user instead of self.requesty.user
        serializer.save(author=self.request.user)

class WorkoutDelete(generics.DestroyAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only delete workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(author=user)
    
class ExerciseListView(generics.ListAPIView):
    # Provide a proper queryset rather than the model itself
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]