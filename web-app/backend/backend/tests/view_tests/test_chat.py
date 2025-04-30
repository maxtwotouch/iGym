from django.urls import reverse
from rest_framework import status
from backend.models import ChatRoom, Message, WorkoutMessage, Workout
from backend.serializers import ChatRoomSerializer, DefaultUserSerializer, MessageSerializer, WorkoutMessageSerializer
from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class TestChatRoomCreateView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.third_user = User.objects.create_user(username="thirdTestUser", password="password")
        
        self.url = reverse("chat_room-create")
        
        self.name = "Test Chat Room"
        self.participants = [self.user.id, self.second_user.id, self.third_user.id]
    
    def test_create_chat_room_basic(self):
        self.client.force_authenticate(user=self.user)
        
        data = {
            "participants": self.participants,
            "name": self.name
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.assertEqual(ChatRoom.objects.count(), 1)
        
        chat_room = ChatRoom.objects.get(id=response.data["id"])
        
        self.assertEqual(chat_room.name, "Test Chat Room")
        self.assertCountEqual(chat_room.participants.all(), [self.user, self.second_user, self.third_user])
        
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_chat_room_with_non_existent_user(self):
        non_existent_user_id = 9999
        
        self.client.force_authenticate(user=self.user)

        data = {
            "participants": [self.user.id, non_existent_user_id],
            "name": self.name
        }
        
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        self.assertEqual(ChatRoom.objects.count(), 0)
    
    def test_create_chat_room_using_name_as_sql_injection(self):
        self.client.force_authenticate(user=self.user)
        sql_injection_name = "DROP TABLE Users;"
        
        data = {
            "participants": self.participants,
            "name": sql_injection_name
        }
        
        response = self.client.post(self.url, data=data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        
class TestChatRoomListView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.third_user = User.objects.create_user(username="thirdTestUser", password="password")
        
        self.first_chat_room = ChatRoom.objects.create(name="firstChatRoom")
        self.first_chat_room.participants.set([self.user, self.second_user])
        
        self.second_chat_room = ChatRoom.objects.create(name="secondChatRoom")
        self.second_chat_room.participants.set([self.user, self.third_user])
        
        self.url = reverse("chat_rooms-list")
        
        # Chatrooms related to self.user
        self.chat_rooms = [self.first_chat_room, self.second_chat_room]        
    
    def test_list_chat_rooms_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = ChatRoomSerializer(self.chat_rooms, many=True)
        
        self.assertEqual(len(response.data), len(self.chat_rooms))
        self.assertEqual(response.data, serializer.data)
    
    def test_cannot_list_others_chat_rooms(self):
        self.client.force_authenticate(user=self.second_user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Make sure that the second user do not retrieve the chatroom between user and third user
        serializer = ChatRoomSerializer([self.first_chat_room], many=True)
        
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data, serializer.data)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TestChatRoomDeleteView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        
        self.url = reverse("chat_room-delete", kwargs={"pk": self.chat_room.id})
    
    def test_still_participants_left_only_removes_participant_from_chat_room(self):
        # Calling the endpoint with more than one participant in it should just make the user leave the chat room, not delete it
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that the chatroom still exist
        self.assertIn(self.chat_room, ChatRoom.objects.all())
        
        # Check that the user that left is not a part of the participants anymore
        self.assertNotIn(self.user, self.chat_room.participants.all())
    
    def test_last_participant_deletes_the_chat_room(self):
        # Make sure there is only one participant left in the chatroom
        self.chat_room.participants.remove(self.user)
        
        self.client.force_authenticate(self.second_user)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that the chat room was deleted
        self.assertEqual(ChatRoom.objects.count(), 0)
    
    def test_delete_others_chat_room(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        self.assertIn(self.chat_room, ChatRoom.objects.all())
    
    def test_delete_non_existent_chat_room(self):
        url = reverse("chat_room-delete", kwargs={"pk": 9999})
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn(self.chat_room, ChatRoom.objects.all())
        
class TestListParticipantsInChatRoomView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        self.third_user = User.objects.create_user(username="thirdTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="Test Chat Room")
        self.chat_room.participants.set([self.user, self.second_user, self.third_user])
        self.participants = [self.user, self.second_user, self.third_user]
        
        self.url = reverse("chat_room-participants", kwargs={"pk": self.chat_room.id})
    
    def test_list_participants_in_chat_room_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = DefaultUserSerializer(self.participants, many=True)
        
        self.assertEqual(len(response.data), len(self.participants))
        self.assertEqual(response.data, serializer.data)
        
    
    def test_list_participants_of_others_chat_room(self):
        # Create a user that is not a part of the chat room
        fourth_user = User.objects.create_user(username="fourthTestUser", password="password")
        self.client.force_authenticate(user=fourth_user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_participants_of_non_existent_chat_room(self):
        url = reverse("chat_room-participants", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
class TestListMessagesInChatRoomView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        
        self.message = Message.objects.create(sender=self.user, content="first message", chat_room=self.chat_room)
        self.second_message = Message.objects.create(sender=self.second_user, content="reply to first message", chat_room=self.chat_room)
        self.third_message = Message.objects.create(sender=self.second_user, content="last message", chat_room=self.chat_room)
        
        self.url = reverse("chat_room-messages", kwargs={"pk": self.chat_room.id})
        
        self.messages = [self.message, self.second_message, self.third_message]
        
    
    def test_list_messages_in_chat_room_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = MessageSerializer(self.messages, many=True)
        
        self.assertEqual(len(response.data), len(self.messages))
        self.assertEqual(response.data, serializer.data)
    
    def test_list_messgaes_of_others_chat_room(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_list_messages_of_non_existent_chat_room(self):
        url = reverse("chat_room-messages", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        

class ListWorkoutMessagesInChatRoomView(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testUser", password="password")
        self.second_user = User.objects.create_user(username="secondTestUser", password="password")
        
        self.chat_room = ChatRoom.objects.create(name="test chat room")
        self.chat_room.participants.set([self.user, self.second_user])
        
        self.workout = Workout.objects.create(name="test workout", author=self.user)
        self.workout_message = WorkoutMessage.objects.create(workout=self.workout, chat_room=self.chat_room, sender=self.user)
        
        self.second_workout = Workout.objects.create(name="second test workout", author=self.second_user)
        self.second_workout_message = WorkoutMessage.objects.create(workout=self.second_workout, chat_room=self.chat_room, sender=self.second_user)
        
        self.url = reverse("chat_room-workout_messages", kwargs={"pk": self.chat_room.id})
        
        self.workout_messages = [self.workout_message, self.second_workout_message]
    
    def test_list_workout_messages_in_chat_room_basic(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        serializer = WorkoutMessageSerializer(self.workout_messages, many=True)
        
        self.assertEqual(len(response.data), len(self.workout_messages))
        self.assertEqual(response.data, serializer.data)
    
    def test_list_workout_messages_of_others_chat_room(self):
        user = User.objects.create_user(username="someUser", password="password")
        
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_workout_messages_of_non_existent_chat_room(self):
        url = reverse("chat_room-workout_messages", kwargs={"pk": 9999})
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_do_not_have_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)