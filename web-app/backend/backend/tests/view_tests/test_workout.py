from django.urls import reverse
from rest_framework import status
from backend.models import UserProfile, PersonalTrainerProfile, Exercise, Workout
from backend.serializers import WorkoutSerializer, ExerciseSerializer
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

class CreateWorkoutViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")
        
        self.url = reverse("workout-create")
        
        self.exercises = [self.exercise.id, self.second_exercise.id]
        self.workout_name = "Test Workout"
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_workout_basic(self):
        self.client.force_authenticate(user=self.user)
        
        # Data for creating a workout
        data = {
            "name": self.workout_name,
            "exercises": self.exercises
        }
    
        # Make the POST request
        response = self.client.post(self.url, data=data, format='json')
        
        # Verify that the workout was created and verify the attribute values
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Workout.objects.count(), 1)
    
        workout = Workout.objects.get(id=response.data["id"])
        self.assertEqual(workout.author, self.user)
        self.assertEqual(workout.name, self.workout_name)
        
        # Make sure that the creater was added as one of the owners
        self.assertIn(self.user, workout.owners.all())
        
class TestUpdateWorkout(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")

        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")

        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout.owners.add(self.user)
        self.workout.exercises.set([self.exercise])
        
        self.url = reverse("workout-update", kwargs={"pk": self.workout.id})

    def test_update_workout_basic(self):
        self.client.force_authenticate(user=self.user)

        # Data for updating the workout. Adding another exercise to the workout, and changing the name
        data = {
            "name": "Updated Workout",
            "exercises": [self.exercise.id, self.second_exercise.id]
        }

        # Make a PUT request to the update view
        response = self.client.put(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Retrieve the updated workout
        updatedWorkout = Workout.objects.get(id=self.workout.id)

        # Check that the attributes of the workout have been updated
        self.assertEqual(updatedWorkout.name, "Updated Workout")
        self.assertEqual(list(updatedWorkout.exercises.all()), [self.exercise, self.second_exercise])

    def test_update_other_users_workout(self):
        second_user = User.objects.create_user(username="someUser", password="password")
        
        # Authenticate the second user
        self.client.force_authenticate(user=second_user)

        data = {
            "name": "Updated Workout",
            "exercises": [self.exercise.id, self.second_exercise.id]
        }
        
        response = self.client.put(self.url, data=data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Retrieve the original workout
        originalWorkout = Workout.objects.get(id=self.workout.id)

        # Check that the attributes of the workout have not been updated
        self.assertEqual(originalWorkout.name, "test workout")
        self.assertEqual(list(originalWorkout.exercises.all()), [self.exercise])

    def test_update_non_existent_workout(self):
        url = reverse("workout-update", kwargs={"pk": 9999})

        self.client.force_authenticate(user=self.user)
        
        data = {
            "name": "Updated Workout",
            "exercises": [self.exercise.id, self.second_exercise.id]
        }

        response = self.client.put(url, data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_do_not_have_access(self):
        data = {
            "name": "Updated Workout",
            "exercises": [self.exercise.id, self.second_exercise.id]
        }

        response = self.client.put(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class TestListWorkout(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        # Create some test exercises for the first workout
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")

        # Create some test exercises for the second workout
        self.third_exercise = Exercise.objects.create(name="Bench Press", description="A classic chest exercise.", muscle_group="Chest")
        self.fourth_exercise = Exercise.objects.create(name="Deadlift", description="A lower body exercise.", muscle_group="Legs")

        # Create some test exercises for the third workout
        self.fifth_exercise = Exercise.objects.create(name="Pull-up", description="An upper body exercise.", muscle_group="Back")
        self.sixth_exercise = Exercise.objects.create(name="Leg Press", description="A lower body exercise.", muscle_group="Legs")

        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout.owners.set([self.user])
        self.workout.exercises.set([self.first_exercise, self.second_exercise])
        
        self.second_workout = Workout.objects.create(name= "Second test workout", author=self.user)
        self.second_workout.owners.set([self.user])
        self.second_workout.exercises.set([self.third_exercise, self.fourth_exercise])
        
        self.third_workout = Workout.objects.create(name= "Third test workout", author=self.second_user)
        self.third_workout.owners.set([self.second_user])
        self.third_workout.exercises.set([self.fifth_exercise, self.sixth_exercise])

        self.url = reverse("workout-list")
        
        self.user_workouts = [self.workout, self.second_workout]
        self.second_user_workouts = [self.third_workout]
        
    def test_list_workout_basic(self):
        self.client.force_authenticate(user=self.user)
        
        # Make a GET request to the list view
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Retrieve the workouts and convert it to the same format as the response using the serializer
        serializer = WorkoutSerializer(self.user_workouts, many=True)

        # Check that the queryset returned the right number of workouts
        self.assertEqual(len(response.data), len(self.user_workouts))

        # Check that the queryset returned contains all workouts for the first user
        self.assertEqual(response.data, serializer.data)

        # Authenticate the second user
        self.client.force_authenticate(user=self.second_user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        serializer = WorkoutSerializer(self.second_user_workouts, many=True)

        self.assertEqual(len(response.data), len(self.second_user_workouts))

        # Check that the queryset returned contains all workouts for the second user
        self.assertEqual(response.data, serializer.data)


    def test_user_without_workouts(self):
        noWorkoutUser = User.objects.create(username="noWorkoutUser", password="password")
        
        self.client.force_authenticate(user=noWorkoutUser)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that the queryset returned is empty
        self.assertEqual(len(response.data), 0)

    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_not_creator_but_still_owner_(self):
        # Create a third user
        third_user = User.objects.create(username="thirdTestUser", password="passowrd")
        
        # Add the user as one of the owners for the first workout
        self.third_workout.owners.add(third_user)

        self.client.force_authenticate(user=third_user)
        
        # Since the third user is an owner of the second user workout, it should come up when the third user calls this endpoint
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = WorkoutSerializer(self.second_user_workouts, many=True)
        
        self.assertEqual(len(response.data), len(self.second_user_workouts))
        self.assertEqual(response.data, serializer.data)
        
class TestWorkoutDetail(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")

        # Create some test exercises for the workout
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")

        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout.owners.add(self.user)
        self.workout.exercises.set([self.exercise, self.second_exercise])
        
        self.url = reverse("get-workout", kwargs={"pk": self.workout.id})

    def test_workout_detail_basic(self):
        self.client.force_authenticate(user=self.user)

        # Make a GET request to the detail view
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        serializer = WorkoutSerializer(self.workout)

        # Check that the queryset returned contains the correct workout
        self.assertEqual(response.data, serializer.data)

    def test_workout_detail_other_users_workout(self):
        second_user = User.objects.create_user(username="someUser", password="password")
        
        # Authenticate the second user
        self.client.force_authenticate(user=second_user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_workout_detail_non_existent_workout(self):
        url = reverse("get-workout", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
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
        
        
