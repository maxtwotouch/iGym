from backend.models import WorkoutSession
from backend.serializers import WorkoutSessionSerializer, ExerciseSessionSerializer, SetSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, serializers


class CreateWorkoutSessionView(generics.CreateAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]
    
    # Set the user to the request user, since this is a read-only field
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(user=self.request.user)
        else:
            print(serializer.errors)

class CreateExerciseSessionView(generics.CreateAPIView):
    serializer_class = ExerciseSessionSerializer
    permission_classes = [IsAuthenticated]
    
    # Make sure that the exercise is contained in the workout
    def perform_create(self, serializer):
        exercise = serializer.validated_data["exercise"]
        workout_session = serializer.validated_data["workout_session"]
        
        if not workout_session.workout.exercises.filter(id=exercise.id).exists():
            raise serializers.ValidationError("This exercise is not a part of the workout")
        
        serializer.save()

class CreateSetView(generics.CreateAPIView):
    serializer_class = SetSerializer
    permission_classes = [IsAuthenticated]

class WorkoutSessionListView(generics.ListAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user)


