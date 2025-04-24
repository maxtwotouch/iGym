"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os

# Get the prod environment variable
prod = os.environ.get('PROD', 'False') == 'True'

# Set the settings module based on the environment
if prod:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_prod')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_dev')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
