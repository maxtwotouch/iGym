from rest_framework.response import Response
from .models import Workout, Exercise
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, PeronsalTrainerSerializer, WorkoutSerializer
from .serializers import ExerciseSerializer, CustomTokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView



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

class UpdateWorkoutView(generics.UpdateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only update workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(author=user)
    
class CreateWorkoutView(generics.CreateAPIView):
    serializer_class = WorkoutSerializer
    # Only people with a valid access token are allowed to call this endpoint
    permission_classes = [IsAuthenticated]
    
    # Overwriting the create method to associate the workout with the current user
    def perform_create(self, serializer):
        if serializer.is_valid():
            # Have to manually add the author because we specified it as read only
            serializer.save(author=self.request.user)

        else:
            print(serializer.errors)

class WorkoutListView(generics.ListAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Get all workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(author=user)

class WorkoutDetailView(generics.RetrieveAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(author=user)

class ExerciseDetailView(generics.RetrieveAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Exercise.objects.all()
        

class WorkoutDeleteView(generics.DestroyAPIView):
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

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class =  CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
