from backend.models import ChatRoom, Message, WorkoutMessage
from backend.serializers import ChatRoomSerializer, DefaultUserSerializer, MessageSerializer, WorkoutMessageSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, serializers, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

class ChatRoomCreateView(generics.CreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

class ChatRoomListView(generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    # Get all chat rooms related to the current user
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)

class ChatRoomDeleteView(generics.DestroyAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Leave the chat room if there is still more participants left
        if instance.participants.count() > 1:
            instance.participants.remove(user)
            return Response({"detail": "You have left the chat room."}, status=status.HTTP_204_NO_CONTENT)
        
        # If you are the last participant, delete the chat room
        else:
            instance.delete()
            return Response({"detail": "Chat room deleted since you were the last participant."}, status=status.HTTP_204_NO_CONTENT)

class ChatRoomRetrieveView(generics.RetrieveAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only retrieve chat rooms related to the current user
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)

class ListParticipantsInChatRoomView(generics.ListAPIView):
    serializer_class = DefaultUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        chat_room_id = self.kwargs["pk"]
        chat_room_object = get_object_or_404(ChatRoom, id=chat_room_id)
        
        # The user have to be a part of the chat room in order to get the participants
        if not chat_room_object.participants.filter(id=user.id).exists():
                    raise serializers.ValidationError("Cannot request participants of a chat room that you are not a part of")
        
        return chat_room_object.participants.all()

class ListMessagesInChatRoomView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        chat_room_id = self.kwargs["pk"]
        chat_room_object = get_object_or_404(ChatRoom, id=chat_room_id)
        
        # The user have to be a part of the chat room in order to get the messages
        if not chat_room_object.participants.filter(id=user.id).exists():
                    raise serializers.ValidationError("Cannot request messages of a chat room that you are not a part of")
        
        return Message.objects.filter(chat_room=chat_room_id)

class ListWorkoutMessagesInChatRoomView(generics.ListAPIView):
    serializer_class = WorkoutMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        chat_room_id = self.kwargs["pk"]
        chat_room_object = get_object_or_404(ChatRoom, id=chat_room_id)

        if not chat_room_object.participants.filter(id=user.id).exists():
            raise serializers.ValidationError("Cannot request workout messages of a chat room that you are not a part of")
        
        return WorkoutMessage.objects.filter(chat_room=chat_room_id)
    
