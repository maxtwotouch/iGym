
from .models import Workout, Exercise, WorkoutSession, Set, ChatRoom, ScheduledWorkout, Message, WorkoutMessage, Notification, PersonalTrainerScheduledWorkout, FailedLoginAttempt
from django.contrib.auth.models import User
from rest_framework import generics, serializers
from .serializers import UserSerializer, WorkoutSerializer
from .serializers import ExerciseSerializer, CustomTokenObtainPairSerializer, WorkoutSessionSerializer, ExerciseSessionSerializer
from .serializers import SetSerializer, ChatRoomSerializer, DefaultUserSerializer, PersonalTrainerSerializer, ScheduledWorkoutSerializer
from .serializers import MessageSerializer, WorkoutMessageSerializer, NotificationSerializer, PersonalTrainerScheduledWorkoutSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from .utils import is_locked_out, get_client_ip_address
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class ListUserView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(profile__isnull=False)

class ListPtAndUserView(generics.ListAPIView):
     serializer_class = DefaultUserSerializer
     permission_classes = [IsAuthenticated]
 
     def get_queryset(self):
         return User.objects.all()

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(profile__isnull=False)

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
    serializer_class = PersonalTrainerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(trainer_profile__isnull=False)

class UpdateUserView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    # Only the user itself can update its profile
    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(id=user.id)

class UpdatePersonalTrainerView(generics.UpdateAPIView):
    serializer_class = PersonalTrainerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(id=user.id)

