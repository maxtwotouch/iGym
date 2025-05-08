from django.test import TestCase
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from backend.models import UserProfile, PersonalTrainerProfile, Exercise, Workout, WorkoutSession, ExerciseSession, Set
from backend.models import ChatRoom, Message, WorkoutMessage, ScheduledWorkout, Notification, PersonalTrainerScheduledWorkout, FailedLoginAttempt
from datetime import timedelta
from django.utils.timezone import now



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
        self.assertEqual(profile.personal_trainer, None)
        self.assertEqual(profile.pt_chatroom, None)
        self.assertEqual(profile.profile_picture, None)
    
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
    
    def test_delete_user_cascade(self):
        user = User.objects.create_user(username="testuser", password="password")
        profile = UserProfile.objects.create(user=user)
        
        # Deleting the user should also delete the user profile
        user.delete()
        
        # Make sure that the user profile was deleted
        self.assertEqual(UserProfile.objects.count(), 0)
    
    def test_delete_personal_trainer(self):
        weight = 75
        height = 180
        
        user = User.objects.create_user(username="testuser", password="password")
        profile = UserProfile.objects.create(user=user, weight=weight, height=height)
        
        experience = "2 years"
        
        # Create a django user and link it to our custom personal trainer profile
        personal_trainer = User.objects.create_user(username="testPT", password="password")
        personal_trainer_profile = PersonalTrainerProfile.objects.create(user=user, experience=experience)
        
        profile.personal_trainer = personal_trainer_profile
        
        # Deleting the personal trainer should set the personal trainer field to Null
        personal_trainer_profile.delete()
        
        profile.refresh_from_db()
        
        # Make sure that the personal trainer field was set to Null
        self.assertIsNone(profile.personal_trainer)
        
            
class PersonalTrainerProfileModelTest(TestCase):
    
    def test_create_personal_trainer_basic(self):
        experience = "2 years"
        pt_type = "strength"
        
        # Create a django user and link it to our custom personal trainer profile
        user = User.objects.create_user(username="testuser", password="password")
        profile = PersonalTrainerProfile.objects.create(user=user, experience=experience, pt_type=pt_type)
        
        # Verify that these values was set as expected
        self.assertEqual(profile.user, user)
        self.assertEqual(profile.experience, experience)
        self.assertEqual(profile.pt_type, pt_type)
    
    def test_create_personal_trainer_without_experience(self):
        # Test the creation of a personal trainer without specifying experience
        experience = "none"
        user = User.objects.create_user(username="testuser", password="password")
        profile = PersonalTrainerProfile.objects.create(user=user)
        
        # None should have been assigned for this attribute
        self.assertEqual(profile.experience, experience)
    
    def test_delete_personal_trainer_cascade(self):
        user = User.objects.create_user(username="testuser", password="password")
        profile = PersonalTrainerProfile.objects.create(user=user)
        
        # Deleting the user should also delete the personal trainer profile
        user.delete()
        
        # Make sure that the personal trainer profile was deleted
        self.assertEqual(PersonalTrainerProfile.objects.count(), 0)
    
    def test_no_pt_type_results_in_correct_default(self):
        experience = "2 years"
        default_pt_type = "general"
        
        user = User.objects.create_user(username="testuser", password="password")
        profile = PersonalTrainerProfile.objects.create(user=user, experience=experience)
        
        self.assertEqual(profile.pt_type, default_pt_type)
        

