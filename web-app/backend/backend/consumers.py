import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, ChatRoom, Workout, WorkoutMessage, Notification
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
from .serializers import WorkoutSerializer
from datetime import datetime

# FIX: We can consider adding a NotificationConsumer class to handle receiving of all notifications for a user. But this adds complexity. And in the case of our application, it is assumed that a user will not take part in a 1000+ chat rooms at once. So we can rather for keeping it simple just open many WebSocket connection for a user in the dashboard for receiving notification. This way we can keep the code simple and avoid the complexity of handling multiple notifications in a single WebSocket connection.
# class NotificationConsumer(AsyncWebsocketConsumer):


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
    
    async def receive(self, text_data): # WebSocket server receives data from the client
        data = json.loads(text_data)
        type = data.get("type", None)

        sender = self.scope["user"]
        if (sender is None):
            print("User is not authenticated")
            return
        
        # Initialize variables, these can be stored as none to the database model Notification, dependent on what kind of notification it is
        workout = None
        message_content = None

        # Check if data is a workout message
        if type == "workout":
            workout = await self.get_workout(data["workout"]["id"]) 
            if not workout:
                print("Workout not found")
                return

            await self.save_workout_message(sender, workout)

            workout_serialized = await self.get_serialized_workout(workout) 
            await self.channel_layer.group_send(
                self.room_id, 
                {
                    "type": "workout_message",  
                    "workout": workout_serialized,
                    "sender": sender.id
                }
            )
        
        # Check if data is a confirmation message (of adding a user to a workout)
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

            # Add user to the workout if they are not already in the owners list
            if user_id not in owners:
                await database_sync_to_async(workout.owners.add)(user_id)

                workout_serialized = await self.get_serialized_workout(workout)
                await self.channel_layer.group_send(
                    self.room_id,
                    {
                        "type": "confirmation_message",
                        "workout": workout_serialized,
                        "added_to_workout": user.username
                    }
                )

        # Data is a normal chat message
        elif type == "message":
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

        # Broadcast notification to the rest of the users in the chat room, excluding the sender. And saving the notification to the database
        if type == "message":
            notification = await self.save_notification(sender, message_content, workout) 

            await self.channel_layer.group_send(
                self.room_id,
                {
                    "type": "notification",
                    "id": notification.id,
                    "sender": sender.username,
                    "message": message_content,
                    "chat_room_name": self.room.name,
                    "chat_room_id": self.room.id,
                    "date_sent": datetime.now().isoformat()
                }
            ) 
        elif type == "workout":
            notification = await self.save_notification(sender, message_content, workout)

            workout_serialized = await self.get_serialized_workout(workout)
            await self.channel_layer.group_send(
                self.room_id,
                {
                    "type": "notification",
                    "id": notification.id,
                    "sender": sender.username,
                    "workout": workout_serialized,
                    "chat_room_name": self.room.name,
                    "chat_room_id": self.room.id,
                    "date_sent": datetime.now().isoformat()
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

    async def notification(self, event):
        sender = event["sender"]
        message = event.get("message", None)
        workout = event.get("workout", None)
        chat_room_name = event["chat_room_name"]
        chat_room_id = event["chat_room_id"]
        date_sent = event["date_sent"]
        id = event.get("id", None)

        if message:
            await self.send(text_data=json.dumps({
                "type": "notification",
                "id": id,
                "sender": sender,
                "message": message,
                "chat_room_name": chat_room_name,
                "chat_room_id": chat_room_id,
                "date_sent": date_sent
            }))
        elif workout:
            await self.send(text_data=json.dumps({
                "type": "notification",
                "id": id,
                "sender": sender,
                "workout": workout,
                "chat_room_name": chat_room_name,
                "chat_room_id": chat_room_id,
                "date_sent": date_sent
            }))
    
    @database_sync_to_async
    def save_message(self, sender, content):
        Message.objects.create(sender=sender, content=content, chat_room=self.room)

    @database_sync_to_async
    def save_workout_message(self, sender, workout):
        WorkoutMessage.objects.create(sender=sender, workout=workout, chat_room=self.room)

    @database_sync_to_async
    def save_notification(self, sender, message, workout):
        notification = None
        # Must save to database for each User in the chat room, exluding the sender
        for user in self.room.participants.all():
            if user != sender:
                # Save either a message or a workout (see model Notification)
                if message:
                    notification = Notification.objects.create(user=user, sender=sender, message=message, chat_room_name=self.room.name, chat_room_id=self.room.id)
                if workout:
                    notification = Notification.objects.create(user=user, sender=sender, workout_message=workout, chat_room_name=self.room.name, chat_room_id=self.room.id)

        return notification # Retrieve notification so that its ID can be sent to the client

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