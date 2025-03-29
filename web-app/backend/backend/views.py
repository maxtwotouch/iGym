from rest_framework.response import Response
from .models import Workout, Exercise, ExerciseSession, WorkoutSession, Set, ChatRoom, Message, PersonalTrainerProfile, UserProfile
from .models import Notification
from rest_framework import generics
from .serializers import UserSerializer, PersonalTrainerSerializer, WorkoutSerializer
from .serializers import ExerciseSerializer, CustomTokenObtainPairSerializer, WorkoutSessionSerializer, ExerciseSessionSerializer
from .serializers import SetSerializer, ChatRoomSerializer, DefaultUserSerializer, PersonalTrainerSerializer, UserProfileSerializer
from .serializers import NotificationSerializer, PersonalTrainerProfileSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User



class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# Check this, may have to be edited to only  take
class ListUserView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(user_profile__isnull=False)
    
class ListPtAndUserView(generics.ListAPIView):
    serializer_class = DefaultUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter()

class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class CreatePersonalTrainerView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = PersonalTrainerSerializer
    permission_classes = [AllowAny]


class PersonalTrainerListView(generics.ListAPIView):
    serializer_class = PersonalTrainerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(trainer_profile__isnull=False)
    

class ClientsListView(generics.ListAPIView):
    serializer_class = DefaultUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        #  Retrieve all user profiles where personal_trainer is the current user's trainer profile
        return User.objects.filter(user_profile__personal_trainer__user=user)

    
class PersonalTrainerDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = PersonalTrainerSerializer
    permission_classes = [IsAuthenticated]

class UpdateUserView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

# class UpdatePersonalTrainerView(generics.UpdateAPIView):
#     queryset = User.objects.all()
#     serializer_class = PersonalTrainerSerializer
#     permission_classes = [IsAuthenticated]

class UpdateWorkoutView(generics.UpdateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only update workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(owners=user)
    
    def perform_update(self, serializer):
        if serializer.is_valid():
            serializer.save(owners=self.request.user)
        else:
            print(serializer.errors)
    
class CreateWorkoutView(generics.CreateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Overwriting the create method to associate the workout with the current user
    def perform_create(self, serializer):
        user = self.request.user
        if serializer.is_valid():
            workout = serializer.save(author=user)  # Save first
            workout.owners.add(user)  # Ensure author is in owners

        else:
            print(serializer.errors)

class CreateWorkoutSessionView(generics.CreateAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]
    
    # Don't need to validate, as CreateAPIView does this already 
    # def perform_create(self, serializer):
    #     if serializer.is_valid():
    #         serializer.save(user=self.request.user)
    #     else:
    #         print(serializer.errors)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CreateExerciseSessionView(generics.CreateAPIView):
    queryset = ExerciseSession.objects.all()
    serializer_class = ExerciseSessionSerializer
    permission_classes = [IsAuthenticated]

class CreateSetView(generics.CreateAPIView):
    queryset = Set.objects.all()
    serializer_class = SetSerializer
    permission_classes = [IsAuthenticated]
    

class WorkoutListView(generics.ListAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Get all workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(owners=user)


class WorkoutSessionListView(generics.ListAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]
    
    queryset = WorkoutSession.objects.all()
    

class WorkoutDetailView(generics.RetrieveAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(owners=user)

class ExerciseDetailView(generics.RetrieveAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Exercise.objects.all()
        

class WorkoutDeleteView(generics.DestroyAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only delete workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(author=user) # Visit later, must have a method for removing owner from workout, and deleting workout as a owner, two different functionalities
    
class ExerciseListView(generics.ListAPIView):
    # Provide a proper queryset rather than the model itself
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class =  CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class ChatRoomRetrieveView(generics.RetrieveAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only retrieve chat rooms related to the current user
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)


class ChatRoomListView(generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    # Get all chat rooms related to the current user
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)

# FIX: Should we allow someone to delete a chat room, that includes deleting the chat room for everybody else, instead of removing themself as a participant ... 
class ChatRoomDeleteView(generics.DestroyAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only delete chat rooms related to the current user
    def get_queryset(self): 
        user = self.request.user
        return ChatRoom.objects.filter(participants=user) 

class ChatRoomCreateView(generics.CreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    # Get all notifications related to the current user
    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(user=user).order_by("-date_sent")


class NotificationDeleteView(generics.DestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only delete notifications related to the current user
    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(user=user)
