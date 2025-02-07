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
    
    # Only people with a valid access token is allowed to call this endpoint
    permission_classes = [IsAuthenticated]
    
    # Get all workouts related to that user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(author=user)
    
    # Overwriting the create method
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.requesty.user)
        else:
            print(serializer.errors)

class WorkoutDelete(generics.DestroyAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only delete workouts related to that user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(author=user)
    

class ExerciseListView(generics.ListAPIView):
    queryset = Exercise
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
        
    
    

    
