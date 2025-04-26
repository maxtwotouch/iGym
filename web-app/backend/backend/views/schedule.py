from backend.models import PersonalTrainerScheduledWorkout, ScheduledWorkout
from backend.serializers import ScheduledWorkoutSerializer, PersonalTrainerScheduledWorkoutSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, serializers

class CreateScheduledWorkoutView(generics.CreateAPIView):
     serializer_class = ScheduledWorkoutSerializer
     permission_classes = [IsAuthenticated]
     
     def perform_create(self, serializer):
         serializer.save(user=self.request.user)

class SchedulesWorkoutDeleteView(generics.DestroyAPIView):
    serializer_class = ScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ScheduledWorkout.objects.filter(user=user)

class ScheduledWorkoutListView(generics.ListAPIView):
    serializer_class = ScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
     
    def get_queryset(self):
        return ScheduledWorkout.objects.filter(user=self.request.user)

class CreatePersonalTrainerScheduledWorkoutView(generics.CreateAPIView):
    serializer_class = PersonalTrainerScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        trainer = self.request.user
        
        # Check if the user and pt is the correct types
        if not hasattr(trainer, "trainer_profile"):
            raise serializers.ValidationError("PT is not a personal trainer")
        
        client = serializer.validated_data.get("client")
        
        if not hasattr(client, "profile"):
            raise serializers.ValidationError("Client is not a user")
        
        # Check that the client has the pt as its personal trainer
        if not client.profile.personal_trainer == trainer.trainer_profile:
            raise serializers.ValidationError("Client does not have this pt as its personal trainer")
        
        serializer.save(pt=self.request.user)

class PersonalTrainerScheduledWorkoutListView(generics.ListAPIView):
    serializer_class = PersonalTrainerScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
     
    # Fetch all PersonalTrainerScheduledWorkout objects where the current user is involved
    def get_queryset(self):
        user = self.request.user
        
        # Check if the user is a normal user or a personal trainer
        if hasattr(user, "profile"):
            return PersonalTrainerScheduledWorkout.objects.filter(client=user)
        
        elif hasattr(user, "trainer_profile"):
            return PersonalTrainerScheduledWorkout.objects.filter(pt=user)

class PersonalTrainerScheduledWorkoutDeleteView(generics.DestroyAPIView):
    serializer_class = PersonalTrainerScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only delete pt scheduled workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        # Only the pt can delete the scheduled workout
        return PersonalTrainerScheduledWorkout.objects.filter(pt=user)

