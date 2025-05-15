from django.urls import reverse
from rest_framework import status
from backend.models import Exercise
from backend.serializers import ExerciseSerializer
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

class TestExerciseDetailView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        
        self.url = reverse("get-exercise", kwargs={"pk": self.exercise.id})
        
    def test_exercise_detail_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = ExerciseSerializer(self.exercise)
        
        self.assertEqual(response.data, serializer.data)
        
    def test_exercise_detail_non_existent_workout(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("get-exercise", kwargs={"pk": 9999})
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class ExerciseListViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        
        # Create some test exercises
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")
        
        self.url = reverse("exercise-list")
        
        self.exercises = [self.exercise, self.second_exercise]
        
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        
        # Unauthenticated users should not be able to get the list of exercises
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_exercises_basic(self):
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Convert the exercises to the same format as the response using the serializer
        serializer = ExerciseSerializer(self.exercises, many=True)
        
        # Make sure that the queryset returned contains all exercises
        self.assertEqual(len(response.data), len(self.exercises))
        self.assertEqual(response.data, serializer.data)