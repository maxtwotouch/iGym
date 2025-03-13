
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from backend.models import UserProfile, PersonalTrainerProfile, Exercise, Workout, WorkoutSession, ExerciseSession, Set
from backend.serializers import ExerciseSerializer, WorkoutSerializer

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

class TestListWorkout(APITestCase):
    def setUp(self):
        create_user_url = reverse('register_user')
        
        # Create a user

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

        # Create a second user

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
        self.secondUser = User.objects.get(username=username)
        
        # Create some test exercises for the first workout
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest", calories=0.8)
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs", calories=1.0)

        # Create some test exercises for the second workout
        self.third_exercise = Exercise.objects.create(name="Bench Press", description="A classic chest exercise.", muscle_group="Chest", calories=1.2)
        self.fourth_exercise = Exercise.objects.create(name="Deadlift", description="A lower body exercise.", muscle_group="Legs", calories=1.5)

        # Create some test exercises for the third workout
        self.fifth_exercise = Exercise.objects.create(name="Pull-up", description="An upper body exercise.", muscle_group="Back", calories=1.0)
        self.sixth_exercise = Exercise.objects.create(name="Leg Press", description="A lower body exercise.", muscle_group="Legs", calories=1.2)

        create_workout_url = reverse('workout-create')
        workout1_name = "Test Workout"
        workout2_name = "Second Test Workout"
        workout3_name = "Third Test Workout"
        
        workout1_data = {
            "name": workout1_name,
            "exercises": [self.first_exercise.id, self.second_exercise.id]
        }

        workout2_data = {
            "name": workout2_name,
            "exercises": [self.third_exercise.id, self.fourth_exercise.id]
        }

        workout3_data = {
            "name": workout3_name,
            "exercises": [self.fifth_exercise.id, self.sixth_exercise.id]
        }
        
        # Authenticate the first user
        self.client.force_authenticate(user=self.user)

        # Store the workouts of the first user in a list
        self.workouts = []
        
        # Push two workouts for the first user
        response = self.client.post(create_workout_url, data=workout1_data, format='json')
        self.workouts.append(Workout.objects.get(id=response.data["id"]))
        response = self.client.post(create_workout_url, data=workout2_data, format='json')
        self.workouts.append(Workout.objects.get(id=response.data["id"]))

        # Authenticate the second user
        self.client.force_authenticate(user=self.secondUser)

        # Push a workout for the second user
        response = self.client.post(create_workout_url, data=workout3_data, format='json')
        self.secondUserWorkout = Workout.objects.get(id=response.data["id"])
        
    # Test that the list view returns only the workouts of the authenticated user
    def test_list_workout_basic(self):
        # URL for the list view
        url = reverse("workout-list")
        
        # Authenticate the user
        self.client.force_authenticate(user=self.user)
        
        # Make a GET request to the list view
        response = self.client.get(url)
        # Check that the response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Retrieve the workouts and convert it to the same format as the response using the serializer
        serializer = WorkoutSerializer(self.workouts, many=True)

        # Check that the queryset returned the right number of workouts
        self.assertEqual(len(response.data), len(self.workouts))

        # Check that the queryset returned contains all workouts for the first user
        self.assertEqual(response.data, serializer.data)

        # Authenticate the second user
        self.client.force_authenticate(user=self.secondUser)

        # Make a GET request to the list view
        response = self.client.get(url)

        # Check that the response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Retrieve the workouts and convert it to the same format as the response using the serializer
        serializer = WorkoutSerializer([self.secondUserWorkout], many=True)

        # Check that the queryset returned the right number of workouts
        self.assertEqual(len(response.data), 1)

        # Check that the queryset returned contains all workouts for the second user
        self.assertEqual(response.data, serializer.data)

    # Test that a user without any workouts does not get any workouts returned
    def test_user_without_workouts(self):
        # URL for the list view
        url = reverse("workout-list")

        # Create a user without any workouts
        create_user_url = reverse('register_user')

        username = "noWorkoutUser"
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
        noWorkoutUser = User.objects.get(username=username)
        
        # Authenticate the user
        self.client.force_authenticate(user=noWorkoutUser)
        
        # Make a GET request to the list view
        response = self.client.get(url)
        # Check that the response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that the queryset returned is empty
        self.assertEqual(len(response.data), 0)

    # Check that an unauthenticated user does not get any workouts returned
    def test_unauthenticated_user_do_not_have_access(self):
        # URL for the list view
        url = reverse("workout-list")

        # Remove the authentication
        self.client.force_authenticate(user=None)
        
        # Make a GET request to the list view
        response = self.client.get(url)
        # Check that the response status code is 401 UNAUTHORIZED
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestWorkoutDetail(APITestCase):
    def setUp(self):
        create_user_url = reverse('register_user')
        
        # Create a user
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

        # Create a second user
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
        self.secondUser = User.objects.get(username=username)

        # Create some test exercises for the first workout
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest", calories=0.8)
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs", calories=1.0)

        # Create some test exercises for the second workout
        self.third_exercise = Exercise.objects.create(name="Bench Press", description="A classic chest exercise.", muscle_group="Chest", calories=1.2)
        self.fourth_exercise = Exercise.objects.create(name="Deadlift", description="A lower body exercise.", muscle_group="Legs", calories=1.5)

        # Create the workouts
        create_workout_url = reverse('workout-create')
        workout1_name = "Test Workout"
        workout2_name = "Second Test Workout"

        workout1_data = {
            "name": workout1_name,
            "exercises": [self.first_exercise.id, self.second_exercise.id]
        }

        workout2_data = {
            "name": workout2_name,
            "exercises": [self.third_exercise.id, self.fourth_exercise.id]
        }

        # Authenticate the first user
        self.client.force_authenticate(user=self.user)

        response = self.client.post(create_workout_url, data=workout1_data, format='json')
        self.firstWorkout = Workout.objects.get(id=response.data["id"])

        response = self.client.post(create_workout_url, data=workout2_data, format='json')
        self.secondWorkout = Workout.objects.get(id=response.data["id"])

    # Test that the detail view returns the correct workout
    def test_workout_detail_basic(self):
        # URL for the detail view
        url = reverse("get-workout", kwargs={"pk": self.firstWorkout.id})

        # Authenticate the user
        self.client.force_authenticate(user=self.user)

        # Make a GET request to the detail view
        response = self.client.get(url)
        # Check that the response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Retrieve the workout and convert it to the same format as the response using the serializer
        serializer = WorkoutSerializer(self.firstWorkout)

        # Check that the queryset returned contains the correct workout
        self.assertEqual(response.data, serializer.data)

        # Get the second workout
        url = reverse("get-workout", kwargs={"pk": self.secondWorkout.id})

        # Make a GET request to the detail view
        response = self.client.get(url)

        # Retrieve the workout and convert it to the same format as the response using the serializer
        serializer = WorkoutSerializer(self.secondWorkout)

        # Check that the queryset returned contains the correct workout
        self.assertEqual(response.data, serializer.data)

    # Test that a user can not see the details of another user's workout
    def test_workout_detail_other_users_workout(self):
       # URL for the detail view
        url = reverse("get-workout", kwargs={"pk": self.firstWorkout.id})

        # Authenticate the second user
        self.client.force_authenticate(user=self.secondUser)

        # Make a GET request to the detail view
        response = self.client.get(url)
        # Check that the response status code is 404 NOT FOUND
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Test that a request for a non-existent workout returns 404 NOT FOUND
    def test_workout_detail_non_existent_workout(self):
        # URL for the detail view
        url = reverse("get-workout", kwargs={"pk": 100})

        # Authenticate the user
        self.client.force_authenticate(user=self.user)

        # Make a GET request to the detail view
        response = self.client.get(url)
        # Check that the response status code is 404 NOT FOUND
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Test that an unauthenticated user does not get any workouts returned
    def test_unauthenticated_user_do_not_have_access(self):
        # URL for the detail view
        url = reverse("get-workout", kwargs={"pk": self.firstWorkout.id})

        # Remove the authentication
        self.client.force_authenticate(user=None)

        # Make a GET request to the detail view
        response = self.client.get(url)
        # Check that the response status code is 401 UNAUTHORIZED
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestUpdateWorkout(APITestCase):
    def setUp(self):
        create_user_url = reverse('register_user')
        
        # Create a user
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

        # Create a second user
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
        self.secondUser = User.objects.get(username=username)

        # Create some test exercises for the first workout
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest", calories=0.8)
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs", calories=1.0)

        # Create some test exercises for the second workout
        self.third_exercise = Exercise.objects.create(name="Bench Press", description="A classic chest exercise.", muscle_group="Chest", calories=1.2)
        self.fourth_exercise = Exercise.objects.create(name="Deadlift", description="A lower body exercise.", muscle_group="Legs", calories=1.5)

        # Create the workouts
        create_workout_url = reverse('workout-create')
        workout1_name = "Test Workout"
        workout2_name = "Second Test Workout"

        workout1_data = {
            "name": workout1_name,
            "exercises": [self.first_exercise.id, self.second_exercise.id]
        }

        workout2_data = {
            "name": workout2_name,
            "exercises": [self.third_exercise.id, self.fourth_exercise.id]
        }

        # Authenticate the first user
        self.client.force_authenticate(user=self.user)

        # Create two workouts for the first user
        response = self.client.post(create_workout_url, data=workout1_data, format='json')
        self.firstWorkout = Workout.objects.get(id=response.data["id"])

        response = self.client.post(create_workout_url, data=workout2_data, format='json')
        self.secondWorkout = Workout.objects.get(id=response.data["id"])

    # Test that a user can update their own workout
    def test_update_workout_basic(self):
        # URL for the update view
        url = reverse("workout-update", kwargs={"pk": self.firstWorkout.id})

        # Authenticate the user
        self.client.force_authenticate(user=self.user)

        # Data for updating the workout
        data = {
            "name": "Updated Workout",
            "exercises": [self.first_exercise.id]
        }

        # Make a PUT request to the update view
        response = self.client.put(url, data=data, format='json')
        # Check that the response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Retrieve the updated workout
        updatedWorkout = Workout.objects.get(id=self.firstWorkout.id)

        # Check that the attributes of the workout have been updated
        self.assertEqual(updatedWorkout.name, data["name"])
        self.assertEqual(list(updatedWorkout.exercises.all()), [self.first_exercise])

    # Test that a user can not update another user's workout
    def test_update_other_users_workout(self):
        # URL for the update view
        url = reverse("workout-update", kwargs={"pk": self.firstWorkout.id})

        # Authenticate the second user
        self.client.force_authenticate(user=self.secondUser)

        # Data for updating the workout
        data = {
            "name": "Updated Workout",
            "exercises": [self.first_exercise.id]
        }

        # Make a PUT request to the update view
        response = self.client.put(url, data=data, format='json')
        # Check that the response status code is 404 NOT FOUND
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Retrieve the original workout
        originalWorkout = Workout.objects.get(id=self.firstWorkout.id)

        # Check that the attributes of the workout have not been updated
        self.assertEqual(originalWorkout.name, self.firstWorkout.name)
        self.assertEqual(list(originalWorkout.exercises.all()), [self.first_exercise, self.second_exercise])

    # Test that a request for a non-existent workout returns 404 NOT FOUND
    def test_update_non_existent_workout(self):
        # URL for the update view
        url = reverse("workout-update", kwargs={"pk": 100})

        # Authenticate the user
        self.client.force_authenticate(user=self.user)

        # Data for updating the workout
        data = {
            "name": "Updated Workout",
            "exercises": [self.first_exercise.id]
        }

        # Make a PUT request to the update view
        response = self.client.put(url, data=data, format='json')
        # Check that the response status code is 404 NOT FOUND
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Test that an unauthenticated user does not get any workouts returned
    def test_unauthenticated_user_do_not_have_access(self):
        # URL for the update view
        url = reverse("workout-update", kwargs={"pk": self.firstWorkout.id})

        # Remove the authentication
        self.client.force_authenticate(user=None)

        # Data for updating the workout
        data = {
            "name": "Updated Workout",
            "exercises": [self.first_exercise.id]
        }

        # Make a PUT request to the update view
        response = self.client.put(url, data=data, format='json')
        # Check that the response status code is 401 UNAUTHORIZED
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)



