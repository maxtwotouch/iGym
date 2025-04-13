
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from backend.models import UserProfile, PersonalTrainerProfile, Exercise, Workout, WorkoutSession, ExerciseSession, Set, ChatRoom, ScheduledWorkout, Message, WorkoutMessage, Notification, PersonalTrainerScheduledWorkout
from backend.serializers import ExerciseSerializer, WorkoutSerializer, UserSerializer, PersonalTrainerSerializer, DefaultUserSerializer, ChatRoomSerializer, WorkoutMessageSerializer
from backend.serializers import WorkoutSessionSerializer, ScheduledWorkoutSerializer, MessageSerializer, NotificationSerializer, PersonalTrainerScheduledWorkoutSerializer
from datetime import timedelta
from django.utils.timezone import now

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
        
        # Make sure that the creater was added as one of the owners
        self.assertIn(self.user, workout.owners.all())


class TestWorkoutDeleteView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout.owners.set([self.user, self.second_user])
        
        self.url = reverse("workout-delete", kwargs={"pk": self.workout.id})
        
    def test_still_owners_left_only_removes_user_from_workout(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that the workout still exists
        self.assertIn(self.workout, Workout.objects.all())
        
        # Check that the user is not part of the owners anymore
        self.assertNotIn(self.user, self.workout.owners.all())
    
    def test_last_owner_deletes_the_workout(self):
        # Make sure there is only one owner left
        self.workout.owners.remove(self.user)
        
        self.client.force_authenticate(self.second_user)
        
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that the workout was deleted
        self.assertEqual(Workout.objects.count(), 0)
        
        
    def test_delete_non_existent_workout(self):
        self.client.force_authenticate(user=self.user)
        invalid_url = reverse("workout-delete", kwargs={"pk": 9999})
        
        # Try to delete a workout that does not exist
        response = self.client.delete(invalid_url)
        
        # Should not find the workout
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Make sure that the workout we stored earlier still exists
        self.assertIn(self.workout, Workout.objects.all())
    
    def test_delete_other_users_workout(self):
        user = User.objects.create_user(username="someUser", password="password")
        self.client.force_authenticate(user=user)
        
        # Try do delete the workout that was created by the first user
        response = self.client.delete(self.url)
        
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
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")

        # Create some test exercises for the second workout
        self.third_exercise = Exercise.objects.create(name="Bench Press", description="A classic chest exercise.", muscle_group="Chest")
        self.fourth_exercise = Exercise.objects.create(name="Deadlift", description="A lower body exercise.", muscle_group="Legs")

        # Create some test exercises for the third workout
        self.fifth_exercise = Exercise.objects.create(name="Pull-up", description="An upper body exercise.", muscle_group="Back")
        self.sixth_exercise = Exercise.objects.create(name="Leg Press", description="A lower body exercise.", muscle_group="Legs")

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
    
    def test_not_creator_but_still_owner_(self):
        url = reverse("workout-list")
        # Create a third user
        third_user = User.objects.create(username="third_user", password="passowrd")
        
        # Add the user as one of the owners for the first workout
        self.secondUserWorkout.owners.set([third_user])

        self.client.force_authenticate(user=third_user)
        
        # Since the third user is an owner of the second user workout, it should come up when the third user calls this endpoint
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = WorkoutSerializer([self.secondUserWorkout], many=True)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data, serializer.data)
        
        

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
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")

        # Create some test exercises for the second workout
        self.third_exercise = Exercise.objects.create(name="Bench Press", description="A classic chest exercise.", muscle_group="Chest")
        self.fourth_exercise = Exercise.objects.create(name="Deadlift", description="A lower body exercise.", muscle_group="Legs")

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
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")

        # Create some test exercises for the second workout
        self.third_exercise = Exercise.objects.create(name="Bench Press", description="A classic chest exercise.", muscle_group="Chest")
        self.fourth_exercise = Exercise.objects.create(name="Deadlift", description="A lower body exercise.", muscle_group="Legs")

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
    

