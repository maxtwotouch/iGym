from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib import messages
from .models import UserProfile, PersonalTrainerProfile
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, PeronsalTrainerSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# View for creating a new user
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# View for creating a new personal trainer
class CreatePersonalTrainerView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = PeronsalTrainerSerializer
    permission_classes = [AllowAny]

    
