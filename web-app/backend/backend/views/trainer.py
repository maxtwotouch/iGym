from django.contrib.auth.models import User
from backend.models import ScheduledWorkout, WorkoutSession, Workout
from backend.serializers import PersonalTrainerSerializer, ScheduledWorkoutSerializer, UserSerializer, WorkoutSessionSerializer, WorkoutSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, serializers
from django.shortcuts import get_object_or_404

class PersonalTrainerListView(generics.ListAPIView):
    serializer_class = PersonalTrainerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(trainer_profile__isnull=False)
    
class PersonalTrainerDetailView(generics.RetrieveAPIView):
    serializer_class = PersonalTrainerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(trainer_profile__isnull=False)

class UpdatePersonalTrainerView(generics.UpdateAPIView):
    serializer_class = PersonalTrainerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(id=user.id)

class ClientsListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        trainer = self.request.user
        #  Retrieve all user profiles where personal_trainer is the current user's trainer profile
        return User.objects.filter(profile__personal_trainer__user=trainer)

class ListScheduledWorkoutsOfClientView(generics.ListAPIView):
    serializer_class = ScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        client_id = self.kwargs["pk"]
        client = get_object_or_404(User, id=client_id)
        
        trainer = self.request.user
        
        # Check that the client has this user as personal trainer
        if not hasattr(trainer, "trainer_profile") or not client.profile.personal_trainer == trainer.trainer_profile:
            raise serializers.ValidationError("You are not the personal trainer for this user")
        
        return ScheduledWorkout.objects.filter(user=client)

class ListWorkoutSessionsOfClientsView(generics.ListAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        client_id = self.kwargs["pk"]
        client = get_object_or_404(User, id=client_id)
        
        trainer = self.request.user
        
        if not hasattr(trainer, "trainer_profile") or not client.profile.personal_trainer == trainer.trainer_profile:
            raise serializers.ValidationError("You are not the personal trainer for this user")

        return WorkoutSession.objects.filter(user=client)   

class ListWorkoutsOfClientsListView(generics.ListAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        client_id = self.kwargs["pk"]
        client = get_object_or_404(User, id=client_id)
        
        trainer = self.request.user
        
        if not hasattr(trainer, "trainer_profile") or not client.profile.personal_trainer == trainer.trainer_profile:
            raise serializers.ValidationError("You are not the personal trainer for this user")
        
        return Workout.objects.filter(owners=client)

