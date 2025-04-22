from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    UserProfile,
    PersonalTrainerProfile,
    Workout,
    Exercise,
    WorkoutSession,
    ExerciseSession,
    Set,
    ChatRoom,
    Message,
    WorkoutMessage,
    ScheduledWorkout,
    Notification,
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# The default user-set-up if we only have one type of user
# (not used when we have separate user and PT flows)
class DefaultUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # include first_name and last_name
        fields = ["id", "username", "first_name", "last_name", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


# Serializer for the user profile
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "height",
            "weight",
            "personal_trainer",
            "pt_chatroom",
            "profile_picture",
        ]


# Nested serializer to connect with the User profile model
class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "password",
            "profile",
        ]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        profile_data = validated_data.pop("profile")
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, **profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        # update User fields
        instance = super().update(instance, validated_data)
        # update nested profile
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        return instance


# Serializer for the personal trainer profile
class PersonalTrainerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalTrainerProfile
        fields = ["id", "experience"]


# Nested serializer to connect with the personal trainer model
class PersonalTrainerSerializer(serializers.ModelSerializer):
    trainer_profile = PersonalTrainerProfileSerializer()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "password",
            "trainer_profile",
        ]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        profile_data = validated_data.pop("trainer_profile")
        user = User.objects.create_user(**validated_data)
        PersonalTrainerProfile.objects.create(user=user, **profile_data)
        return user

    def update(self, instance, validated_data):
        trainer_profile_data = validated_data.pop("trainer_profile", None)
        instance = super().update(instance, validated_data)
        if trainer_profile_data:
            trainer_profile = instance.trainer_profile
            for attr, value in trainer_profile_data.items():
                setattr(trainer_profile, attr, value)
            trainer_profile.save()
        return instance


# Standard serializers for Exercise, Workout, etc.
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
    exercise_sessions = ExerciseSessionSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutSession
        fields = [
            "id",
            "user",
            "workout",
            "start_time",
            "exercise_sessions",
            "calories_burned",
            "duration",
        ]
        extra_kwargs = {"user": {"read_only": True}}


# Extend JWT payload to include names and roles
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data["id"] = user.id
        data["username"] = user.username
        # include first & last name
        data["first_name"] = user.first_name
        data["last_name"] = user.last_name
        if hasattr(user, "profile"):
            data["profile"] = {
                "role": user.profile.role,
                "weight": user.profile.weight,
            }
        elif hasattr(user, "trainer_profile"):
            data["trainer_profile"] = {"role": user.trainer_profile.role}
        return data


# Messaging & scheduling serializers
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "sender", "content", "date_sent", "chat_room"]


class WorkoutMessageSerializer(serializers.ModelSerializer):
    workout = WorkoutSerializer()

    class Meta:
        model = WorkoutMessage
        fields = ["id", "sender", "workout", "date_sent", "chat_room"]


class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = ["id", "participants", "date_created", "name"]


class ScheduledWorkoutSerializer(serializers.ModelSerializer):
    workout_title = serializers.ReadOnlyField(source="workout_template.name")

    class Meta:
        model = ScheduledWorkout
        fields = [
            "id",
            "user",
            "workout_template",
            "workout_title",
            "scheduled_date",
        ]
        extra_kwargs = {"user": {"read_only": True}}


class NotificationSerializer(serializers.ModelSerializer):
    workout_message = WorkoutSerializer()

    class Meta:
        model = Notification
        fields = [
            "id",
            "sender",
            "chat_room_id",
            "chat_room_name",
            "date_sent",
            "message",
            "workout_message",
        ]
