from django.urls import reverse
from rest_framework import status
from backend.models import Notification, ChatRoom, Workout
from backend.serializers import NotificationSerializer
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

class TestNotificationListView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        
        self.notification = Notification.objects.create(user=self.second_user, sender=self.user, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, workout_message=self.workout)
        self.second_notification = Notification.objects.create(user=self.second_user, sender=self.user, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message="here is a workout")
        self.third_notification = Notification.objects.create(user=self.second_user, sender=self.user, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message="no worries")
        
        self.notifications = [self.notification, self.second_notification, self.third_notification]
        
        self.url = reverse("notification-list")
    
    def test_notification_list_basic(self):
        self.client.force_authenticate(user=self.second_user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Make sure that the list is returned with the newest notifications first
        sorted_notifications = sorted(self.notifications, key=lambda n: n.date_sent, reverse=True)

        serializer = NotificationSerializer(sorted_notifications, many=True)
        
        self.assertEqual(len(response.data), len(self.notifications))
        self.assertEqual(response.data, serializer.data)
        
    def test_cannot_list_others_notifications(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)    

    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 

class TestNotificationDeleteView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        
        self.notification = Notification.objects.create(user=self.user, sender=self.second_user, chat_room_id=self.chat_room.id, chat_room_name=self.chat_room.name, message="test message")
        
        self.url = reverse("notification-delete", kwargs={"pk": self.notification.id})
    
    def test_delete_notification_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        self.assertNotIn(self.notification, Notification.objects.all())
    
    def test_delete_non_existent_notification(self):
        url = reverse("notification-delete", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn(self.notification, Notification.objects.all())
    
    def test_delete_other_users_notification(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        self.assertIn(self.notification, Notification.objects.all()) 