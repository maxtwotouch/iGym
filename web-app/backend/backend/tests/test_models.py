from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from backend.models import UserProfile, PersonalTrainerProfile

class UserProfileModelTest(TestCase):
    
    def test_create_user_basic(self):
        weight = 75
        height = 180
        user = User.objects.create_user(username="testuser", password="password")
        profile = UserProfile.objects.create(user=user, weight=weight, height=height)
        
        self.assertEqual(profile.user, user)
        self.assertEqual(profile.weight, weight)
        self.assertEqual(profile.height, height)
    
    def test_create_user_without_weight_and_height(self):
        user = User.objects.create_user(username="testuser", password="password")
        profile = UserProfile.objects.create(user=user)
        
        self.assertIsNone(profile.weight)
        self.assertIsNone(profile.height)
    
    def test_create_user_with_invalid_height_and_height(self):
        # Test with invalid height and weight
        height = -120
        weight = -75
        user = User.objects.create_user(username="testuser", password="password")
        profile = UserProfile.objects.create(user=user, weight=weight, height=height)
        
        with self.assertRaises(ValidationError):
            profile.full_clean()
            
    

class PersonalTrainerProfileModelTest(TestCase):
    
    def test_create_personal_trainer_basic(self):
        experience = "2 years"
        
        user = User.objects.create_user(username="testuser", password="password")
        profile = PersonalTrainerProfile.objects.create(user=user, experience=experience)
        
        self.assertEqual(profile.user, user)
        self.assertEqual(profile.experience, experience)
    
    def test_create_personal_trainer_without_experience(self):
        experience = "none"
        user = User.objects.create_user(username="testuser", password="password")
        profile = PersonalTrainerProfile.objects.create(user=user)
        
        self.assertEqual(profile.experience, experience)
        
    