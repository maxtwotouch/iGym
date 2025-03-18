from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Workout, Exercise, ExerciseSession, WorkoutSession, Set, ChatRoom, ScheduledWorkout, PersonalTrainerProfile, UserProfile
from rest_framework import generics
from .serializers import UserSerializer, PersonalTrainerSerializer, WorkoutSerializer, PersonalTrainerProfileSerializer
from .serializers import ExerciseSerializer, CustomTokenObtainPairSerializer, WorkoutSessionSerializer, ExerciseSessionSerializer
from .serializers import SetSerializer, ChatRoomSerializer, DefaultUserSerializer, MessageSerializer, ChatRoomCreateSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User



class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class ListUserView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(user_profile__isnull=True)

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

    
class PersonalTrainerDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = PersonalTrainerSerializer
    permission_classes = [IsAuthenticated]

class UpdateUserView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class UpdatePersonalTrainerView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = PersonalTrainerSerializer
    permission_classes = [IsAuthenticated]

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
    
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(user=self.request.user)
        else:
            print(serializer.errors)

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

class UserWorkoutSessionListView(generics.ListAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return only the sessions belonging to the current user
        return WorkoutSession.objects.filter(user=self.request.user)

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
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)


class ChatRoomListView(generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)

class ChatRoomCreateView(generics.CreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only delete chat rooms related to the current user
    def get_queryset(self): 
        user = self.request.user
        return ChatRoom.objects.filter(participants=user) 
    
    
class ChatRoomCreateView(generics.CreateAPIView):
    serializer_class = ChatRoomCreateSerializer
    permission_classes = [IsAuthenticated]


    
class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    # Get all messages related to the current chat room
    def get_queryset(self):
        chat_room_id = self.kwargs["pk"]
        return Message.objects.filter(chat_room__id=chat_room_id).order_by("date_sent")
    

