
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from backend.models import UserProfile, PersonalTrainerProfile, Exercise, Workout
from backend.serializers import ExerciseSerializer

class CreateUserViewTest(APITestCase):
    
    def test_create_user(self):
        url = reverse('register_user')
        
        username = "testUser"
        password = "testPassword"
        height = 180
        weight = 75
        
        data = {
            "username": username,
            "password": password,
            "profile": {
                "height": height,
                "weight": weight
            }
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
       
       # Check if the user was created
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, username)
        
        #  Retrieve the user object
        user = User.objects.get(username=username)
        
        # Check if the profile was created and linked to the user
        self.assertEqual(UserProfile.objects.count(), 1)
        profile = UserProfile.objects.get(user=user)
        
        # Validate the profile fields
        self.assertEqual(profile.height, height)
        self.assertEqual(profile.weight, weight)
        
    def test_create_duplicate_username(self):
        url = reverse('register_user')
        
        username = "duplicateUsername"
        password = "testPassword"
        height = 180
        weight = 75
        
        data = {
            "username": username,
            "password": password,
            "profile": {
                "height": height,
                "weight": weight
            }
        }
        
        first_response = self.client.post(url, data, format='json')
        second_response = self.client.post(url, data, format='json')
        
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        
        self.assertEqual(User.objects.count(), 1)
    
    def test_create_user_without_information(self):
        url = reverse('register_user')
        
        data = {
            "username": "testuser",
            # Missing password and profile information
        }
        
        # Make a post request with the missing data
        response = self.client.post(url, data, format='json')
        
        # Make sure that the response status code is 400 BAD REQUEST
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Make sure that no user was created
        self.assertEqual(User.objects.count(), 0)
    
    def test_create_user_does_not_return_password(self):
        url = reverse('register_user')
        
        # Create a generic user
        username = "testUser"
        password = "testPassword"
        height = 180
        weight = 75
        
        data = {
            "username": username,
            "password": password,
            "profile": {
                "height": height,
                "weight": weight
            }
        }
    
        response = self.client.post(url, data, format='json')
        
        # Verify that the response does not contain the password field
        self.assertNotIn("password", response.data)
        

class CreatePersonalTrainerViewTest(APITestCase):
        def test_create_personal_trainer(self):
            url = reverse('register_personal_trainer')
            
            username = "testTrainer"
            password = "testPassword"
            experience = "5 Years"
            
            data = {
                "username": username,
                "password": password,
                "trainer_profile": {
                    "experience": experience
                }
            }
            
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            
            # Check if the user was created
            self.assertEqual(User.objects.count(), 1)
            self.assertEqual(User.objects.get().username, username)
            
            #  Retrieve the user object
            user = User.objects.get(username=username)
            
            # Check if the profile was created and linked to the user
            self.assertEqual(PersonalTrainerProfile.objects.count(), 1)
            profile = PersonalTrainerProfile.objects.get(user=user)
            
            # Validate the profile fields
            self.assertEqual(profile.experience, experience)


class ExerciseListViewTest(APITestCase):
    
    def setUp(self):
        # Create a user object
        create_user_url = reverse('register_user')
        
        username = "testUser"
        password = "testPassword"
        height = 180
        weight = 75
        
        data = {
            "username": username,
            "password": password,
            "profile": {
                "height": height,
                "weight": weight
            }
        }
        
        self.client.post(create_user_url, data, format='json')
        self.user = User.objects.get(username=username)
        
    
    
    def test_unauthenticated_user_do_not_have_access(self):
        url = reverse("exercise-list")
        response = self.client.get(url)
        
        # Unauthenticated users should not be able to get the list of exercises
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_correct_queryset_is_returned(self):
        url = reverse("exercise-list")
        
        # Create some test exercises
        Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")

        # Retrieve a user object and force authenticate it
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Retrieve the exercises and convert it to the same format as the response using the serializer
        exercises = Exercise.objects.all()
        serializer = ExerciseSerializer(exercises, many=True)
        
        # Make sure that the queryset returned contains all exercises
        self.assertEqual(response.data, serializer.data)

