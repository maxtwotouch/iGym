from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

# Model for normal users
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Example attributes
    weight = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    height = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    role = models.CharField(max_length=20, default="user")

# Model for personal trainers
class PersonalTrainerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trainer_profile')
    
    # Example attributes
    experience = models.CharField(max_length=100, blank=True, default='none')  
    role = models.CharField(max_length=20, default="personal_trainer")
    
    
    

class Exercise(models.Model):
    name = models.CharField(max_length=255)
    
    # How the exercise is performed
    description = models.TextField(blank=False, null=False)
    muscle_group = models.CharField(max_length=255, null=False, blank=False)

    def __str__(self):
        return self.name
    
    

class Workout(models.Model):
    author = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="workouts")
    name = models.CharField(max_length=255)
    date_created = models.DateTimeField(auto_now=True)
    exercises = models.ManyToManyField(Exercise)

class WorkoutSession(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    

class WorkoutExerciseSession(models.Model):
    workout_session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE)
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    
    sets = models.PositiveIntegerField()
    repetitions = models.PositiveIntegerField()
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=False)


