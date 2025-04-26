from django.urls import path
from backend.views.chat import (
    ChatRoomRetrieveView, ChatRoomListView, ChatRoomCreateView, ChatRoomDeleteView,
    ListParticipantsInChatRoomView, ListMessagesInChatRoomView, ListWorkoutMessagesInChatRoomView
)

urlpatterns = [
    path("", ChatRoomListView.as_view(), name="chat_rooms-list"),
    path("create/", ChatRoomCreateView.as_view(), name="chat_room-create"),
    path("<int:pk>/", ChatRoomRetrieveView.as_view(), name="chat_room-retrieve"),
    path("delete/<int:pk>/", ChatRoomDeleteView.as_view(), name="chat_room-delete"),
    path("<int:pk>/participants/", ListParticipantsInChatRoomView.as_view(), name="chat_room-participants"),
    path("<int:pk>/messages/", ListMessagesInChatRoomView.as_view(), name="chat_room-messages"),
    path("<int:pk>/workout_messages/", ListWorkoutMessagesInChatRoomView.as_view(), name="chat_room-workout_messages"),
]