class UpdateWorkoutView(generics.UpdateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only update workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(owners=user)
    
class CreateWorkoutView(generics.CreateAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Overwriting the create method to associate the workout with the current user
    def perform_create(self, serializer):
        user = self.request.user
        if serializer.is_valid():
            workout = serializer.save(author=user)
            workout.owners.add(user) 
        else:
            print(serializer.errors)

class CreateWorkoutSessionView(generics.CreateAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]
    
    # Set the user to the request user, since this is a read-only field
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(user=self.request.user)
        else:
            print(serializer.errors)

class ListExercisesInWorkoutView(generics.ListAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        workout_id = self.kwargs["pk"]
        workout_object = get_object_or_404(Workout, id=workout_id)
        
        # Make sure that the user is a owner of the workout or is a personal trainer
        if not workout_object.owners.filter(id=user.id).exists() and not hasattr(user, "trainer_profile"):
            raise serializers.ValidationError("Cannot request exercises of a workout that you are not a owner of, or if you are not a personal trainer")
       
        return workout_object.exercises.all()

class CreateExerciseSessionView(generics.CreateAPIView):
    serializer_class = ExerciseSessionSerializer
    permission_classes = [IsAuthenticated]
    
    # Make sure that the exercise is contained in the workout
    def perform_create(self, serializer):
        exercise = serializer.validated_data["exercise"]
        workout_session = serializer.validated_data["workout_session"]
        
        if not workout_session.workout.exercises.filter(id=exercise.id).exists():
            raise serializers.ValidationError("This exercise is not a part of the workout")
        
        serializer.save()


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

class ClientsListView(generics.ListAPIView):
    serializer_class = DefaultUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        trainer = self.request.user
        #  Retrieve all user profiles where personal_trainer is the current user's trainer profile
        return User.objects.filter(profile__personal_trainer__user=trainer)
    
class WorkoutSessionListView(generics.ListAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
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
        return Workout.objects.filter(owners=user)
    
    def perform_destroy(self, instance):
        user = self.request.user
        
        # Remove the user as a owner if there is still more owners left
        if instance.owners.count() > 1:
            instance.owners.remove(user)
            return Response({"detail": "You are not a owner of teh workout anymore."}, status=status.HTTP_204_NO_CONTENT)
        
        # If the user is the last owner, delete the workout
        else:
            instance.delete()
            return Response({"detail": "Workout deleted since you were the last owner."}, status=status.HTTP_204_NO_CONTENT)
    
class ExerciseListView(generics.ListAPIView):
    # Provide a proper queryset rather than the model itself
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
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

class ChatRoomDeleteView(generics.DestroyAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Leave the chat room if there is still more participants left
        if instance.participants.count() > 1:
            instance.participants.remove(user)
            return Response({"detail": "You have left the chat room."}, status=status.HTTP_204_NO_CONTENT)
        
        # If you are the last participant, delete the chat room
        else:
            instance.delete()
            return Response({"detail": "Chat room deleted since you were the last participant."}, status=status.HTTP_204_NO_CONTENT)

class SchedulesWorkoutDeleteView(generics.DestroyAPIView):
    serializer_class = ScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ScheduledWorkout.objects.filter(user=user)
        

class ChatRoomCreateView(generics.CreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

class ListParticipantsInChatRoomView(generics.ListAPIView):
    serializer_class = DefaultUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        chat_room_id = self.kwargs["pk"]
        chat_room_object = get_object_or_404(ChatRoom, id=chat_room_id)
        
        # The user have to be a part of the chat room in order to get the participants
        if not chat_room_object.participants.filter(id=user.id).exists():
                    raise serializers.ValidationError("Cannot request participants of a chat room that you are not a part of")
            
        
        return chat_room_object.participants.all()

class ListScheduledWorkoutsOfClientView(generics.ListAPIView):
    serializer_class = ScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        client_id = self.kwargs["pk"]
        client = get_object_or_404(User, id=client_id)
        
        trainer = self.request.user
        
        # Check that the client has this user as personal trainer
        if not hasattr(trainer, "trainer_profile") or not client.profile.personal_trainer == trainer.trainer_profile:
            raise serializers.ValidationError("You are not the personal trainer for this user")
        
        return ScheduledWorkout.objects.filter(user=client)
    
class ListWorkoutSessionsOfClientsView(generics.ListAPIView):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        client_id = self.kwargs["pk"]
        client = get_object_or_404(User, id=client_id)
        
        trainer = self.request.user
        
        if not hasattr(trainer, "trainer_profile") or not client.profile.personal_trainer == trainer.trainer_profile:
            raise serializers.ValidationError("You are not the personal trainer for this user")

        return WorkoutSession.objects.filter(user=client)    

class ListWorkoutsOfClientsListView(generics.ListAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        client_id = self.kwargs["pk"]
        client = get_object_or_404(User, id=client_id)
        
        trainer = self.request.user
        
        if not hasattr(trainer, "trainer_profile") or not client.profile.personal_trainer == trainer.trainer_profile:
            raise serializers.ValidationError("You are not the personal trainer for this user")
        
        return Workout.objects.filter(owners=client)

class ListMessagesInChatRoomView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        chat_room_id = self.kwargs["pk"]
        chat_room_object = get_object_or_404(ChatRoom, id=chat_room_id)
        
        # The user have to be a part of the chat room in order to get the messages
        if not chat_room_object.participants.filter(id=user.id).exists():
                    raise serializers.ValidationError("Cannot request messages of a chat room that you are not a part of")
        
        return Message.objects.filter(chat_room=chat_room_id)

class ListWorkoutMessagesInChatRoomView(generics.ListAPIView):
    serializer_class = WorkoutMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        chat_room_id = self.kwargs["pk"]
        chat_room_object = get_object_or_404(ChatRoom, id=chat_room_id)

        if not chat_room_object.participants.filter(id=user.id).exists():
            raise serializers.ValidationError("Cannot request workout messages of a chat room that you are not a part of")
           
        return WorkoutMessage.objects.filter(chat_room=chat_room_id)
    
class CreateScheduledWorkoutView(generics.CreateAPIView):
     serializer_class = ScheduledWorkoutSerializer
     permission_classes = [IsAuthenticated]
     
     def perform_create(self, serializer):
         serializer.save(user=self.request.user)

class ScheduledWorkoutListView(generics.ListAPIView):
    serializer_class = ScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
     
    def get_queryset(self):
        return ScheduledWorkout.objects.filter(user=self.request.user)

class CreatePersonalTrainerScheduledWorkoutView(generics.CreateAPIView):
    serializer_class = PersonalTrainerScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        trainer = self.request.user
        
        # Check if the user and pt is the correct types
        if not hasattr(trainer, "trainer_profile"):
            raise serializers.ValidationError("PT is not a personal trainer")
        
        client = serializer.validated_data.get("client")
        
        if not hasattr(client, "profile"):
            raise serializers.ValidationError("Client is not a user")
        
        # Check that the client has the pt as its personal trainer
        if not client.profile.personal_trainer == trainer.trainer_profile:
            raise serializers.ValidationError("Client does not have this pt as its personal trainer")
        
        serializer.save(pt=self.request.user)

class PersonalTrainerScheduledWorkoutListView(generics.ListAPIView):
    serializer_class = PersonalTrainerScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
     
    # Fetch all PersonalTrainerScheduledWorkout objects where the current user is involved
    def get_queryset(self):
        user = self.request.user
        
        # Check if the user is a normal user or a personal trainer
        if hasattr(user, "profile"):
            return PersonalTrainerScheduledWorkout.objects.filter(client=user)
        
        elif hasattr(user, "trainer_profile"):
            return PersonalTrainerScheduledWorkout.objects.filter(pt=user)

class PersonalTrainerScheduledWorkoutDeleteView(generics.DestroyAPIView):
    serializer_class = PersonalTrainerScheduledWorkoutSerializer
    permission_classes = [IsAuthenticated]
    
    # Can only delete pt scheduled workouts related to the current user
    def get_queryset(self):
        user = self.request.user
        # Only the pt can delete the scheduled workout
        return PersonalTrainerScheduledWorkout.objects.filter(pt=user)
                

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
