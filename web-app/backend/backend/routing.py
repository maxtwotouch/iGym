from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'wss/chat/(?P<room_id>\d+)/$', consumers.Chatconsumer.as_asgi())

    
]