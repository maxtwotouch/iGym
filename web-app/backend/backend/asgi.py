"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

# Get the prod environment variable
prod = os.environ.get('PROD', 'False') == 'True'

# Set the settings module based on the environment
if prod:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_prod')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_dev')

import django
django.setup()

from django.core.asgi import get_asgi_application
http_application = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from . import routing

application = ProtocolTypeRouter({
    "http": http_application,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})