class ExerciseModelTest(TestCase):
    def setUp(self):
        self.name = "test exercise"
        self.description = "test description"
        self.muscle_category = "arms"
        self.muscle_group = "test muscle group"
        self.image_path = "exercise_images/pec_deck.png"
    
    def test_create_exercise_basic(self):        
        exercise = Exercise.objects.create(name=self.name, description=self.description, muscle_category=self.muscle_category, muscle_group=self.muscle_group, image=self.image_path)
        
        self.assertEqual(exercise.name, self.name)
        self.assertEqual(exercise.description, self.description)
        self.assertEqual(exercise.muscle_category, self.muscle_category)
        self.assertEqual(exercise.muscle_group, self.muscle_group)
        self.assertEqual(exercise.image, self.image_path)
    
    
    def test_create_exercise_with_empty_name(self):
        exercise = Exercise(description=self.description, muscle_category=self.muscle_category, muscle_group=self.muscle_group, image=self.image_path)
        
        # Should raise a validation error as name is a required field
        with self.assertRaises(ValidationError):
            exercise.full_clean()
    
    def test_create_exercise_with_empty_description(self):
        exercise = Exercise(name=self.name, muscle_category=self.muscle_category, muscle_group=self.muscle_group, image=self.image_path)
        
        with self.assertRaises(ValidationError):
            exercise.full_clean()
    
    def test_create_exercise_with_empty_muscle_group(self):
        exercise = Exercise(name=self.name, description=self.description, muscle_category=self.muscle_category, image=self.image_path)
        
        with self.assertRaises(ValidationError):
            exercise.full_clean()        
        
    def test_str_method(self):
        exercise = Exercise.objects.create(name=self.name, description=self.description, muscle_group=self.muscle_group)
        
        #  String method should return the name of the exercise
        self.assertEqual(str(exercise), self.name)
    
    def test_no_muscle_category_results_to_correct_default(self):
        default_muscle_category = "chest"
        exercise = Exercise.objects.create(name=self.name, description=self.description, muscle_group=self.muscle_group, image=self.image_path)
        
        self.assertEqual(exercise.muscle_category, default_muscle_category)
        

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
        
        # Ensure that the date was set automatically
        self.assertIsNotNone(workout.date_created)
        
        # It is the job of the view to add the user as an owner
        self.assertEqual(workout.owners.count(), 0)
        
        # Make sure that the two exercises were added to the workout
        self.assertIn(self.first_exercise, workout.exercises.all())
        self.assertIn(self.second_exercise, workout.exercises.all())
        
    
    def test_create_workout_without_author(self):
        name = "test workout"
        workout = Workout.objects.create(name=name)
        
        self.assertIsNone(workout.author)
    
    def test_create_workout_with_name_exceeding_max_length(self):
        # Generate a name that is too long
        name = "A" * 256
        
        workout = Workout(name=name, author=self.user)
        
        # Should raise a validation error as it exceeds max length
        with self.assertRaises(ValidationError):
            workout.full_clean()
    
    def test_delete_user(self):
        workout = Workout.objects.create(name="test workout", author=self.user)
        
        # Deleting the author should set the author field to null
        self.user.delete()
        
        # Get the updated workout instance
        workout.refresh_from_db()
        self.assertIsNone(workout.author)
        

class WorkoutSessionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")

        # Create a test workout
        self.workout = Workout.objects.create(name="test workout", author=self.user)

    def test_create_workout_session_basic(self):
        # Add calories burned to the workout session
        calories_burned = 0.5
        
        duration = timedelta(hours=1, minutes=30, seconds=0)
        
        workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout, calories_burned=calories_burned, duration=duration)

        self.assertEqual(workout_session.user, self.user)
        self.assertEqual(workout_session.workout, self.workout)
        self.assertEqual(workout_session.calories_burned, calories_burned)
        self.assertEqual(workout_session.duration, duration)

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
            workout_session.full_clean()
    
    def test_create_workout_session_with_negative_duration(self):
        calories_burned = 0.5
        duration = timedelta(hours=-1, minutes=30, seconds=0)
        
        workout_session = WorkoutSession(user=self.user, workout=self.workout, calories_burned=calories_burned, duration=duration)
        
        with self.assertRaises(ValidationError):
            workout_session.save()
    
    def test_delete_user_cascade(self):
        workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout)

        # Deleting the user should also delete the workout session
        self.user.delete()

        # Make sure that the workout session was deleted
        self.assertEqual(WorkoutSession.objects.count(), 0)
    
    def test_delete_workout_cascade(self):
        workout_session = WorkoutSession.objects.create(user=self.user, workout=self.workout)

        # Deleting the workout should also delete the workout session
        self.workout.delete()

        # Make sure that the workout session was deleted
        self.assertEqual(WorkoutSession.objects.count(), 0)
        


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
    
    def test_delete_exercise_cascade(self):
        exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.workout_session)

        # Deleting the exercise should also delete the exercise session
        self.exercise.delete()

        # Make sure that the exercise session was deleted
        self.assertEqual(ExerciseSession.objects.count(), 0)
    
    def test_delete_workout_session_cascade(self):
        exercise_session = ExerciseSession.objects.create(exercise=self.exercise, workout_session=self.workout_session)

        # Deleting the workout session should also delete the exercise session
        self.workout_session.delete()
        
        # Make sure that the exercise session was deleted
        self.assertEqual(ExerciseSession.objects.count(), 0)


