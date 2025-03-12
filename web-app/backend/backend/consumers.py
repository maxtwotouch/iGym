import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, ChatRoom
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
import re

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
        text_data_json = json.loads(text_data)
        message_content = text_data_json['message']
        sender = self.scope["user"]

        if (sender is None):
            print("User is not authenticated")
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
            "content": message_content,
            "sender": sender
        }))
    
    
    @database_sync_to_async
    def save_message(self, sender, content):
        Message.objects.create(sender=sender, content=content, chat_room=self.room)
        
        
    