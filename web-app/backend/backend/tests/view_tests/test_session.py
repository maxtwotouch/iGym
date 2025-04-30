from django.urls import reverse
from rest_framework import status
from backend.models import Workout, WorkoutSession, ExerciseSession, Exercise, Set
from backend.serializers import  WorkoutSessionSerializer
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from datetime import timedelta

class TestCreateWorkoutSessionView(APITestCase):
    def setUp(self):
        self.user = User.objects.create(username="testuser", password="password")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.workout.exercises.set([self.exercise])
        
        self.repetitions = 10
        self.weight = 50
        self.calories_burned = 120.5
        self.url = reverse("workout_session-create")
    
    def test_create_workout_session_basic(self):
        self.client.force_authenticate(user=self.user)
        
        data = {
            "workout": self.workout.id,
            "calories_burned": self.calories_burned,
            "duration":  timedelta(hours=1, minutes=30, seconds=0)
        }
        
        response = self.client.post(self.url, data=data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WorkoutSession.objects.count(), 1)
        
        workout_session = WorkoutSession.objects.get(id=response.data["id"])
        
        #  Add an exercise session 
        exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=workout_session)
        set = Set.objects.create(exercise_session=exercise_session, repetitions=self.repetitions, weight=self.weight)
        
        self.assertEqual(workout_session.user, self.user)
        self.assertEqual(workout_session.workout, self.workout)
        self.assertEqual(workout_session.calories_burned, self.calories_burned)
        
        self.assertIn(exercise_session, workout_session.exercise_sessions.all())
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_workout_session_with_non_existent_workout(self):
        self.client.force_authenticate(user=self.user)
        non_existent_workout_id = 9999
        
        data = {
            "workout": non_existent_workout_id,
            "calories_burned": self.calories_burned,
            "duration":  timedelta(hours=1, minutes=30, seconds=0)
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(WorkoutSession.objects.count(), 0)
    
    
    def test_non_author_performs_workout_session(self):        
        self.second_user = User.objects.create(username="secondTestuser", password="password")
        self.client.force_authenticate(user=self.second_user)
        data = {
            "workout": self.workout.id,
            "calories_burned": self.calories_burned,
            "duration":  timedelta(hours=1, minutes=30, seconds=0)
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WorkoutSession.objects.count(), 1)
        
        workout_session = WorkoutSession.objects.get(id=response.data["id"])
        
        # The user that performed the workout session is not the same as the author of the workout, which is allowed (if someone sends a workout to another user)
        self.assertEqual(workout_session.user, self.second_user)
        self.assertEqual(workout_session.workout.author, self.user)
        
class TestCreateExerciseSessionView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.workout.exercises.set([self.exercise])
        self.workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, duration = timedelta(hours=1, minutes=30, seconds=0))
        
        
        self.repetitions = 10
        self.weight = 50
        self.url = reverse("exercise_session-create")
        
    def test_create_exercise_session_basic(self):
        self.client.force_authenticate(user=self.user)
        
        data = {
            "exercise": self.exercise.id,
            "workout_session": self.workout_session.id
        }
        
        response = self.client.post(self.url, data=data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ExerciseSession.objects.count(), 1)
        
        exercise_session = ExerciseSession.objects.get(id=response.data["id"])
        
        # Add a set to the exercise session
        set = Set.objects.create(exercise_session=exercise_session, repetitions=self.repetitions, weight=self.weight)
        
        self.assertEqual(exercise_session.exercise, self.exercise)
        self.assertEqual(exercise_session.workout_session, self.workout_session)
        
        #  Verify that the set was included in the exercise session automatically when created
        self.assertIn(set, exercise_session.sets.all())
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def  test_create_exercise_session_with_non_existent_exercise(self):
        self.client.force_authenticate(user=self.user)
        non_existent_exercise_id = 9999
        data = {
            "exercise": non_existent_exercise_id,
            "workout_session": self.workout_session.id
        }
        
        response = self.client.post(self.url, data=data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ExerciseSession.objects.count(), 0)
    
    def test_create_exercise_session_with_non_existent_workout_session(self):
        self.client.force_authenticate(user=self.user)
        non_existent_workout_session_id = 9999
        data = {
            "exercise": self.exercise.id,
            "workout_session": non_existent_workout_session_id
        }
        
        response = self.client.post(self.url, data=data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ExerciseSession.objects.count(), 0)
    
    def test_create_exercise_session_with_non_beloning_exercise(self):
        self.client.force_authenticate(user=self.user)
        
        # Second exercise that is not part of the workout session
        second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")
        
        data = {
            "exercise": second_exercise.id,
            "workout_session": self.workout_session.id
        }
        
        response = self.client.post(self.url, data=data, format='json')
        
        # The exercise session should not be created since the exercise does not exist in the workout
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ExerciseSession.objects.count(), 0)

class TestCreateSet(APITestCase):
    def setUp(self):
        # Establish a user, workout, workout session, exercise and exercise session
        self.user = User.objects.create_user(username="testuser", password="password")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.workout.exercises.set([self.exercise])
        self.workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, duration = timedelta(hours=1, minutes=30, seconds=0))
        self.exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.workout_session)
        

        self.repetitions = 10
        self.weight = 50
        self.url = reverse("set-create")
    
    def test_create_set_basic(self):
        self.client.force_authenticate(user=self.user)
        
        data = {
            "exercise_session": self.exercise_session.id,
            "repetitions": self.repetitions,
            "weight": self.weight
        }
        
        response = self.client.post(self.url, data=data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Set.objects.count(), 1)
        
        set = Set.objects.get(id=response.data["id"])
        self.assertEqual(set.exercise_session, self.exercise_session)
        self.assertEqual(set.repetitions, self.repetitions)
        self.assertEqual(set.weight, self.weight)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_set_with_non_existent_exeercise_session(self):
        self.client.force_authenticate(user=self.user)
        non_existent_exercise_id = 9999
        data = {
            "exercise_session": non_existent_exercise_id,
            "repetitions": self.repetitions,
            "weight": self.weight
        }
        
        response = self.client.post(self.url,  data=data, format='json')
        
        # Make sure that the set was not created
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Set.objects.count(), 0)
        
class TestListWorkoutSessionsView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.workout.exercises.set([self.exercise])
        
        self.duration = timedelta(hours=1, minutes=30, seconds=0)
        
        # Create a first workout session
        self.workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, calories_burned=120.5, duration=self.duration)
        
        # Add an exercise session and a set
        self.exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.workout_session)
        self.set = Set.objects.create(exercise_session=self.exercise_session, repetitions=10, weight=50)
        
        # Create a second workout session
        self.second_workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, calories_burned=150.0, duration=timedelta(hours=1, minutes=45, seconds=30))
        
        self.second_exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.second_workout_session)
        self.second_set = Set.objects.create(exercise_session=self.second_exercise_session, repetitions=10, weight=55)
        
        self.url = reverse("workout_session-list")
        
        self.workout_sessions = [self.workout_session, self.second_workout_session]
        
        
    def test_list_workout_sessions_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = WorkoutSessionSerializer(self.workout_sessions, many=True)
        
        self.assertEqual(len(response.data), len(self.workout_sessions))
        self.assertEqual(response.data, serializer.data)
    
    def test_list_other_user_workout_sessions(self):
        second_user = User.objects.create_user(username="secondUser", password="password")
        
        self.client.force_authenticate(user=second_user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return empty since this user has not performed any workout sessions
        self.assertEqual(len(response.data), 0)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
