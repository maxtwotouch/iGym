from django.urls import reverse
from rest_framework import status
from backend.models import Workout, WorkoutSession, ExerciseSession, Exercise, Set, UserProfile, PersonalTrainerProfile, ScheduledWorkout
from backend.serializers import  WorkoutSessionSerializer, PersonalTrainerSerializer, DefaultUserSerializer, ScheduledWorkoutSerializer, WorkoutSerializer
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from django.utils.timezone import now
from datetime import timedelta

class TestListPersonalTrainerView(APITestCase):
    def setUp(self):
        self.trainer = User.objects.create(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer, experience="5 years")
        self.second_trainer = User.objects.create(username="secondTestTrainer", password="password")
        self.second_trainer_profile = PersonalTrainerProfile.objects.create(user=self.second_trainer, experience="10 years")
        
        self.url = reverse("personal_trainer-list")
        self.trainers = [self.trainer, self.second_trainer]
    
    def test_list_personal_trainer_basic(self):
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = PersonalTrainerSerializer(self.trainers, many=True)
        
        self.assertEqual(len(response.data), len(self.trainers))
        self.assertEqual(response.data, serializer.data)
        

    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_personal_trainer_does_not_list_user(self):
        # Create a user
        user = User.objects.create(username="testuser", password="password")
        user_profile = UserProfile.objects.create(user=user, height=180, weight=75)
        
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Make sure that the queryset did not return the user
        self.assertEqual(len(response.data), len(self.trainers))
        self.assertNotIn(user.username, [trainer['username'] for trainer in response.data])