class SetModelTest(TestCase):
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
    
    def test_delete_exercise_session_cascade(self):
        exercise_set = Set.objects.create(exercise_session=self.exercise_session, repetitions=self.repetitions, weight=self.weight)

        # Deleting the exercise session should also delete the set
        self.exercise_session.delete()

        # Make sure that the set was deleted
        self.assertEqual(Set.objects.count(), 0)


class ChatRoomModelTest(TestCase):
    def setUp(self):
        self.first_user = User.objects.create_user(username="firstTestuser", password="password")
        self.second_user = User.objects.create_user(username="secondTestuser", password="password")
    
    def test_create_chat_room_basic(self):
        name = "test chat room"
        chat_room = ChatRoom.objects.create(name=name)
        
        # Add the two users as participants
        chat_room.participants.add(self.first_user, self.second_user)
        
        self.assertEqual(chat_room.name, name)
        self.assertIn(self.first_user, chat_room.participants.all())
        self.assertIn(self.second_user, chat_room.participants.all())
        self.assertIsNotNone(chat_room.date_created)
    
    def test_create_chat_room_without_name(self):
        chat_room = ChatRoom()
        
        with self.assertRaises(ValidationError):
            chat_room.full_clean() 
        
    def test_create_chat_room_with_name_exceeding_max_length(self):
        # Generate a name that is too long
        name = "A" * 256
        
        chat_room = ChatRoom(name=name)
        
        # Should raise a validation error since the name exceeds max length
        with self.assertRaises(ValidationError):
            chat_room.full_clean()
    
    def test_create_chat_room_without_participants(self):
        name = "test chat room"
        chat_room = ChatRoom(name=name)
        
        # Should not raise an error as participants is not a required field
        chat_room.save()

class MessageModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.chat_room = ChatRoom.objects.create(name="test chat room")
    
    def test_create_message_basic(self):
        content = "test message"
        message = Message.objects.create(sender=self.user, content=content, chat_room=self.chat_room)
        
        self.assertEqual(message.sender, self.user)
        self.assertEqual(message.content, content)
        self.assertIsNotNone(message.date_sent)
        self.assertEqual(message.chat_room, self.chat_room)
    
    def test_create_message_without_content(self):
        message = Message(sender=self.user, chat_room=self.chat_room)
        
        # Should raise a validation error as content is a required field
        with self.assertRaises(ValidationError):
            message.full_clean()
    
    def test_create_message_without_chat_room(self):
        content = "test message"
        message = Message(sender=self.user, content=content)
        
        with self.assertRaises(IntegrityError):
            message.save()
    
    def test_create_message_without_sender(self):
        content = "test message"
        message = Message(content=content, chat_room=self.chat_room)
        d
        with self.assertRaises(IntegrityError):
            message.save()
    
    def test_delete_chat_room_cascade(self):
        message = Message.objects.create(sender=self.user, content="test message", chat_room=self.chat_room)
        
        self.chat_room.delete()
        
        self.assertEqual(Message.objects.count(), 0)
    
    def test_delete_sender_cascade(self):
        message = Message.objects.create(sender=self.user, content="test message", chat_room=self.chat_room)
        self.user.delete()
        
        self.assertEqual(Message.objects.count(), 0)