class TestCreateExerciseSessionView(APITestCase):
    # Comments, we have to  make sure that the exercise provided is actually a part of the workout given in workot session, in other words that exercise contained in workout_session.workout
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
        
        self.assertEqual(workout_session.user, self.second_user)
        self.assertEqual(workout_session.workout.author, self.user)
    
    


class TestListUserView(APITestCase):
    def setUp(self):
        self.user = User.objects.create(username="testuser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, height=180, weight=75)
        self.second_user = User.objects.create(username="secondTestuser", password="password")
        self.second_user_profile = UserProfile.objects.create(user=self.second_user, height=200, weight=100)
        self.url = reverse("user-list")
        
        self.users = [self.user, self.second_user]
    
    def test_list_user_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = UserSerializer(self.users, many=True)
    
        self.assertEqual(len(response.data), len(self.users))
        self.assertEqual(response.data, serializer.data)

    
    def test_unauthenticated_user_do_not_have_access(self):
        # Remove the authentication
        self.client.force_authenticate(user=None)
        
        # Make a GET request to the list view
        response = self.client.get(self.url)
        # Check that the response status code is 401 UNAUTHORIZED
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_user_does_not_list_personal_trainer(self):
        # Create a personal trainer
        personal_trainer = User.objects.create(username="test_trainer", password="password")
        personal_trainer_profile = PersonalTrainerProfile.objects.create(user=personal_trainer, experience="5 years")
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Make sure that the queryset did not return the personal trainer
        self.assertEqual(len(response.data), len(self.users))
        self.assertNotIn(personal_trainer.username, [user['username'] for user in response.data])

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
        # Remove the authentication
        self.client.force_authenticate(user=None)
        
        # Make a GET request to the list view
        response = self.client.get(self.url)
        # Check that the response status code is 401 UNAUTHORIZED
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
        

class TestUserDetailView(APITestCase):
    def setUp(self):
        self.user = User.objects.create(username="testuser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, height=180, weight=75)
        
        self.url = reverse("user-detail", kwargs={"pk": self.user.id})
    
    def test_user_detail_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = UserSerializer(self.user)
        self.assertEqual(response.data, serializer.data)
    
    def test_user_detail_of_other_user(self):
        second_user = User.objects.create(username="secondTestuser", password="password")
        second_user_profile = UserProfile.objects.create(user=second_user, height=200, weight=100)
        
        self.client.force_authenticate(user=second_user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Make sure it was the details of the first user that was retrieved
        serializer = UserSerializer(self.user)
        self.assertEqual(response.data, serializer.data)
    
    def test_user_detail_non_existent_user(self):
        url = reverse("user-detail", kwargs={"pk": 100})
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(url)
        
        # Should not find the user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_user_do_not_have_access(self):
        # Remove the authentication
        self.client.force_authenticate(user=None)
        
        # Make a GET request to the list view
        response = self.client.get(self.url)
        # Check that the response status code is 401 UNAUTHORIZED
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        

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
        url = reverse("personal_trainer-detail", kwargs={"pk": 100})
        self.client.force_authenticate(user=self.trainer)
        
        response = self.client.get(url)
        
        # Should not find the user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_user_do_not_have_access(self):
        # Remove the authentication
        self.client.force_authenticate(user=None)
        
        response = self.client.get(self.url)
        # Check that the response status code is 401 UNAUTHORIZED
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestUpdateUserView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, height=180, weight=75)
        
        self.url = reverse("user-update", kwargs={"pk": self.user.id})
    
    def test_update_user_basic(self):
        self.client.force_authenticate(user=self.user)
        
        # Only update some fields
        new_data = {
            "profile": {
                "height": 185,
                "weight": 80
            }
        }
        
        response = self.client.patch(self.url, data=new_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        updated_user = UserProfile.objects.get(id=self.user_profile.id)
        
        self.assertEqual(updated_user.height, 185)
        self.assertEqual(updated_user.weight, 80)

    def test_update_other_user(self):
        second_user = User.objects.create(username="secondUser", password="password")
        
        self.client.force_authenticate(user=second_user)
        
        new_data = {
            "profile": {
                "height": 185,
                "weight": 80
            }
        }
        
        response = self.client.patch(self.url, data=new_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        original_user = UserProfile.objects.get(id=self.user_profile.id)
        
        # Check that the attributes have not been updated
        self.assertEqual(original_user.height, 180)
        self.assertEqual(original_user.weight, 75)
    
    def test_update_password(self):
        self.client.force_authenticate(user=self.user)
        
        new_data = {
            "password": "newPassword"
        }
        
        response = self.client.patch(self.url, data=new_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated_user = User.objects.get(id=self.user.id)
        self.assertEqual(updated_user.password, "newPassword")
    
    def test_unauthenticated_user_do_not_have_access(self):
        new_data = {
            "profile": {
                "height": 185,
                "weight": 80
            }
        }
        response = self.client.patch(self.url, data=new_data, format='json')
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


# Check that personal trainers can recieve exercises of workouts they are not a owner of
class TestListExercisesInWorkoutView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.profile = UserProfile.objects.create(user=self.user)
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")
        self.workout.exercises.set([self.exercise, self.second_exercise])
        self.workout.owners.add(self.user)
        
        self.url = reverse("workout-exercises", kwargs={"pk": self.workout.id})
        self.exercises = [self.exercise, self.second_exercise]
    
    def test_list_exercises_in_workout_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = ExerciseSerializer(self.exercises, many=True)
        
        self.assertEqual(len(response.data), len(self.exercises))
        self.assertEqual(response.data, serializer.data)
    
    def test_list_exercises_of_others_workout(self):
        # Create a second user
        second_user = User.objects.create_user(username="secondUser", password="password")
        self.client.force_authenticate(user=second_user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_exercises_of_non_existent_workout(self):
        url = reverse("workout-exercises", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_personal_trainer_can_list_exercises_of_clients_workout(self):
        trainer = User.objects.create_user(username="testTrainer", password="password")
        trainer_profile = PersonalTrainerProfile.objects.create(user=trainer, experience="5 years")
        
        # Assign the personal trainer to the user
        self.user.profile.personal_trainer = trainer_profile
        
        self.client.force_authenticate(user=trainer)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = ExerciseSerializer(self.exercises, many=True)
        
        self.assertEqual(len(response.data), len(self.exercises))
        self.assertEqual(response.data, serializer.data)
        
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        
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

class TestListPtAndUserView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.second_trainer = User.objects.create_user(username="secondTestUser", password="password")
        self.second_trainer_profile = PersonalTrainerProfile.objects.create(user=self.second_trainer)
        
        self.users = [self.user, self.trainer, self.second_trainer]
        
        self.url = reverse("user-pt-list")
        
    def test_list_pt_and_user_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = DefaultUserSerializer(self.users, many=True)
        
        self.assertEqual(len(self.users), len(response.data))
        self.assertEqual(serializer.data, response.data)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        
        # Make sure no users where returned
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestListWorkoutSessionsView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.workout.exercises.set([self.exercise])
        
        self.duration = timedelta(hours=1, minutes=30, seconds=0)
        
        # Create a first workout session
        self.workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, calories_burned=120.5, duration=self.duration)
        
        # Add an exercise session
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
    
    def test_user_without_workout_sessions(self):
        # Make sure that a user cannot list other user's workout sessions
        second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.client.force_authenticate(user=second_user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return empty since this user has not performed any workout sessions
        self.assertEqual(len(response.data), 0)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        
        # Make sure no users where returned
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

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

class TestChatRoomListView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.third_user = User.objects.create_user(username="thirdTestUser", password="password")
        
        self.first_chat_room = ChatRoom.objects.create(name="firstChatRoom")
        self.first_chat_room.participants.set([self.user, self.second_user])
        
        self.second_chat_room = ChatRoom.objects.create(name="secondChatRoom")
        self.second_chat_room.participants.set([self.user, self.third_user])
        
        self.url = reverse("chat_rooms-list")
        
        # Chatrooms related to self.user
        self.chat_rooms = [self.first_chat_room, self.second_chat_room]        
    
    def test_list_chat_rooms_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = ChatRoomSerializer(self.chat_rooms, many=True)
        
        self.assertEqual(len(response.data), len(self.chat_rooms))
        self.assertEqual(response.data, serializer.data)
    
    def test_cannot_list_others_chat_rooms(self):
        self.client.force_authenticate(user=self.second_user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Make sure that the second user do not retrieve the chatroom between user and third user
        serializer = ChatRoomSerializer([self.first_chat_room], many=True)
        
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data, serializer.data)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        
        # Make sure no users where returned
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestChatRoomCreateView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.third_user = User.objects.create_user(username="thirdTestUser", password="password")
        
        self.url = reverse("chat_room-create")
        self.name = "Test Chat Room"
        self.participants = [self.user.id, self.second_user.id, self.third_user.id]
    
    def test_create_chat_room_basic(self):
        self.client.force_authenticate(user=self.user)
        
        data = {
            "participants": self.participants,
            "name": self.name
        }
        
        response = self.client.post(self.url, data=data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ChatRoom.objects.count(), 1)
        
        chat_room = ChatRoom.objects.get(id=response.data["id"])
        
        self.assertEqual(chat_room.name, "Test Chat Room")
        self.assertCountEqual(chat_room.participants.all(), [self.user, self.second_user, self.third_user])
        
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_chat_room_with_non_existent_user(self):
        non_existent_user_id = 9999
        
        self.client.force_authenticate(user=self.user)

        data = {
            "participants": [self.user.id, non_existent_user_id],
            "name": self.name
        }
        
        response = self.client.post(self.url, data=data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ChatRoom.objects.count(), 0)
    

class TestListParticipantsInChatRoomView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.third_user = User.objects.create_user(username="thirdTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="Test Chat Room")
        self.chat_room.participants.set([self.user, self.second_user, self.third_user])
        self.participants = [self.user, self.second_user, self.third_user]
        
        self.url = reverse("chat_room-participants", kwargs={"pk": self.chat_room.id})
    
    def test_list_participants_in_chat_room_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        serializer = DefaultUserSerializer(self.participants, many=True)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), len(self.participants))
        self.assertEqual(response.data, serializer.data)
        
    
    def test_list_participants_of_others_chat_room(self):
        # Create a user that is not a part of the chat room
        fourth_user = User.objects.create_user(username="fourthTestUser", password="password")
        self.client.force_authenticate(user=fourth_user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_participants_of_non_existent_chat_room(self):
        url = reverse("chat_room-participants", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

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
        
        # Make sure no users where returned
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
        
        serializer = ScheduledWorkoutSerializer(self.user_scheduled_workouts, many=True)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
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

class TestListMessagesInChatRoomView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        
        self.message = Message.objects.create(sender=self.user, content="first message", chat_room=self.chat_room)
        self.second_message = Message.objects.create(sender=self.second_user, content="reply to first message", chat_room=self.chat_room)
        self.third_message = Message.objects.create(sender=self.second_user, content="last message", chat_room=self.chat_room)
        
        self.url = reverse("chat_room-messages", kwargs={"pk": self.chat_room.id})
        
        self.messages = [self.message, self.second_message, self.third_message]
        
    
    def test_list_messages_in_chat_room_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = MessageSerializer(self.messages, many=True)
        
        self.assertEqual(len(response.data), len(self.messages))
        self.assertEqual(response.data, serializer.data)
    
    def test_list_messgaes_of_others_chat_room(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_list_messages_of_non_existent_chat_room(self):
        url = reverse("chat_room-messages", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class ListWorkoutMessagesInChatRoomView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout_message = WorkoutMessage.objects.create(workout=self.workout, chat_room=self.chat_room, sender=self.user)
        
        self.second_workout = Workout.objects.create(name="second test workout", author=self.second_user)
        self.second_workout_message = WorkoutMessage.objects.create(workout=self.second_workout, chat_room=self.chat_room, sender=self.second_user)
        
        self.url = reverse("chat_room-workout_messages", kwargs={"pk": self.chat_room.id})
        
        self.workout_messages = [self.workout_message, self.second_workout_message]
    
    def test_list_workout_messages_in_chat_room_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = WorkoutMessageSerializer(self.workout_messages, many=True)
        
        self.assertEqual(len(response.data), len(self.workout_messages))
        self.assertEqual(response.data, serializer.data)
    
    def test_list_workout_messages_of_others_chat_room(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_workout_messages_of_non_existent_chat_room(self):
        url = reverse("chat_room-workout_messages", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestChatRoomDeleteView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        
        self.url = reverse("chat_room-delete", kwargs={"pk": self.chat_room.id})
    
    def test_still_participants_left_only_removes_participant_from_chat_room(self):
        # Calling the endpoint with more than one user in it should just make the user leave the chat room, not delete it
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that the chatroom still exist
        self.assertIn(self.chat_room, ChatRoom.objects.all())
        
        # Check that the user that left is not a part of the participants anymore
        self.assertNotIn(self.user, self.chat_room.participants.all())
    
    def test_last_participant_deletes_the_chat_room(self):
        # Make sure there is only one participant left in the chatroom
        self.chat_room.participants.remove(self.user)
        
        self.client.force_authenticate(self.second_user)
        
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that the chat room was deleted
        self.assertEqual(ChatRoom.objects.count(), 0)
    
    def test_delete_others_chat_room(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        self.assertIn(self.chat_room, ChatRoom.objects.all())
    
    def test_delete_non_existent_chat_room(self):
        url = reverse("chat_room-delete", kwargs={"pk": 9999})
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn(self.chat_room, ChatRoom.objects.all())

class TestNotificationListView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        
        self.notification = Notification.objects.create(user=self.second_user, sender=self.user, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, workout_message=self.workout)
        self.second_notification = Notification.objects.create(user=self.second_user, sender=self.user, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message="here is a workout")
        self.third_notification = Notification.objects.create(user=self.second_user, sender=self.user, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message="no worries")
        
        self.notifications = [self.notification, self.second_notification, self.third_notification]
        
        self.url = reverse("notification-list")
    
    def test_notification_list_basic(self):
        self.client.force_authenticate(user=self.second_user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Make sure that the list is returned with the newest notifications first
        sorted_notifications = sorted(self.notifications, key=lambda n: n.date_sent, reverse=True)

        
        serializer = NotificationSerializer(sorted_notifications, many=True)
        
        self.assertEqual(len(response.data), len(self.notifications))
        self.assertEqual(response.data, serializer.data)
        
    def test_cannot_list_others_notifications(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)    

    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)   
        

class TestNotificationDeleteView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        
        self.notification = Notification.objects.create(user=self.user, sender=self.second_user, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message="test message")
        
        self.url = reverse("notification-delete", kwargs={"pk": self.notification.id})
    
    def test_delete_notification_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertNotIn(self.notification, Notification.objects.all())
    
    def test_delete_non_existent_notification(self):
        url = reverse("notification-delete", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn(self.notification, Notification.objects.all())
    
    def test_delete_other_users_notification(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn(self.notification, Notification.objects.all())

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
    

class TestPersonalScheduledWorkoutDeleteView(APITestCase):
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
        
    def test_user_cannot_delete_personal_trainer_scheduled_workout(self):
        self.client.force_authenticate(user=self.user)
        
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
        
     
        
        
    
    
        
    
        
    
        
        
        
        
        
        
        
            
        
        
        
        
        
    
        
        
        
        
        
        
        
        
        
    
        
                
        
    
        
        
        
    

        
        
    
        
        
    
        
        
        
        
        
        
        
        

        
        
        
    
        
        
        
        
        
    
        
        
                
    
    
        
        
        
        
    
        
        
    
        
        
        
    

        
        
        
        

        
        
        
        
        
        
        
        
        
        

        

                
        
    
        
        
        
        
        
        
        
    
        
        
    


        

        