from backend.models import Exercise
from backend.serializers import ExerciseSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics

class ExerciseDetailView(generics.RetrieveAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Exercise.objects.all()

class ExerciseListView(generics.ListAPIView):
    # Provide a proper queryset rather than the model itself
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
