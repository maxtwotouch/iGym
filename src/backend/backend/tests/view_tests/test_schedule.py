from django.urls import reverse
from rest_framework import status
from backend.models import Workout, ScheduledWorkout, PersonalTrainerProfile, UserProfile, PersonalTrainerScheduledWorkout
from backend.serializers import  ScheduledWorkoutSerializer, PersonalTrainerScheduledWorkoutSerializer
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from django.utils.timezone import now
from datetime import timedelta

class TestCreateScheduledWorkoutView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.scheduled_date = now() + timedelta(days=1)
        
        self.url = reverse("scheduled_workout-create")
    
    def test_create_scheduled_workout_basic(self):
        self.client.force_authenticate(user=self.user)
        
        data = {
            "workout_template": self.workout.id,
            "scheduled_date": self.scheduled_date
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.assertEqual(ScheduledWorkout.objects.count(), 1)
        
        scheduled_workout = ScheduledWorkout.objects.get(id=response.data["id"])
        
        self.assertEqual(scheduled_workout.user, self.user)
        self.assertEqual(scheduled_workout.scheduled_date, self.scheduled_date)
        self.assertEqual(scheduled_workout.workout_template, self.workout)
    
    def test_unauthenticated_user_do_not_have_access(self):
        data = {
            "workout_template": self.workout.id,
            "scheduled_date": self.scheduled_date
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestScheduledWorkoutsListView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        
        self.first_scheduled_date = now() + timedelta(days=1)
        self.first_scheduled_workout = ScheduledWorkout.objects.create(workout_template=self.workout, scheduled_date=self.first_scheduled_date, user=self.user)
        
        self.second_workout = Workout.objects.create(name="second test workout", author=self.user)
        self.second_scheduled_date = now() + timedelta(days=3)
        self.second_scheduled_workout = ScheduledWorkout.objects.create(workout_template=self.second_workout, scheduled_date=self.second_scheduled_date, user=self.user)
        
        self.third_scheduled_date = now() + timedelta(days=4)
        self.third_scheduled_workout = ScheduledWorkout.objects.create(workout_template=self.workout, scheduled_date=self.third_scheduled_date, user=self.user)
        
        self.scheduled_workouts = [self.first_scheduled_workout, self.second_scheduled_workout, self.third_scheduled_workout]
        
        self.url = reverse("scheduled_workouts-list")
        
    def test_list_scheduled_workouts_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = ScheduledWorkoutSerializer(self.scheduled_workouts, many=True)
        
        self.assertEqual(len(response.data), len(self.scheduled_workouts))
        self.assertEqual(response.data, serializer.data)
        
    def test_user_without_scheduled_workouts(self):
        second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.client.force_authenticate(user=second_user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(len(response.data), 0)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestCreatePersonalTrainerScheduleWorkoutView(APITestCase):
    def setUp(self):
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, personal_trainer=self.trainer_profile)
        
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.scheduled_date = now() + timedelta(days=1)
        
        self.url = reverse("pt_scheduled_workout-create")
    
    def test_create_personal_trainer_scheduled_workout_basic(self):
        self.client.force_authenticate(user=self.trainer)
        
        data = {
            "client": self.user.id,
            "pt": self.trainer.id,
            "workout_template": self.workout.id,
            "scheduled_date": self.scheduled_date
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout.objects.get(id=response.data["id"])
        
        self.assertEqual(personal_trainer_scheduled_workout.client, self.user)
        self.assertEqual(personal_trainer_scheduled_workout.pt, self.trainer)
        self.assertEqual(personal_trainer_scheduled_workout.workout_template, self.workout)
        self.assertEqual(personal_trainer_scheduled_workout.scheduled_date, self.scheduled_date)
    
    def test_create_personal_trainer_scheduled_workout_with_wrong_user_type(self):
        user = User.objects.create_user(username="wrongUser", password="password")
        user_profile = PersonalTrainerProfile.objects.create(user=user)
        
        self.client.force_authenticate(user=self.trainer)
        
        data = {
            "client": user.id,
            "pt": self.trainer.id,
            "workout_template": self.workout.id,
            "scheduled_date": self.scheduled_date
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_create_personal_trainer_scheduled_workout_with_wrong_pt_type(self):
        trainer = User.objects.create_user(username="wrongTrainer", password="password")
        trainer_profile = UserProfile.objects.create(user=trainer)
        
        self.client.force_authenticate(user=trainer)
        
        data = {
            "client": self.user.id,
            "pt": trainer.id,
            "workout_template": self.workout.id,
            "scheduled_date": self.scheduled_date
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_user_create_personal_trainer_scheduled_workout_with_pt(self):
        self.client.force_authenticate(user=self.user)
        
        data = {
            "client": self.user.id,
            "pt": self.trainer.id,
            "workout_template": self.workout.id,
            "scheduled_date": self.scheduled_date
        }
        
        # Only personal trainers should be able to create scheduled workouts between the pt and the client
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_personal_trainer_scheduled_workout_with_client_not_a_client_of_pt(self):
        # Create a user that does not have self.trainer as personal trainer
        user = User.objects.create_user(username="secondTestUser", password="password")
        user_profile = UserProfile.objects.create(user=user)
        
        self.client.force_authenticate(user=self.trainer)
        
        data = {
            "client": user.id,
            "pt": self.trainer.id,
            "workout_template": self.workout.id,
            "scheduled_date": self.scheduled_date
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_user_do_not_have_access(self):
        data = {
            "client": self.user.id,
            "pt": self.trainer.id,
            "workout_template": self.workout.id,
            "scheduled_date": self.scheduled_date
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class TestPersonalTrainerScheduledWorkoutListView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.second_user_profile = UserProfile.objects.create(user=self.second_user)
        
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.user_profile.personal_trainer = self.trainer_profile
        self.second_user_profile.personal_trainer = self.trainer_profile
        
        self.workout = Workout.objects.create(name="test workout", author=self.user)
       
        self.scheduled_date = now() + timedelta(days=1)
        self.second_scheduled_date = now() + timedelta(days=2)
        self.third_scheduled_date = now() + timedelta(days=3)
        
        self.personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout.objects.create(client=self.user, pt=self.trainer, workout_template=self.workout, scheduled_date=self.scheduled_date)
        self.second_personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout.objects.create(client=self.second_user, pt=self.trainer, workout_template=self.workout, scheduled_date=self.second_scheduled_date)
        self.third_personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout.objects.create(client=self.user, pt=self.trainer, workout_template=self.workout, scheduled_date=self.third_scheduled_date)
        
        self.trainer_scheduled_workouts = [self.personal_trainer_scheduled_workout, self.second_personal_trainer_scheduled_workout, self.third_personal_trainer_scheduled_workout]
        self.user_scheduled_workouts = [self.personal_trainer_scheduled_workout, self.third_personal_trainer_scheduled_workout]
        
        self.url = reverse("pt_scheduled_workouts-list")
    
    def test_list_personal_trainer_scheduled_workouts_user(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = PersonalTrainerScheduledWorkoutSerializer(self.user_scheduled_workouts, many=True)
        
        self.assertEqual(len(response.data), len(self.user_scheduled_workouts))
        self.assertEqual(response.data, serializer.data)
        
    def test_list_personal_trainer_scheduled_workouts_trainer(self):
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = PersonalTrainerScheduledWorkoutSerializer(self.trainer_scheduled_workouts, many=True)
        
        self.assertEqual(len(response.data), len(self.trainer_scheduled_workouts))
        self.assertEqual(response.data, serializer.data)

    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class TestPersonalTrainerScheduledWorkoutDeleteView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.user_profile.personal_trainer = self.trainer_profile
        
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.scheduled_date = now() + timedelta(days=1)
                
        self.personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout.objects.create(client=self.user, pt=self.trainer, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        self.url = reverse("pt_scheduled_workout-delete", kwargs={"pk": self.personal_trainer_scheduled_workout.id})
        
    def test_delete_personal_trainer_scheduled_workout_basic(self):
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        self.assertEqual(PersonalTrainerScheduledWorkout.objects.count(), 0)
        
    def test_user_delete_personal_trainer_scheduled_workout(self):
        self.client.force_authenticate(user=self.user)
        
        # The client should not be able to delete scheduled workouts with the personal trainer
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        self.assertIn(self.personal_trainer_scheduled_workout, PersonalTrainerScheduledWorkout.objects.all())
    
    def test_delete_non_existent_personal_trainer_scheduled_workout(self):
        invalid_url = reverse("pt_scheduled_workout-delete", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.delete(invalid_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        self.assertIn(self.personal_trainer_scheduled_workout, PersonalTrainerScheduledWorkout.objects.all())
    
    def test_cannot_delete_others_personal_trainer_scheduled_workouts(self):
        trainer = User.objects.create_user(username="someTrainer", password="password")
        trainer_profile = PersonalTrainerProfile.objects.create(user=trainer)
        
        self.client.force_authenticate(user=trainer)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        self.assertIn(self.personal_trainer_scheduled_workout, PersonalTrainerScheduledWorkout.objects.all())
        
