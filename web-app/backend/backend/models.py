from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal

# Model for normal users
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Example attributes
    weight = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    role = models.CharField(max_length=20, default="user")

# Model for personal trainers
class PersonalTrainerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trainer_profile')
    
    # Example attributes
    experience = models.CharField(max_length=100, blank=True, default='none')  
    role = models.CharField(max_length=20, default="personal_trainer")
    

class Exercise(models.Model):
    name = models.CharField(max_length=255, blank=False)
    
    # How the exercise is performed
    description = models.TextField(blank=False, null=False)
    muscle_group = models.CharField(max_length=255, null=False, blank=False)

    # Approx number of calories burned per rep
    calories = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=False)
    
    image = models.ImageField(upload_to='exercise_images/', blank=True, null=True)

    def __str__(self):
        return self.name
     

class Workout(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workouts")
    name = models.CharField(max_length=255)
    
    # Set the date created to the current time
    date_created = models.DateTimeField(auto_now=True)
    exercises = models.ManyToManyField(Exercise)

class WorkoutSession(models.Model):
    # The user performing the workout is not necessarily the same as the one that created the workout
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workout_sessions", null=True)
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)

    # Total number of calories burned in the workout
    calories_burned = models.PositiveIntegerField(null=True, blank=True)

# Represents a single exercise being performed in a workout session
class ExerciseSession(models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    workout_session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name="exercise_sessions")

class Set(models.Model):
    exercise_session = models.ForeignKey(ExerciseSession, on_delete=models.CASCADE, related_name="sets")
    repetitions = models.PositiveIntegerField()
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=False, validators=[MinValueValidator(Decimal("0.00"))])

    # Visit later, may need to manually check if the weight is 5 digits, and is assigned 2 decimal places
    def clean(self):
        return super().clean()

class ChatRoom(models.Model):
    participants = models.ManyToManyField(User)
    date_created = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=255, blank=False)

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    content = models.TextField(blank=False, null=False)
    date_sent = models.DateTimeField(auto_now_add=True)
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")





