from backend.models import Workout
from backend.serializers import WorkoutSerializer, ExerciseSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, serializers, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

class CreateWorkoutView(generics.CreateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Overwriting the create method to associate the workout with the current user
    def perform_create(self, serializer):
        user = self.request.user
        if serializer.is_valid():
            workout = serializer.save(author=user)
            workout.owners.add(user) 
        else:
            print(serializer.errors)

class UpdateWorkoutView(generics.UpdateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only update workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(owners=user)


class WorkoutListView(generics.ListAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Get all workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(owners=user)
    
    
class WorkoutDetailView(generics.RetrieveAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(owners=user)


class WorkoutDeleteView(generics.DestroyAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only delete workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(owners=user)
    
    def perform_destroy(self, instance):
        user = self.request.user
        
        # Remove the user as a owner if there is still more owners left
        if instance.owners.count() > 1:
            instance.owners.remove(user)
            return Response({"detail": "You are not a owner of teh workout anymore."}, status=status.HTTP_204_NO_CONTENT)
        
        # If the user is the last owner, delete the workout
        else:
            instance.delete()
            return Response({"detail": "Workout deleted since you were the last owner."}, status=status.HTTP_204_NO_CONTENT)


class ListExercisesInWorkoutView(generics.ListAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        workout_id = self.kwargs["pk"]
        workout_object = get_object_or_404(Workout, id=workout_id)
        
        # Make sure that the user is a owner of the workout or is a personal trainer
        if not workout_object.owners.filter(id=user.id).exists() and not hasattr(user, "trainer_profile"):
            raise serializers.ValidationError("Cannot request exercises of a workout that you are not a owner of, or if you are not a personal trainer")
       
        return workout_object.exercises.all()
