from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError as DRFValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings

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
    PersonalTrainerScheduledWorkout,
    Notification,
    FailedLoginAttempt,
)
from .utils import is_locked_out, get_client_ip_address


# -------------------------------------------------------------------
# Default serializers for simple User creation (no profile nesting)
# -------------------------------------------------------------------

class DefaultUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


# ------------------------
# User Profile serializers
# ------------------------

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["id", "height", "weight", "personal_trainer", "pt_chatroom", "profile_picture"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "password", "profile"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, data):
        pwd = data.get("password")
        if pwd:
            try:
                validate_password(pwd)
            except DjangoValidationError as exc:
                raise DRFValidationError({"password": exc.messages})
        return data

    def create(self, validated_data):
        profile_data = validated_data.pop("profile")
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, **profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        instance = super().update(instance, validated_data)
        if profile_data:
            profile = instance.profile
            for attr, val in profile_data.items():
                setattr(profile, attr, val)
            profile.save()
        return instance


# -------------------------------------
# Personal Trainer nested profile logic
# -------------------------------------

class PersonalTrainerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalTrainerProfile
        fields = ["id", "experience", "pt_type"]


class PersonalTrainerSerializer(serializers.ModelSerializer):
    trainer_profile = PersonalTrainerProfileSerializer()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "password", "trainer_profile"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, data):
        pwd = data.get("password")
        if pwd:
            try:
                validate_password(pwd)
            except DjangoValidationError as exc:
                raise DRFValidationError({"password": exc.messages})
        return data

    def create(self, validated_data):
        tp_data = validated_data.pop("trainer_profile")
        user = User.objects.create_user(**validated_data)
        PersonalTrainerProfile.objects.create(user=user, **tp_data)
        return user

    def update(self, instance, validated_data):
        tp_data = validated_data.pop("trainer_profile", None)
        instance = super().update(instance, validated_data)
        if tp_data:
            profile = instance.trainer_profile
            for attr, val in tp_data.items():
                setattr(profile, attr, val)
            profile.save()
        return instance


# ------------------------
# Exercise & workout logic
# ------------------------

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "description", "muscle_category", "muscle_group", "image"]


class SetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Set
        fields = ["id", "exercise_session", "repetitions", "weight"]


class ExerciseSessionSerializer(serializers.ModelSerializer):
    sets = SetSerializer(many=True, read_only=True)

    class Meta:
        model = ExerciseSession
        fields = ["id", "exercise", "workout_session", "sets"]


class WorkoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workout
        fields = ["id", "author", "owners", "name", "date_created", "exercises"]
        extra_kwargs = {"author": {"read_only": True}}


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


# ---------------------------------------
# Scheduled workouts for users & trainers
# ---------------------------------------

class ScheduledWorkoutSerializer(serializers.ModelSerializer):
    workout_title = serializers.ReadOnlyField(source="workout_template.name")

    class Meta:
        model = ScheduledWorkout
        fields = ["id", "user", "workout_template", "workout_title", "scheduled_date"]
        extra_kwargs = {"user": {"read_only": True}}


class PersonalTrainerScheduledWorkoutSerializer(serializers.ModelSerializer):
    workout_title = serializers.ReadOnlyField(source="workout_template.name")

        # Set the access and refresh token expiration times
        data["accessExp"] = settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"]
        data["refreshExp"] = settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]
        
        return data

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


# -------------------------------------------------
# JWT Token serializer with lockout & custom claims
# -------------------------------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username   = attrs.get("username")
        ip_address = get_client_ip_address(self.context["request"])

        if is_locked_out(username, ip_address):
            raise AuthenticationFailed("Too many failed login attempts. Try again later.")

        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            FailedLoginAttempt.objects.create(username=username, ip_address=ip_address)
            raise

        # Clean up old failures
        FailedLoginAttempt.objects.filter(username=username, ip_address=ip_address).delete()

        user = self.user
        data["id"]         = user.id
        data["username"]   = user.username
        data["first_name"] = user.first_name
        data["last_name"]  = user.last_name

        if hasattr(user, "profile"):
            data["profile"] = {
                "role":   user.profile.role,
                "weight": user.profile.weight,
            }
        elif hasattr(user, "trainer_profile"):
            data["trainer_profile"] = {"role": user.trainer_profile.role}

        return data