from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.contrib.auth.validators import UnicodeUsernameValidator
import re

# Custom validator for names to avoid SQL injections
def validate_name(name):
    if not re.fullmatch(r"^[\w.@+\- ]+$", name, re.UNICODE):
        raise ValidationError("Enter a valid name. Only letters, digits, spaces, and @/./+/-/_ characters are allowed.")
    return name


# Model for personal trainers
class PersonalTrainerProfile(models.Model):
    PT_TYPES = [
        ("general", "General Fitness Trainer"),
        ("strength", "Strength and Conditioning Trainer"),
        ("functional", "Functional Training Coach"),
        ("bodybuilding", "Bodybuilding Coach"),
        ("physio", "Physical Therapist"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trainer_profile')
    
    experience = models.CharField(max_length=100, blank=True, default='none')  
    role = models.CharField(max_length=20, default="trainer")
    pt_type = models.CharField(max_length=20, choices=PT_TYPES, default="general")

# Model for normal users
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    weight = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    
    role = models.CharField(max_length=20, default="user")

    personal_trainer = models.ForeignKey(PersonalTrainerProfile, on_delete=models.SET_NULL, related_name="clients", blank=True, null=True)
    pt_chatroom = models.ForeignKey('ChatRoom', on_delete=models.SET_NULL, related_name="pt_chatroom", null=True, blank=True)
    
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)

class Exercise(models.Model):
    name = models.CharField(max_length=255, blank=False)
    
    # How the exercise is performed
    description = models.TextField(blank=False, null=False)
   
    # The muscle group that the exercise targets
    muscle_group = models.CharField(max_length=255, null=False, blank=False)
    
    MUSCLE_CATEGORIES = [
        ("chest", "Chest"),
        ("back", "Back"),
        ("legs", "Legs"),
        ("arms", "Arms"),
        ("shoulders", "Shoulders"),
        ("abs", "Abdominals"),
    ]
    muscle_category = models.CharField(max_length=20, choices=MUSCLE_CATEGORIES, default="chest")
    
    # Illustration of the exercise
    image = models.ImageField(upload_to='exercise_images/', blank=True, null=True)

    def __str__(self):
        return self.name
     

class Workout(models.Model):
    # The person that created the workout
    author = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="workouts", null=True)
    
    # List of people currently owning the workout
    owners = models.ManyToManyField(User, blank=True)
    name = models.CharField(max_length=255, validators=[validate_name])

    # Set the date created to the current time
    date_created = models.DateTimeField(auto_now=True)
    
    # Exercises conatined in the workout
    exercises = models.ManyToManyField(Exercise)


class WorkoutSession(models.Model):
    # The user performing the workout is not necessarily the same as the one that created the workout
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workout_sessions", blank=False, null=False)
    
    # The workout template that was followed 
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, blank=False, null=False)
    
    start_time = models.DateTimeField(auto_now_add=True)
    
    calories_burned = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal("0.00"))])
    duration = models.DurationField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.duration is not None and self.duration.total_seconds() < 0:
            raise ValidationError("Duration cannot be negative")
        super().save(*args, **kwargs)
        

# Represents a single exercise being performed in a workout session
class ExerciseSession(models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    workout_session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name="exercise_sessions")

class Set(models.Model):
    exercise_session = models.ForeignKey(ExerciseSession, on_delete=models.CASCADE, related_name="sets")
    repetitions = models.PositiveIntegerField()
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=False, validators=[MinValueValidator(Decimal("0.00"))])


class ChatRoom(models.Model):
    # People currently in the chatroom, many to many field since the chat room can have multiple participants and people can be in multiple chat rooms
    participants = models.ManyToManyField(User)
    date_created = models.DateTimeField(auto_now_add=True)
    
    name = models.CharField(max_length=255, blank=False, null=False, validators=[validate_name])

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages", blank=False, null=False)
    content = models.TextField(blank=False, null=False)
    date_sent = models.DateTimeField(auto_now_add=True)
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages", blank=False, null=False)
    
class WorkoutMessage(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, blank=False, null=False)
    date_sent = models.DateTimeField(auto_now_add=True)
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="workout_messages", blank=False, null=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workout_messages", blank=False, null=False)

class ScheduledWorkout(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="scheduled_workouts", blank=False, null=False)
    workout_template = models.ForeignKey(Workout, on_delete=models.CASCADE, blank=False, null=False)
    scheduled_date = models.DateTimeField(blank=False, null=False)
     
    def __str__(self):
         return f"{self.workout_template.name} scheduled on {self.scheduled_date}"

class PersonalTrainerScheduledWorkout(models.Model):
    # A client and its personal trainer trains together
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pt_scheduled_workouts", blank=False, null=False)
    pt = models.ForeignKey(User, on_delete=models.CASCADE, related_name="arranged_workouts_clients", blank=False, null=False)
    
    workout_template = models.ForeignKey(Workout, on_delete=models.CASCADE, blank=False, null=False)
    scheduled_date = models.DateTimeField(blank=False, null=False)
     
    def __str__(self):
         return f"{self.workout_template.name} scheduled on {self.scheduled_date}"
    

class Notification(models.Model):
    # The user receiving the notification
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications", blank=False, null=False)
    
    # Sender of the message corresponding to the notification
    sender = models.CharField(max_length=255, blank=False, null=False)
    
    chat_room_id = models.IntegerField(blank=False, null=False)
    chat_room_name = models.CharField(max_length=255, blank=False, null=False)
   
    date_sent = models.DateTimeField(auto_now_add=True)
    message = models.TextField(blank=True, null=True)
    
    # Need Workout model for getting the latest name of the workout
    workout_message = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    
    # Need to check that the chat room exist in the save method, since it does not have a corresponding create view
    def save(self, *args, **kwargs):
        try:
            chat_room = ChatRoom.objects.get(id=self.chat_room_id)
        
        except ChatRoom.DoesNotExist:
            raise ValidationError(f"Chat room does not exist")
        
        if chat_room.name != self.chat_room_name:
            raise ValidationError(f"Chat room name does not match the actual chat room name")
        
        # Check if the user is present
        if not self.user_id:
            raise ValidationError("Notification must have a user.")
        
        # Check that the sender and the user are participants in the chat room
        if not chat_room.participants.filter(id=self.user.id).exists():
            raise ValidationError(f"User is not part of the chat room")
        
        super().save(*args, **kwargs)

class FailedLoginAttempt(models.Model):
    username = models.CharField(max_length=255, blank=False, null=False, validators=[UnicodeUsernameValidator()])
    ip_address = models.GenericIPAddressField(blank=False, null=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.username} from {self.ip_address} at {self.timestamp}"
            
            
            
        
         


