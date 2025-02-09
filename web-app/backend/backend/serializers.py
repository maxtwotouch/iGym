from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile, PersonalTrainerProfile, Workout, Exercise

# The default user-set-up if we only have one type of user

# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ["id", "username", "password"]
#         extra_kwargs = {"password": {"write_only": True}}
        
#     def create(self, validated_data):
#         user = User.objects.create_user(**validated_data) 
#         return user

# Serializer for the user profile
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        
        # Fields specified for the user profile
        fields = ["height", "weight"] 

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
        UserProfile.objects.create(user=user, **profile_data)
        return user
    
    
    
    
# Serializer for the personal trainer model
class PersonalTrainerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalTrainerProfile
        fields = ["experience"]

# Nested serializer to connect with the personal trainer model
class PeronsalTrainerSerializer(serializers.ModelSerializer):
    trainer_profile = PersonalTrainerProfileSerializer()
    class Meta:
        model = User
        fields = ["id", "username", "password", 'trainer_profile']
        extra_kwargs = {"password": {"write_only": True}}
    
    def create(self, validated_data):
        profile_data = validated_data.pop('trainer_profile')
        user = User.objects.create_user(**validated_data)
        PersonalTrainerProfile.objects.create(user=user, **profile_data)
        return user

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "description", "muscle_group"]
        


class WorkoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workout
        fields = ["id", "author", "name", "date_created", "exercises"]
        extra_kwargs = {"author": {"read_only": True}}
    
        
        
    
    