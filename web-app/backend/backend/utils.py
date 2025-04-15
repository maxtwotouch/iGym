from django.utils.timezone import now
from datetime import timedelta
from .models import FailedLoginAttempt
from rest_framework.exceptions import ValidationError
import re

MAX_TRIES = 5
TIME_LOCKED_OUT = timedelta(minutes=3)

def is_locked_out(username, ip_address):
    cutoff = now() - TIME_LOCKED_OUT
    
    # Will return all failed log in attempts in  the last 3 minutes
    attempts = FailedLoginAttempt.objects.filter(username=username, ip_address=ip_address, timestamp__gte=cutoff)
    num_attempts = attempts.count()
    
    # If there are more than 5 tries the last 3 minutes, suspend the user
    if num_attempts >= MAX_TRIES:
        return True
    else:
        return False

def get_client_ip_address(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    # The NGINX server is configured to pass the x-forwarded-for header
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0]
    return request.META.get("REMOTE_ADDR", "127.0.0.1")



    
    