class WorkoutMessageModelTest(TestCase):
    def  setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        
        self.exercise = Exercise.objects.create(name="Push-up", description="A classic exercise.", muscle_group="Chest")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout.exercises.set([self.exercise])
    
    def test_create_workout_message_basic(self):
        workout_message = WorkoutMessage.objects.create(workout=self.workout, chat_room=self.chat_room, sender=self.user)
        
        self.assertEqual(workout_message.workout, self.workout)
        self.assertEqual(workout_message.chat_room, self.chat_room)
        self.assertEqual(workout_message.sender, self.user)
        
        self.assertIsNotNone(workout_message.date_sent)
    
    def  test_create_workout_message_without_workout(self):
        workout_message = WorkoutMessage(chat_room=self.chat_room, sender=self.user)
        
        with self.assertRaises(IntegrityError):
            workout_message.save()
    
    def test_create_workout_message_without_chat_room(self):
        workout_message = WorkoutMessage(workout=self.workout, sender=self.user)
        
        with self.assertRaises(IntegrityError):
            workout_message.save()
    
    def test_create_workout_message_without_sender(self):
        workout_message = WorkoutMessage(workout=self.workout, chat_room=self.chat_room)
        
        with self.assertRaises(IntegrityError):
            workout_message.save()
    
    def test_delete_workout_cascade(self):
        workout_message = WorkoutMessage.objects.create(workout=self.workout, chat_room=self.chat_room, sender=self.user)
        
        self.workout.delete()
        
        self.assertEqual(WorkoutMessage.objects.count(), 0)
    
    def test_delete_chat_room_cascade(self):
        workout_message = WorkoutMessage.objects.create(workout=self.workout, chat_room=self.chat_room, sender=self.user)
        
        # Deleting the chat room should also delete the workout message
        self.chat_room.delete()     
        # Make sure that the workout message was deleted
        self.assertEqual(WorkoutMessage.objects.count(), 0)
    
    def test_delete_sender_cascade(self):
        workout_message = WorkoutMessage.objects.create(workout=self.workout, chat_room=self.chat_room, sender=self.user)
        
        # Deleting the sender should also delete the workout message
        self.user.delete()
        
        # Make sure that the workout message was deleted
        self.assertEqual(WorkoutMessage.objects.count(), 0)

class ScheduledWorkoutModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.scheduled_date = now() + timedelta(days=1)
    
    def test_create_scheduled_workout_basic(self):
        # Schedule the workout for the same time tomorrow
        scheduled_workout = ScheduledWorkout.objects.create(user=self.user, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        self.assertEqual(scheduled_workout.user, self.user)
        self.assertEqual(scheduled_workout.workout_template, self.workout)
        self.assertEqual(scheduled_workout.scheduled_date, self.scheduled_date)

    def test_create_scheduled_workout_with_empty_workout(self):
        scheduled_workout = ScheduledWorkout(user=self.user, scheduled_date=self.scheduled_date)
        
        # Should raise an integrity error as it is a required field
        with self.assertRaises(IntegrityError):
            scheduled_workout.save()
    
    def test_create_scheduled_workout_with_empty_user(self):
        scheduled_workout = ScheduledWorkout(workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        with self.assertRaises(IntegrityError):
            scheduled_workout.save()
    
    def test_create_scheduled_workout_with_empty_scheduled_date(self):
        scheduled_workout = ScheduledWorkout(user=self.user, workout_template=self.workout)
        
        with self.assertRaises(IntegrityError):
            scheduled_workout.save()
    
    def test_str_method(self):
        workout_name = self.workout.name
        string = f"{workout_name} scheduled on {self.scheduled_date}"
        scheduled_workout = ScheduledWorkout.objects.create(user=self.user, workout_template=self.workout, scheduled_date=self.scheduled_date)
       
        self.assertEqual(string, str(scheduled_workout))
    
    def test_delete_user_cascade(self):
        scheduled_workout = ScheduledWorkout.objects.create(user=self.user, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        self.user.delete()
        
        # Make sure the scheduled workout was deleted
        self.assertEqual(ScheduledWorkout.objects.count(), 0)
    
    def test_delete_workout_template_cascade(self):
        scheduled_workout = ScheduledWorkout.objects.create(user=self.user, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        self.workout.delete()
        
        self.assertEqual(ScheduledWorkout.objects.count(), 0)

class NotificationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.sender = self.second_user.username
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        
        self.message = "testMessage"
        self.workout = Workout.objects.create(name="test workout", author=self.second_user)
    
    def test_create_message_notification_basic(self):
        notification = Notification.objects.create(user=self.user, sender=self.sender, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message=self.message)
        
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.sender, self.sender)
        self.assertEqual(notification.chat_room_id, self.chat_room.id)
        self.assertEqual(notification.chat_room_name, self.chat_room.name)
        self.assertEqual(notification.message, self.message)
        self.assertIsNone(notification.workout_message)
        self.assertIsNotNone(notification.date_sent)
    
    def test_create_workout_message_notification_basic(self):
        notification = Notification.objects.create(user=self.user, sender=self.sender, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, workout_message=self.workout)
        
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.sender, self.sender)
        self.assertEqual(notification.chat_room_id, self.chat_room.id)
        self.assertEqual(notification.chat_room_name, self.chat_room.name)
        self.assertEqual(notification.workout_message, self.workout)
        self.assertIsNone(notification.message)
        self.assertIsNotNone(notification.date_sent)
    
    def test_create_message_notification_with_empty_user(self):
        notification = Notification(sender=self.sender, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message=self.message)
        
        with self.assertRaises(ValidationError):
            notification.save()
    
    def test_create_message_notification_with_empty_sender(self):
        notification = Notification(user=self.user, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message=self.message)
        
        with self.assertRaises(ValidationError):
            notification.full_clean()  
    
    def test_create_message_notification_with_sender_exceeding_max_length(self):
        sender = "A" * 256
        
        notification = Notification(user=self.user, sender=sender, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message=self.message)
        
        with self.assertRaises(ValidationError):
            notification.full_clean()
    
    def test_create_message_notification_with_empty_chat_room_id(self):
        notification = Notification(user=self.user, sender=self.sender, chat_room_name=self.chat_room.name, message=self.message)
        
        with self.assertRaises(ValidationError):
            notification.full_clean()
    
    def  test_create_message_notification_with_non_existent_chat_room_id(self):
        non_existent_chat_room_id = 9999
        
        notification = Notification(user=self.user, sender=self.sender, chat_room_id=non_existent_chat_room_id, chat_room_name=self.chat_room.name, message=self.message)
        
        with self.assertRaises(ValidationError):
            notification.save()
        
    def test_create_message_notification_with_empty_chat_room_name(self):
        notification = Notification(user=self.user, sender=self.sender, chat_room_id=self.chat_room.id, message=self.message)
        
        with self.assertRaises(ValidationError):
            notification.save()
    
    def test_create_message_notification_with_wrong_chat_room_name(self):
        wrong_chat_room_name = "wrong name"
        notification = Notification(user=self.user, sender=self.sender, chat_room_id=self.chat_room.id, chat_room_name=wrong_chat_room_name, message=self.message)
        
        with self.assertRaises(ValidationError):
            notification.save()
    
    def test_create_message_notification_with_user_not_part_of_the_chat_room(self):
        user = User.objects.create_user(username="someUser", password="password")
        notification = Notification(user=user, sender=self.sender, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message=self.message)
        
        with self.assertRaises(ValidationError):
            notification.save()
    
    def test_create_workout_message_notification_with_a_non_workout(self):
        non_workout = "not a workout object"
        
        with self.assertRaises(ValueError):
            notification = Notification(user=self.user, sender=self.sender, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, workout_message=non_workout)
    
    def test_delete_user_cascade(self):
        notification = Notification.objects.create(user=self.user, sender=self.sender, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message=self.message)
        
        self.user.delete()
        
        self.assertEqual(Notification.objects.count(), 0)
        
    def test_delete_workout_message_cascade(self):
        notification = Notification.objects.create(user=self.user, sender=self.sender, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, workout_message=self.workout)
        
        self.workout.delete()
        
        self.assertEqual(Notification.objects.count(), 0)

class TestPersonalTrainerScheduledWorkout(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        self.trainer = User.objects.create_user(username="trainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.user_profile.personal_trainer = self.trainer_profile
        
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.scheduled_date = now() + timedelta(days=1)
        
    def test_create_personal_trainer_scheduled_workout_basic(self):
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout.objects.create(client=self.user, pt=self.trainer, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        self.assertEqual(personal_trainer_scheduled_workout.client, self.user)
        self.assertEqual(personal_trainer_scheduled_workout.pt, self.trainer)
        self.assertEqual(personal_trainer_scheduled_workout.workout_template, self.workout)
        self.assertEqual(personal_trainer_scheduled_workout.scheduled_date, self.scheduled_date)
    
    def test_create_personal_trainer_scheduled_workout_with_empty_workout(self):
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout(client=self.user, pt=self.trainer, scheduled_date=self.scheduled_date)
        
        with self.assertRaises(IntegrityError):
            personal_trainer_scheduled_workout.save()
    
    def test_create_personal_trainer_scheduled_workout_with_a_non_workout(self):
        non_workout = "not a workout object"
        
        with self.assertRaises(ValueError):
            PersonalTrainerScheduledWorkout(client=self.user, pt=self.trainer, workout_template=non_workout, scheduled_date=self.scheduled_date)
        
    def test_create_personal_trainer_scheduled_workout_with_empty_client(self):
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout(pt=self.trainer, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        with self.assertRaises(IntegrityError):
            personal_trainer_scheduled_workout.save()
    
    def test_create_personal_trainer_scheduled_workout_with_empty_pt(self):
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout(client=self.user, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        with self.assertRaises(IntegrityError):
            personal_trainer_scheduled_workout.save()
    
    def test_create_personal_trainer_scheduled_workout_with_empty_scheduled_date(self):
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout(client=self.user, pt=self.trainer, workout_template=self.workout)
        
        with self.assertRaises(IntegrityError):
            personal_trainer_scheduled_workout.save()
    
    def test_str_method(self):
        workout_name = self.workout.name
        string = f"{workout_name} scheduled on {self.scheduled_date}"
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout.objects.create(client=self.user, pt=self.trainer, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        self.assertEqual(string, str(personal_trainer_scheduled_workout))
    
    def test_delete_client_cascade(self):
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout.objects.create(client=self.user, pt=self.trainer, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        self.user.delete()
        
        self.assertEqual(PersonalTrainerScheduledWorkout.objects.count(), 0)
    
    def test_delete_pt_cascade(self):
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout(client=self.user, pt=self.trainer, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        self.trainer.delete()
        
        self.assertEqual(PersonalTrainerScheduledWorkout.objects.count(), 0)
    
    def test_workout_template_cascacde(self):
        personal_trainer_scheduled_workout = PersonalTrainerScheduledWorkout(client=self.user, pt=self.trainer, workout_template=self.workout, scheduled_date=self.scheduled_date)
        
        self.workout.delete()
        
        self.assertEqual(PersonalTrainerScheduledWorkout.objects.count(), 0)

class TestFailedLoginAttempt(TestCase):
    def setUp(self):
        self.username = "testUser"
        self.ip_address = "192.168.1.1"
    
    def test_create_failed_login_attempt_basic(self):
        failed_login_attempt = FailedLoginAttempt.objects.create(username=self.username, ip_address=self.ip_address)
        
        self.assertEqual(failed_login_attempt.username, self.username)
        self.assertEqual(failed_login_attempt.ip_address, self.ip_address)
        self.assertIsNotNone(failed_login_attempt.timestamp)
    
    def test_create_failed_login_attempt_with_empty_username(self):
        failed_login_attempt = FailedLoginAttempt(ip_address=self.ip_address)
        
        with self.assertRaises(ValidationError):
            failed_login_attempt.full_clean()
    
    def test_create_failed_login_attempt_with_username_exceeding_max_length(self):
        username = "A" * 256
        
        failed_login_attempt = FailedLoginAttempt(username=username, ip_address=self.ip_address)
        
        with self.assertRaises(ValidationError):
            failed_login_attempt.full_clean()
    
    def test_create_failed_login_attempt_with_empty_ip_address(self):
        failed_login_attempt = FailedLoginAttempt(username=self.username)
        
        with self.assertRaises(IntegrityError):
            failed_login_attempt.save()
    
    def test_create_failed_login_attempt_with_valid_ipv6_address(self):
        ipv6_address = "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
        
        failed_login_attempt = FailedLoginAttempt.objects.create(username=self.username, ip_address=ipv6_address)
        
        self.assertEqual(failed_login_attempt.ip_address, ipv6_address)
    
    def test_create_failed_login_attempt_with_invalid_ip_address(self):
        invalid_ip_address = "invalid_ip"
        
        failed_login_attempt = FailedLoginAttempt(username=self.username, ip_address=invalid_ip_address)
        
        with self.assertRaises(ValidationError):
            failed_login_attempt.full_clean()
    
        
            
        
        
        
    
            
    
        
            
            
    
    
        
        
        
        
        
        
        
        




    


