import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, ChatRoom
from channels.db import database_sync_to_async

class Chatconsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Retrieve the chat room
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room = await database_sync_to_async(ChatRoom.objects.get)(id=self.room_id)
        self.room_group_name = self.room.name
        
        # Check if the user is a member of the group
        # user = self.scope["user"]
        # is_member = await database_sync_to_async(self.room.participants.filter(id=user.id).exists)()
        
        # if not is_member:
        #     await self.close()
        #     return
        
        # Join group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
    
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
    
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json['message']
        sender = self.scope["user"]
        
        await self.save_message(sender, message_content)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message_content,
                "username": sender.username
            }
        )
    
    async def chat_message(self, event):
        message = event["message"]
        sender = event["username"]
        
        await self.send(text_data=json.dumps({
            "message": message,
            "sender": sender
        }))
    
    
    @database_sync_to_async
    def save_message(self, sender, content):
        Message.objects.create(sender=sender, content=content, chat_room=self.room)
        
        
        
        