# Views to test:
# Create exercise session view
# Create set view
# Create workout session view















class TestWorkoutSessionCreate(APITestCase):
    def setUp(self):
        create_user_url = reverse('register_user')
        
        # Create a user
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

        # Authenticate the user
        self.client.force_authenticate(user=self.user)

        # Create a test exercise for a workout
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")

        # Create a workout
        create_workout_url = reverse('workout-create')
        workout_name = "Test Workout"

        workout_data = {
            "author": self.user.id,
            "name": workout_name,
            "exercises": [self.exercise.id]
        }

        # Create one workout for the user
        response = self.client.post(create_workout_url, data=workout_data, format='json')
        self.workout = Workout.objects.get(id=response.data["id"])

        # Create the workout session 
        self.create_workout_session_url = reverse('workouts_session-create')

        self.workout_session = {
            "workout": self.workout.id,
            "user": self.user.id,
        }

        # Create the exercise session
        self.create_exercise_session_url = reverse('exercise_session-create')

        self.exercise_session = {
            "workout_session": None, # Will be set later
            "exercise": self.exercise.id,
        }

        # Create the set
        self.create_set_url = reverse('set-create')
        repetions = 10
        weight = 10

        self.set = {
            "exercise_session": None, # Will be set later
            "repetitions": repetions,
            "weight": weight
        }

    # Test that a user can create a workout session
    def test_create_workout_session_basic(self):
        # Make a POST request to the create view
        response = self.client.post(self.create_workout_session_url, data=self.workout_session, format='json')

        # Check that the response status code is 201 CREATED
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WorkoutSession.objects.count(), 1)

        # Retrieve the workout session
        workout_session = WorkoutSession.objects.get(id=response.data["id"])

        # Check that the attributes of the workout session are correct
        self.assertEqual(workout_session.user, self.user)
        self.assertEqual(workout_session.workout, self.workout)

    # Test that a user can create an exercise session
    def test_create_exercise_session_basic(self):
        # Create a workout session
        response = self.client.post(self.create_workout_session_url, data=self.workout_session, format='json')
        workout_session = WorkoutSession.objects.get(id=response.data["id"])

        # Set the workout session for the exercise session
        self.exercise_session["workout_session"] = workout_session.id

        # Make a POST request to the create view
        response = self.client.post(self.create_exercise_session_url, data=self.exercise_session, format='json')

        # Check that the response status code is 201 CREATED
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ExerciseSession.objects.count(), 1)

        # Retrieve the exercise session
        exercise_session = ExerciseSession.objects.get(id=response.data["id"])

        # Check that the attributes of the exercise session are correct
        self.assertEqual(exercise_session.workout_session, workout_session)
        self.assertEqual(exercise_session.exercise, self.exercise)

    # Test that a user can create a set
    def test_create_set_basic(self):
        # Create a workout session
        response = self.client.post(self.create_workout_session_url, data=self.workout_session, format='json')
        workout_session = WorkoutSession.objects.get(id=response.data["id"])

        # Set the workout session for the exercise session
        self.exercise_session["workout_session"] = workout_session.id
        
        # Create an exercise session
        response = self.client.post(self.create_exercise_session_url, data=self.exercise_session, format='json')
        exercise_session = ExerciseSession.objects.get(id=response.data["id"])

        # Set the exercise session for the set
        self.set["exercise_session"] = exercise_session.id

        # Make a POST request to the create view
        response = self.client.post(self.create_set_url, data=self.set, format='json')

        # Check that the response status code is 201 CREATED
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Set.objects.count(), 1)

        # Retrieve the set
        created_set = Set.objects.get(id=response.data["id"])

        # Check that the attributes of the set are correct
        self.assertEqual(created_set.exercise_session, exercise_session)
        self.assertEqual(created_set.repetitions, self.set["repetitions"])
        self.assertEqual(created_set.weight, self.set["weight"])

    # Test that an unauthorized user cannot create a workout session
    def test_create_workout_session_for_unauthenticated_user(self):
        # Remove the authentication
        self.client.force_authenticate(user=None)

        # Make a POST request to the create view
        response = self.client.post(self.create_workout_session_url, data=self.workout_session, format='json')

        # Check that the response status code is 401 UNAUTHORIZED
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Restore authentication for the user
        self.client.force_authenticate(user=self.user)