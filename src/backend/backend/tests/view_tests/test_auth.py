from django.urls import reverse
from rest_framework import status
from backend.models import UserProfile, PersonalTrainerProfile
from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class CreateUserViewTest(APITestCase):
    def setUp(self):
        # Default values
        self.username = "testUser"
        self.password = "somethingThatIsNotSoEasyToGuess2343"
        self.height = 180
        self.weight = 75
        
        self.url = reverse("register_user")
    
    def test_create_user(self):
        
        data = {
            "username": self.username,
            "password": self.password,
            "profile": {
                "height": self.height,
                "weight": self.weight
            }
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
       
       # Check if the user was created
        self.assertEqual(User.objects.count(), 1)

        # Retrieve the user object
        user = User.objects.get(username=self.username)
        
        # Validate the user fields
        self.assertEqual(user.username, self.username)
        self.assertTrue(user.check_password(self.password))
        
        # Check if the profile was created and linked to the user
        self.assertEqual(UserProfile.objects.count(), 1)
        profile = UserProfile.objects.get(user=user)
        
        # Validate the profile fields
        self.assertEqual(profile.height, self.height)
        self.assertEqual(profile.weight, self.weight)
        self.assertIsNone(profile.personal_trainer)
        self.assertIsNone(profile.pt_chatroom)
        self.assertEqual(profile.role, "user")
        
    def test_create_duplicate_username(self):
        first_data = {
            "username": self.username,
            "password": self.password,
            "profile": {
                "height": self.height,
                "weight": self.weight
            }
        }
        
        # Create a second user where the everything is different except the username
        second_data = {
            "username": self.username,
            "password": "somethingNewThatIsNotSoEasyToGuess2343",
            "profile": {
                "height": 190,
                "weight": 80
            }
        }
        
        # Create the two users
        first_response = self.client.post(self.url, first_data, format='json')
        second_response = self.client.post(self.url, second_data, format='json')
        
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Make sure that the second user was not created
        self.assertEqual(User.objects.count(), 1)
    
    def test_create_user_using_username_as_sql_injection(self):
        sql_injection_username = "DROP TABLE users;"
        
        data = {
            "username": sql_injection_username,
            "password": self.password,
            "profile": {
                "height": self.height,
                "weight": self.weight
            }
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_user_with_weak_password(self):
        weak_password = "password123"
        
        data = {
            "username": self.username,
            "password": weak_password,
            "profile": {
                "height": self.height,
                "weight": self.weight
            }
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    
    def test_create_user_does_not_return_password(self):
        data = {
            "username": self.username,
            "password": self.password,
            "profile": {
                "height": self.height,
                "weight": self.weight
            }
        }
    
        response = self.client.post(self.url, data, format='json')
        
        # Verify that the response does not contain the password field
        self.assertNotIn("password", response.data)
        
        
class CreatePersonalTrainerViewTest(APITestCase):
        def test_create_personal_trainer(self):
            url = reverse("register_personal_trainer")
            
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
            
            # Retrieve the user object
            user = User.objects.get(username=username)
            
            self.assertEqual(user.username, username)
            self.assertTrue(user.check_password(password))
            
            # Check if the profile was created and linked to the user
            self.assertEqual(PersonalTrainerProfile.objects.count(), 1)
            
            
            profile = PersonalTrainerProfile.objects.get(user=user)
            
            # Validate the profile fields
            self.assertEqual(profile.experience, experience)
            self.assertEqual(profile.role, "trainer")
            self.assertEqual(profile.pt_type, "general")