from django.urls import reverse
from rest_framework import status
from backend.models import UserProfile, PersonalTrainerProfile
from backend.serializers import DefaultUserSerializer, UserSerializer
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

class TestListUserView(APITestCase):
    def setUp(self):
        self.user = User.objects.create(username="testuser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, height=180, weight=75)
        self.second_user = User.objects.create(username="secondTestuser", password="password")
        self.second_user_profile = UserProfile.objects.create(user=self.second_user, height=200, weight=100)
        self.url = reverse("user-list")
        
        self.users = [self.user, self.second_user]
    
    def test_list_user_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = UserSerializer(self.users, many=True)
    
        self.assertEqual(len(response.data), len(self.users))
        self.assertEqual(response.data, serializer.data)

    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_user_does_not_list_personal_trainers(self):
        # Create a personal trainer
        personal_trainer = User.objects.create(username="test_trainer", password="password")
        personal_trainer_profile = PersonalTrainerProfile.objects.create(user=personal_trainer, experience="5 years")
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Make sure that the queryset did not return the personal trainer
        self.assertEqual(len(response.data), len(self.users))
        self.assertNotIn(personal_trainer.username, [user['username'] for user in response.data])

class TestUserDetailView(APITestCase):
    def setUp(self):
        self.user = User.objects.create(username="testuser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, height=180, weight=75)
        
        self.url = reverse("user-detail", kwargs={"pk": self.user.id})
    
    def test_user_detail_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = UserSerializer(self.user)
        self.assertEqual(response.data, serializer.data)
    
    def test_user_detail_of_other_user(self):
        second_user = User.objects.create(username="secondTestuser", password="password")
        second_user_profile = UserProfile.objects.create(user=second_user, height=200, weight=100)
        
        self.client.force_authenticate(user=second_user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Make sure it was the details of the first user that was retrieved
        serializer = UserSerializer(self.user)
        self.assertEqual(response.data, serializer.data)
    
    def test_user_detail_non_existent_user(self):
        url = reverse("user-detail", kwargs={"pk": 9999})
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(url)
        
        # Should not find the user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class TestListPtAndUserView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        self.trainer = User.objects.create_user(username="testTrainer", password="password")
        self.trainer_profile = PersonalTrainerProfile.objects.create(user=self.trainer)
        
        self.second_trainer = User.objects.create_user(username="secondTestUser", password="password")
        self.second_trainer_profile = PersonalTrainerProfile.objects.create(user=self.second_trainer)
        
        self.users = [self.user, self.trainer, self.second_trainer]
        
        self.url = reverse("user-pt-list")
        
    def test_list_pt_and_user_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = DefaultUserSerializer(self.users, many=True)
        
        self.assertEqual(len(self.users), len(response.data))
        self.assertEqual(serializer.data, response.data)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class TestUpdateUserView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.user_profile = UserProfile.objects.create(user=self.user, height=180, weight=75)
        
        self.url = reverse("user-update", kwargs={"pk": self.user.id})
    
    def test_update_user_basic(self):
        self.client.force_authenticate(user=self.user)
        
        # Only update some fields
        new_data = {
            "profile": {
                "height": 185,
                "weight": 80
            }
        }
        
        response = self.client.patch(self.url, data=new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        updated_user = UserProfile.objects.get(id=self.user_profile.id)
        
        self.assertEqual(updated_user.height, 185)
        self.assertEqual(updated_user.weight, 80)

    def test_update_other_user(self):
        second_user = User.objects.create(username="secondUser", password="password")
        
        self.client.force_authenticate(user=second_user)
        
        new_data = {
            "profile": {
                "height": 185,
                "weight": 80
            }
        }
        
        response = self.client.patch(self.url, data=new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        original_user = UserProfile.objects.get(id=self.user_profile.id)
        
        # Check that the attributes have not been updated
        self.assertEqual(original_user.height, 180)
        self.assertEqual(original_user.weight, 75)
    
    def test_update_password(self):
        self.client.force_authenticate(user=self.user)
        
        new_data = {
            "password": "newPassword"
        }
        
        # Should not be able to update your own password
        response = self.client.patch(self.url, data=new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unauthenticated_user_do_not_have_access(self):
        new_data = {
            "profile": {
                "height": 185,
                "weight": 80
            }
        }
        response = self.client.patch(self.url, data=new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
