from django.contrib.auth.models import User
from backend.serializers import UserSerializer, DefaultUserSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics

class ListUserView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(profile__isnull=False)

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(profile__isnull=False)

class ListPtAndUserView(generics.ListAPIView):
     serializer_class = DefaultUserSerializer
     permission_classes = [IsAuthenticated]
 
     def get_queryset(self):
         return User.objects.all()

class UpdateUserView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    # Only the user itself can update its profile
    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(id=user.id)
    

