from django.test import TestCase
from django.urls import resolve

from backend.views.chat import (
    ChatRoomRetrieveView, ChatRoomListView, ChatRoomCreateView, ChatRoomDeleteView,
    ListParticipantsInChatRoomView, ListMessagesInChatRoomView, ListWorkoutMessagesInChatRoomView
)

class ChatUrlsTest(TestCase):
    def test_gym_url_to_list_chat_rooms_endpoint(self):
        view = resolve('/chat/')
        self.assertEqual(view.func.view_class, ChatRoomListView)
    
    def test_gym_url_to_create_chat_room_endpoint(self):
        view = resolve('/chat/create/')
        self.assertEqual(view.func.view_class, ChatRoomCreateView)
    
    def test_gym_url_to_retrieve_chat_room_endpoint(self):
        view = resolve('/chat/1/')
        self.assertEqual(view.func.view_class, ChatRoomRetrieveView)
    
    def test_gym_url_to_delete_chat_room_endpoint(self):
        view = resolve('/chat/delete/1/')
        self.assertEqual(view.func.view_class, ChatRoomDeleteView)
    
    def test_gym_url_to_list_participants_in_chat_room_endpoint(self):
        view = resolve('/chat/1/participants/')
        self.assertEqual(view.func.view_class, ListParticipantsInChatRoomView)
    
    def test_gym_url_to_list_messages_in_chat_room_endpoint(self):
        view = resolve('/chat/1/messages/')
        self.assertEqual(view.func.view_class, ListMessagesInChatRoomView)
    
    def test_gym_url_to_list_workout_messages_in_chat_room_endpoint(self):
        view = resolve('/chat/1/workout_messages/')
        self.assertEqual(view.func.view_class, ListWorkoutMessagesInChatRoomView)
        