class CreateWorkoutViewTest(APITestCase):
    def setUp(self):
        create_user_url = reverse('register_user')
        
        username = "testUser"
        password = "testPassword"
        height = 180
        weight = 75
        
        data = {
            "username": username,
            "password": password,
            "profile": {
                "height": height,
                "weight": weight
            }
        }
        
        # Create some test exercises
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")
        
        self.client.post(create_user_url, data, format='json')
        self.user = User.objects.get(username=username)
    
    def test_unauthenticated_user_do_not_have_access(self):
        url = reverse("workout-create")
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_workout_basic(self):
        url = reverse("workout-create")
        workout_name = "Test Workout"
        
        self.client.force_authenticate(user=self.user)
        
        # Data for creating a workout
        data = {
            "name": workout_name,
            "exercises": [self.first_exercise.id, self.second_exercise.id]
        }
    
        # Make the POST request
        response = self.client.post(url, data=data, format='json')
        
        # Verify that the workout was created and verify the attribute values
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Workout.objects.count(), 1)
    
        workout = Workout.objects.get(id=response.data["id"])
        self.assertEqual(workout.author, self.user)
        self.assertEqual(workout.name, workout_name)


class TestWorkoutDeleteView(APITestCase):
    def setUp(self):
        create_user_url = reverse('register_user')
        
        username = "testUser"
        password = "testPassword"
        height = 180
        weight = 75
        
        user_data = {
            "username": username,
            "password": password,
            "profile": {
                "height": height,
                "weight": weight
            }
        }
        
        self.client.post(create_user_url, user_data, format='json')
        self.user = User.objects.get(username=username)
        
        # Create some test exercises
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")
        
        create_workout_url = reverse('workout-create')
        workout_name = "Test Workout"
        
        workout_data = {
            "name": workout_name,
            "exercises": [self.first_exercise.id, self.second_exercise.id]
        }
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post(create_workout_url, data=workout_data, format='json')
        self.workout = Workout.objects.get(id=response.data["id"])
        
        
    def test_delete_workout_basic(self):
        url = reverse("workout-delete", kwargs={"pk": self.workout.id})
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertNotIn(self.workout, Workout.objects.all())  
    
    def test_delete_non_existent_workout(self):
        invalid_url = reverse("workout-delete", kwargs={"pk": 100})
        
        # Try to delete a workout that does not exist
        response = self.client.delete(invalid_url)
        
        # Should not find the workout
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Make sure that the workout we stored earlier still exists
        self.assertIn(self.workout, Workout.objects.all())
    
    def test_delete_other_users_workout(self):
        url = reverse("workout-delete", kwargs={"pk": self.workout.id})
        
        # Create a second user
        create_user_url = reverse('register_user')
        
        username = "secondTestUser"
        password = "testPassword"
        height = 200
        weight = 100
        
        user_data = {
            "username": username,
            "password": password,
            "profile": {
                "height": height,
                "weight": weight
            }
        }
        
        self.client.post(create_user_url, user_data, format='json')
        secondUser = User.objects.get(username=username)
        self.client.force_authenticate(user=secondUser)
        
        # Try do delete the workout that was created by the first user
        response = self.client.delete(url)
        
        # Since the queryset is filtered based on the user making the request, the view should not find the specific workout
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Make sure that the workout stored earlier still exists
        self.assertIn(self.workout, Workout.objects.all())
        

# Views to test: listWorkout, workoutDetail, updateWorkout

# List workout: normal check, check that others workouts are not listed
# workoutDetail: check that the details are correct, check that you can not see the details of others workouts, check what happens if you try to find the details of a non-existent workout
# updateWorkout: check that you can update your own workout, check that you can not update others workouts, what happens if yoou try to update a non-existent workout

        
        
        
        
        
        
        
        
    
        
        
        
        
        
        
    
    
        
    

