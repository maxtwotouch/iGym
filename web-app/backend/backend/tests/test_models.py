
from django.test import TestCase
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from backend.models import UserProfile, PersonalTrainerProfile, Exercise, Workout, WorkoutSession, ExerciseSession, Set


class UserProfileModelTest(TestCase):
    
    def test_create_user_basic(self):
        weight = 75
        height = 180
        
        # Create a django user and link it to our custom user profile
        user = User.objects.create_user(username="testuser", password="password")
        profile = UserProfile.objects.create(user=user, weight=weight, height=height)
        
        # Verify that these values was set as expected
        self.assertEqual(profile.user, user)
        self.assertEqual(profile.weight, weight)
        self.assertEqual(profile.height, height)
    
    def test_create_user_without_weight_and_height(self):
        user = User.objects.create_user(username="testuser", password="password")
        profile = UserProfile.objects.create(user=user)
        
        # None should have been assigned for these attributes
        self.assertIsNone(profile.weight)
        self.assertIsNone(profile.height)
    
    def test_create_user_with_invalid_height_and_height(self):
        invalid_height = -120
        invalid_weight = -75
        user = User.objects.create_user(username="testuser", password="password")
        profile = UserProfile(user=user, weight=invalid_weight, height=invalid_height)

        # Saving this user profile in the database should raise an integrity error
        with self.assertRaises(IntegrityError):
            profile.save()  
            

class PersonalTrainerProfileModelTest(TestCase):
    
    def test_create_personal_trainer_basic(self):
        experience = "2 years"
        
        # Create a django user and link it to our custom personal trainer profile
        user = User.objects.create_user(username="testuser", password="password")
        profile = PersonalTrainerProfile.objects.create(user=user, experience=experience)
        
        # Verify that these values was set as expected
        self.assertEqual(profile.user, user)
        self.assertEqual(profile.experience, experience)
    
    def test_create_personal_trainer_without_experience(self):
        # Test the creation of a personal trainer without specifying experience
        experience = "none"
        user = User.objects.create_user(username="testuser", password="password")
        profile = PersonalTrainerProfile.objects.create(user=user)
        
        # None should have been assigned for this attribute
        self.assertEqual(profile.experience, experience)
        

class ExerciseModelTest(TestCase):
    
    def test_create_exercise_basic(self):
        name = "test exercise"
        description = "test description"
        muscle_group = "test muscle group"
        image_path = "exercise_images/pec_deck.png"
        
        exercise = Exercise.objects.create(name=name, description=description, muscle_group=muscle_group, image=image_path)
        
        self.assertEqual(exercise.name, name)
        self.assertEqual(exercise.description, description)
        self.assertEqual(exercise.muscle_group, muscle_group)
        self.assertEqual(exercise.image, image_path)
    
    def test_create_without_required_fields(self):
        exercise = Exercise()
        
        # Should raise a validation error, as name, descrption and muscle group is required fields
        with self.assertRaises(ValidationError):
            exercise.full_clean()
    
    def test_str_method(self):
        name = "test exercise"
        description = "test description"
        muscle_group = "test muscle group"
        exercise = Exercise.objects.create(name=name, description=description, muscle_group=muscle_group)
        
        #  String method should return the name of the exercise
        self.assertEqual(str(exercise), name)


class WorkoutModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        
        # Create some test exercises
        self.first_exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.second_exercise = Exercise.objects.create(name="Squat", description="A lower body exercise.", muscle_group="Legs")
    
    def test_create_workout_basic(self):
        name = "test workout"
        workout = Workout.objects.create(name=name, author=self.user)
        
        # Add the exercises to the workout
        workout.exercises.set([self.first_exercise, self.second_exercise])
        
        
        self.assertEqual(workout.name, name)
        self.assertEqual(workout.author, self.user)
        self.assertEqual(name, workout.name)
        
        # Ensure that the date was set automatically
        self.assertIsNotNone(workout.date_created)
        
        # Make sure that the 2 exercises were added to the workout
        self.assertIn(self.first_exercise, workout.exercises.all())
        self.assertIn(self.second_exercise, workout.exercises.all())
    
    def test_create_workout_without_author(self):
        name = "test workout"
        workout = Workout(name=name)
        
        # Should raise an integrity error as author is a required field
        with self.assertRaises(IntegrityError):
            workout.save()  
    
    def test_create_workout_with_name_exceeding_max_length(self):
        # Generate a name that is too long
        name = "A" * 256
        
        workout = Workout(name=name, author=self.user)
        
        # Should raise a validation error since it exceeds max length
        with self.assertRaises(ValidationError):
            workout.full_clean()
        

class WorkoutSessionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")

        # Create a test workout
        self.workout = Workout.objects.create(name="test workout", author=self.user)

    def test_create_workout_session_basic(self):
        # Add calories burned to the workout session
        calories_burned = 0.5
        
        workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, calories_burned=calories_burned)

        self.assertEqual(workout_session.user, self.user)
        self.assertEqual(workout_session.workout, self.workout)
        self.assertEqual(workout_session.calories_burned, calories_burned)

        # Ensure that the start time was set automatically
        self.assertIsNotNone(workout_session.start_time)

    def test_create_workout_session_with_empty_workout(self):
        workout_session = WorkoutSession(user=self.user)

        # Should raise an integrity error as workout is a required field
        with self.assertRaises(IntegrityError):
            workout_session.save()

    def test_create_workout_session_with_empty_user(self):
        calories_burned = 0.5
        workout_session = WorkoutSession(workout=self.workout, calories_burned=calories_burned)

        # A user performing the workout session is required
        with self.assertRaises(IntegrityError):
            workout_session.save()

    def test_create_workout_session_with_negative_calories_burned(self):
        calories_burned = -0.5 
        
        workout_session = WorkoutSession(user=self.user, workout=self.workout, calories_burned=calories_burned)

        # Should raise an integrity error as calories burned should be a positive integer or default to null
        with self.assertRaises(ValidationError):
            workout_session.save()


class ExerciseSessionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        
        # Create a test exercise
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout.exercises.set([self.exercise])

        # Create a test workout session
        self.workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout)


    def test_create_exercise_session_basic(self):
        exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.workout_session)

        self.assertEqual(exercise_session.exercise, self.exercise)
        self.assertEqual(exercise_session.workout_session, self.workout_session)

    def test_create_exercise_session_with_empty_exercise(self):
        exercise_session = ExerciseSession(workout_session=self.workout_session)

        # Should raise an integrity error as exercise is a required field
        with self.assertRaises(IntegrityError):
            exercise_session.save()

    def test_create_exercise_session_with_empty_workout_session(self):
        exercise_session = ExerciseSession(exercise=self.exercise)

        # Should raise an integrity error as workout session is a required field
        with self.assertRaises(IntegrityError):
            exercise_session.save()


class SetSessionModelTest(TestCase):
    def setUp(self):
        # Establish a user, workout, workout session, exercise and exercise session
        self.user = User.objects.create_user(username="testuser", password="password")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout)
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.workout_session)
        self.workout.exercises.set([self.exercise])

        self.repetitions = 10
        self.weight = 50

    def test_create_set_basic(self):
        exercise_set = Set.objects.create(exercise_session=self.exercise_session, repetitions=self.repetitions, weight=self.weight)

        self.assertEqual(exercise_set.exercise_session, self.exercise_session)
        self.assertEqual(exercise_set.repetitions, self.repetitions)
        self.assertEqual(exercise_set.weight, self.weight)

    def test_create_set_with_empty_exercise_session(self):
        exercise_set = Set(repetitions=self.repetitions, weight=self.weight)

        # Should raise an integrity error as exercise session is a required field
        with self.assertRaises(IntegrityError):
            exercise_set.save()

    def test_create_set_with_negative_repetitions(self):
        exercise_set = Set(exercise_session=self.exercise_session, weight=self.weight)

        exercise_set.repetitions = -1

        # Should raise an integrity error as repetitions should be a positive integer
        with self.assertRaises(IntegrityError):
            exercise_set.save()

    def test_create_set_with_no_weight(self):
        exercise_set = Set(exercise_session=self.exercise_session, repetitions=self.repetitions)

        # Should not raise an error as weight is not a required field
        self.assertIsNone(exercise_set.weight)

    def test_create_set_with_negative_weight(self):
        exercise_set = Set(exercise_session=self.exercise_session, repetitions=self.repetitions)

        exercise_set.weight = -1    

        # Should raise an validation error as weight should be a positive decimal number
        with self.assertRaises(ValidationError):
            exercise_set.full_clean()

    # Visit later, should be tested against max digits and assigned decimal places


