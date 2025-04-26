from django.contrib.auth.models import User
from backend.serializers import UserSerializer, PersonalTrainerSerializer, CustomTokenObtainPairSerializer
from rest_framework.permissions import AllowAny
from rest_framework import generics
from rest_framework_simplejwt.views import TokenObtainPairView

class CreateUserView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
class CreatePersonalTrainerView(generics.CreateAPIView):
    serializer_class = PersonalTrainerSerializer
    permission_classes = [AllowAny]
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]