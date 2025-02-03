from django.db import models
from django.contrib.auth.models import User

# Model for normal users
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Example attributes
    weight = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)

# Model for personal trainers
class PersonalTrainerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trainer_profile')
    
    # Example attributes
    experience = models.CharField(max_length=100, default='none')  
    