
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from backend.models import UserProfile, PersonalTrainerProfile, Exercise
from backend.serializers import ExerciseSerializer
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
        
    
    # Unauthenticated users should be denied access to this enpoint
    def test_unauthenticated_user_do_not_have_access(self):
        url = reverse("exercise-list")
        
        response = self.client.get(url)
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
        
        
        
    
    
        
    

