from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile, PersonalTrainerProfile, Workout, Exercise, WorkoutSession
from .models import ExerciseSession, Set, ChatRoom, Message, WorkoutMessage, ScheduledWorkout
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# The default user-set-up if we only have one type of user

# should not be used

class DefaultUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data) 
        return user

# Serializer for the user profile
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        
        fields = ["id", "height", "weight", "personal_trainer"] 

# Nested serializer to connect with the User profile model
class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()
    class Meta:
        model = User
        fields = ["id", "username", "password", "profile"]
        extra_kwargs = {"password": {"write_only": True}}
    
    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        user = User.objects.create_user(**validated_data)
        profile_data["user"] = user
        UserProfile.objects.create(**profile_data)
        return user
    
    def update(self, instance, validated_data):
        # Extract nested user_profile data (if any)
        profile_data = validated_data.pop("profile")
        # Update the flat fields of the User model
        instance = super().update(instance, validated_data)
        
        if profile_data:
            profile = instance.profile
            # Update each attribute in UserProfile with the new values
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        return instance
    
# Serializer for the personal trainer model
class PersonalTrainerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalTrainerProfile
        fields = ["id", "experience"]

# Nested serializer to connect with the personal trainer model
class PersonalTrainerSerializer(serializers.ModelSerializer):
    trainer_profile = PersonalTrainerProfileSerializer()
    class Meta:
        model = User
        fields = ["id", "username", "password", 'trainer_profile']
        extra_kwargs = {"password": {"write_only": True}}
    
    def create(self, validated_data):
        profile_data = validated_data.pop('trainer_profile')
        user = User.objects.create_user(**validated_data)
        profile_data["user"] = user
        PersonalTrainerProfile.objects.create(**profile_data)
        return user
    

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "description", "muscle_group", "image"]
        


class WorkoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workout
        fields = ["id", "author", "owners", "name", "date_created", "exercises"]
        extra_kwargs = {"author": {"read_only": True}}

class SetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Set
        fields = ["id", "exercise_session", "repetitions", "weight"]

class ExerciseSessionSerializer(serializers.ModelSerializer):
    sets = SetSerializer(many=True, read_only=True)
    class Meta:
        model = ExerciseSession
        fields = ["id", "exercise", "workout_session", "sets"]

class WorkoutSessionSerializer(serializers.ModelSerializer):
    exercise_sessions = ExerciseSessionSerializer(many=True, read_only=True)  # Include related exercise sessions
    class Meta:
        model = WorkoutSession
        fields = ["id", "user", "workout", "start_time", "exercise_sessions", "calories_burned"]
        extra_kwargs = {"user": {"read_only": True}}

        
        
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        user = self.user
        
        data["id"] = user.id
        data["username"] = user.username
        
        if hasattr(user, "profile"):
            role = user.profile.role
            data["profile"] = {
                "role": role,
                "weight": user.profile.weight
            }
        
        elif hasattr(user, "trainer_profile"):
            role = user.trainer_profile.role
            data["trainer_profile"] = {"role": role}
        
        return data

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "sender", "content", "date_sent", "chat_room"]
        

class ChatRoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    participants = serializers.SerializerMethodField()
    class Meta:
        model = ChatRoom
        fields = ["id", "participants", "participants_display", "date_created", "name", "messages", "workout_messages"]

    def get_participants(self, obj):
        return obj.participants.values("id", "username")
    

class ChatRoomCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = ["id", "participants", "date_created", "name"]


class ScheduledWorkoutSerializer(serializers.ModelSerializer):
     workout_title = serializers.ReadOnlyField(source="workout_template.name")
     
     class Meta:
        model = ScheduledWorkout
        fields = ['id', 'user', 'workout_template', 'workout_title', 'scheduled_date']
        extra_kwargs = {
            'user': {'read_only': True},
        }
    
    
        
        
    
    