"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

"""
This Django intialization is required for when this asgi application is loaded directly,
for example when starting the server using Daphne in a subprocess (acceptance test).
"""
# Intiliaze Django
django.setup()

from django.core.asgi import get_asgi_application
http_app  = get_asgi_application() # Support HTTP protocol

from . import routing # Import routing after initializing Django

# Make the application support multiple protocols

application = ProtocolTypeRouter({
    "http": http_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})
