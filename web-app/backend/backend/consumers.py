import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, ChatRoom, Workout, WorkoutMessage
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
import re
from .serializers import WorkoutSerializer

class Chatconsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_parameter = self.scope["query_string"] # Get the query parameters from the URL 
        query_string = query_parameter.decode("utf-8") 
        query_dict = parse_qs(query_string) # Parse the query parameters into a dictionary
        token_list = query_dict.get("token", [None])
        token = token_list[0] # Get the token value from the list

        if token:
            try:
                validated_token = AccessToken(token)  # Validate the token
                self.scope["user"] = await database_sync_to_async(User.objects.get)(id=validated_token["user_id"]) # Get the user from the token
            except:
                await self.close()  
                return
        else:
            await self.close()

        # Retrieve the chat room
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_id = str(self.room_id) # Django channels expects the room identifier to be a string
        self.room = await database_sync_to_async(ChatRoom.objects.get)(id=self.room_id)
        
        # Join group
        await self.channel_layer.group_add(self.room_id, self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_id, self.channel_name)
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        type = data.get("type", None)

        sender = self.scope["user"]
        if (sender is None):
            print("User is not authenticated")
            return

        # Check if data is a workout message
        if type == "workout":
            workout = await self.get_workout(data["workout"]["id"]) 
            if not workout:
                print("Workout not found")
                return

            await self.save_workout_message(sender, workout)

            workout = await self.get_serialized_workout(workout) 
            await self.channel_layer.group_send(
                self.room_id, 
                {
                    "type": "workout_message",  
                    "workout": workout,
                    "sender": sender.id
                }
            )
        
        # Check if data is a confirmation message
        elif type == "confirmation":
            workout_id = data["workout_id"]
            user_id = data["user_id"]

            workout = await self.get_workout(workout_id)
            if workout is None:
                print(f"Workout with ID {workout_id} not found!")
                return 
            
            user = await self.get_user(user_id)
            if user is None:
                print(f"User with ID {user_id} not found!")
                return  

            owners = await database_sync_to_async(list)(workout.owners.values_list("id", flat=True))

            if user_id not in owners:
                await database_sync_to_async(workout.owners.add)(user_id)

                workout = await self.get_serialized_workout(workout)
                await self.channel_layer.group_send(
                    self.room_id,
                    {
                        "type": "confirmation_message",
                        "workout": workout,
                        "added_to_workout": user.username
                    }
                )

        # Data is a normal chat message
        else:
            message_content = data['message']
            if not message_content:
                print("Received invalid websocket message")
                return
            
            await self.save_message(sender, message_content)

            await self.channel_layer.group_send(
                self.room_id,
                {
                    "type": "chat_message",
                    "content": message_content,
                    "sender": sender.id
                }
            )
    
    async def chat_message(self, event):
        message_content = event["content"]
        sender = event["sender"]
        
        await self.send(text_data=json.dumps({
            "type": "message",
            "content": message_content,
            "sender": sender
        }))


    async def workout_message(self, event):
        workout = event["workout"]
        sender = event["sender"]

        await self.send(text_data=json.dumps({
            "type": "workout",
            "workout": workout,
            "sender": sender
        }))

    async def confirmation_message(self, event):
        workout = event["workout"]
        added_to_workout = event["added_to_workout"]

        await self.send(text_data=json.dumps({
            "type": "confirmation",
            "workout": workout,
            "added_to_workout": added_to_workout
        }))
    
    @database_sync_to_async
    def save_message(self, sender, content):
        Message.objects.create(sender=sender, content=content, chat_room=self.room)

    @database_sync_to_async
    def save_workout_message(self, sender, workout):
        WorkoutMessage.objects.create(sender=sender, workout=workout, chat_room=self.room)

    @database_sync_to_async
    def get_serialized_workout(self, workout):
        serializer = WorkoutSerializer(workout)
        return serializer.data

    @database_sync_to_async
    def get_workout(self, workout_id):
        try:
            return Workout.objects.get(id=workout_id)
        except Workout.DoesNotExist:
            return None
        
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None