class TestPersonalTrainerDetailView(APITestCase):
    def setUp(self):
        self.trainer = User.objects.create(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer, experience="5 years")
        
        self.url = reverse("personal_trainer-detail", kwargs={"pk": self.trainer.id})
    
    def test_personal_trainer_detail_basic(self):
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = PersonalTrainerSerializer(self.trainer)
        self.assertEqual(response.data, serializer.data)
    
    def test_user_see_detail_of_other_trainer(self):
        self.user = User.objects.create(username="testuser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, height=180, weight=75)
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        serializer = PersonalTrainerSerializer(self.trainer)
        self.assertEqual(response.data, serializer.data)
    
    def test_personal_trainer_detail_non_existent_trainer(self):
        url = reverse("personal_trainer-detail", kwargs={"pk": 9999})
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(url)
        
        # Should not find the trainer
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_user_do_not_have_access(self):
        # Remove the authentication
        self.client.force_authenticate(user=None)
        
        response = self.client.get(self.url)
        # Check that the response status code is 401 UNAUTHORIZED
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestUpdatePersonalTrainerView(APITestCase):
    def setUp(self):
        self.trainer = User.objects.create_user(username="testtrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer, experience="5 years")
        
        self.url = reverse("personal_trainer-update", kwargs={"pk": self.trainer.id})
    
    def test_update_personal_trainer_basic(self):
        self.client.force_authenticate(user=self.trainer)
        
        new_data = {
            "trainer_profile": {
                "experience": "7 years"
            }
        }
        
        response = self.client.patch(self.url, data=new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        updated_trainer = PersonalTrainerProfile.objects.get(id=self.trainer_profile.id)
        
        self.assertEqual(updated_trainer.experience, "7 years")
    
    def test_update_other_personal_trainer(self):
        second_trainer = User.objects.create(username="secondTrainer", password="password")
        
        self.client.force_authenticate(user=second_trainer)
        
        new_data = {
            "trainer_profile": {
                "experience": "7 years"
            }
        }
        
        response = self.client.patch(self.url, data=new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        original_trainer = PersonalTrainerProfile.objects.get(id=self.trainer_profile.id)
        
        self.assertEqual(original_trainer.experience, "5 years")
    
    def test_unauthenticated_trainer_do_not_have_access(self):
        new_data = {
            "trainer_profile": {
                "experience": "7 years"
            }
        }
        response = self.client.patch(self.url, data=new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestListClientsView(APITestCase):
    def setUp(self):
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer, experience="5 years")
        
        # Create some clients for the personal trainer
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, personal_trainer=self.trainer_profile)
        
        self.second_user = User.objects.create_user(username="secondUser", password="password")
        self.second_user_profile = UserProfile.objects.create(user=self.second_user, personal_trainer=self.trainer_profile)
        
        self.third_user = User.objects.create_user(username="thirdUser", password="password")
        self.third_user_profile = UserProfile.objects.create(user=self.third_user, personal_trainer=self.trainer_profile)
        
        self.clients = [self.user, self.second_user, self.third_user]
        
        self.url = reverse("clients-list")
    
        
    def test_list_clients_basic(self):
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = DefaultUserSerializer(self.clients, many=True)
        
        self.assertEqual(len(response.data), len(self.clients))
        self.assertEqual(response.data, serializer.data)
    
    def test_cannot_list_other_trainers_clients(self):
        second_trainer = User.objects.create_user(username="secondTrainer", password="password")
        
        self.client.force_authenticate(user=second_trainer)
        
        response = self.client.get(self.url)
        
        # The request should go through, but not return anything since the trainer has no clients 
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
        
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class TestListScheduledWorkoutsOfClients(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testClient", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        # Assign the personal trainer
        self.user_profile.personal_trainer = self.trainer_profile
        self.user_profile.save()
        
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        
        self.first_scheduled_date = now() + timedelta(days=1)
        self.first_scheduled_workout = ScheduledWorkout.objects.create(workout_template=self.workout, scheduled_date=self.first_scheduled_date, user=self.user)
        
        self.second_workout = Workout.objects.create(name="second test workout", author=self.user)
        self.second_scheduled_date = now() + timedelta(days=3)
        self.second_scheduled_workout = ScheduledWorkout.objects.create(workout_template=self.second_workout, scheduled_date=self.second_scheduled_date, user=self.user)
        
        self.third_scheduled_date = now() + timedelta(days=4)
        self.third_scheduled_workout = ScheduledWorkout.objects.create(workout_template=self.workout, scheduled_date=self.third_scheduled_date, user=self.user)
        
        self.user_scheduled_workouts = [self.first_scheduled_workout, self.second_scheduled_workout, self.third_scheduled_workout]
        
        self.url = reverse("client-scheduled_workouts-list", kwargs={"pk": self.user.id})
        
    def test_list_scheduled_workouts_of_clients_basic(self):
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = ScheduledWorkoutSerializer(self.user_scheduled_workouts, many=True)
        
        self.assertEqual(len(response.data), len(self.user_scheduled_workouts))
        self.assertEqual(response.data, serializer.data)
        
    def test_list_scheduled_workouts_of_non_client(self):
        # Create a personal trainer that does not have the user as client
        second_trainer = User.objects.create_user(username="secondTestTrainer", password="password")
        second_trainer_profile = PersonalTrainerProfile(user=second_trainer)
        
        self.client.force_authenticate(user=second_trainer)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code,  status.HTTP_400_BAD_REQUEST)
    
    def test_list_scheduled_workouts_of_non_existent_client(self):
        url = reverse("client-scheduled_workouts-list", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_user_cannot_pretend_to_be_a_personal_trainer(self):
        user = User.objects.create_user(username="someUser", password="password")
        user_profile = UserProfile.objects.create(user=user)
        
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class TestListWorkoutSessionsOfClientsView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.user_profile.personal_trainer = self.trainer_profile
        self.user_profile.save()
        
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.workout.exercises.set([self.exercise])
        
        self.duration = timedelta(hours=1, minutes=30, seconds=0)
        
        self.workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, calories_burned=120.5, duration=self.duration)
        self.exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.workout_session)
        self.set = Set.objects.create(exercise_session=self.exercise_session, repetitions=10, weight=50)

        self.second_workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, calories_burned=150.0, duration=timedelta(hours=1, minutes=45, seconds=30))
        self.second_exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.second_workout_session)
        self.second_set = Set.objects.create(exercise_session=self.second_exercise_session, repetitions=10, weight=55)
        
        self.url = reverse("client-workout_sessions-list", kwargs={"pk": self.user.id})
        
        self.client_workout_sessions = [self.workout_session, self.second_workout_session]
    
    def test_list_workout_sessions_of_client_basic(self):
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = WorkoutSessionSerializer(self.client_workout_sessions, many=True)
        
        self.assertEqual(len(response.data), len(self.client_workout_sessions))
        self.assertEqual(response.data, serializer.data)
    
    def test_list_workout_sessions_of_non_client(self):
        second_trainer = User.objects.create_user(username="secondTestTrainer", password="password")
        second_trainer_profile = PersonalTrainerProfile(user=second_trainer)
        
        self.client.force_authenticate(user=second_trainer)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    
    def test_list_workout_sessions_of_non_existent_client(self):
        url = reverse("client-workout_sessions-list", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_user_cannot_pretend_to_be_a_personal_trainer(self):
        user = User.objects.create_user(username="someUser", password="password")
        user_profile = UserProfile.objects.create(user=user)
        
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class TestListWorkoutsOfClientsListView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.user_profile.personal_trainer = self.trainer_profile
        self.user_profile.save()
        
        # Create some test exercises for the first workout
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")

        # Create some test exercises for the second workout
        self.third_exercise = Exercise.objects.create(name="Bench Press", description="A classic chest exercise.", muscle_group="Chest")
        self.fourth_exercise = Exercise.objects.create(name="Deadlift", description="A lower body exercise.", muscle_group="Legs")
        self.fifth_exercise = Exercise.objects.create(name="Pull-up", description="An upper body exercise.", muscle_group="Back")
        self.sixth_exercise = Exercise.objects.create(name="Leg Press", description="A lower body exercise.", muscle_group="Legs")
        
        self.first_workout = Workout.objects.create(name="first test workout", author=self.user)
        self.first_workout.exercises.set([self.first_exercise, self.second_exercise])
        self.first_workout.owners.add(self.user)
        
        # Create a workout that the client is not a author of
        self.second_workout = Workout.objects.create(name="second test workout", author=self.second_user)
        self.second_workout.exercises.set([self.third_exercise, self.fourth_exercise, self.fifth_exercise, self.sixth_exercise])
        self.second_workout.owners.add(self.user)
        
        self.workouts = [self.first_workout, self.second_workout]
        
        self.url = reverse("client-workouts-list", kwargs={"pk": self.user.id})
        
    def test_list_workouts_of_client_basic(self):
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = WorkoutSerializer(self.workouts, many=True)
        
        self.assertEqual(len(response.data), len(self.workouts))
        self.assertEqual(response.data, serializer.data)
    
    def test_list_workouts_of_non_client(self):
        second_trainer = User.objects.create_user(username="secondTestTrainer", password="password")
        second_trainer_profile = PersonalTrainerProfile(user=second_trainer)
        
        self.client.force_authenticate(user=second_trainer)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_list_workouts_of_non_existent_client(self):
        url = reverse("client-workouts-list", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_user_cannot_pretend_to_be_a_personal_trainer(self):
        user = User.objects.create_user("someUser", password="password")
        user_profile = UserProfile.objects.create(user=user)
        
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
