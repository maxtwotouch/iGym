"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from .views import CreateUserView, CreatePersonalTrainerView, WorkoutListView, ExerciseListView, CreateWorkoutView
from .views import WorkoutDeleteView, CustomTokenObtainPairView, WorkoutDetailView, UpdateWorkoutView, ExerciseDetailView, WorkoutSessionListView
from .views import CreateWorkoutSessionView, CreateExerciseSessionView, CreateSetView, ChatRoomRetrieveView, ChatRoomListView, ChatRoomCreateView
from .views import ListUserView, ChatRoomDeleteView, PersonalTrainerListView, UpdateUserView, UpdatePersonalTrainerView, PersonalTrainerDetailView, UserDetailView
from .views import ClientsListView, CreateScheduledWorkoutView, ScheduledWorkoutListView, SchedulesWorkoutDeleteView, ListExercisesInWorkoutView, ListParticipantsInChatRoomView
from .views import ListMessagesInChatRoomView, ListWorkoutMessagesInChatRoomView, ListScheduledWorkoutsOfClientView, ListWorkoutSessionsOfClientsView, ListWorkoutsOfClientsListView
from .views import NotificationListView, NotificationDeleteView, ListPtAndUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Personal trainer and normal users have their own endpoints for registration (may have to be fixed)
    path("user/register/", CreateUserView.as_view(), name="register_user"),
    path("personal_trainer/register/", CreatePersonalTrainerView.as_view(), name="register_personal_trainer"),
    path("token/", CustomTokenObtainPairView.as_view(), name="get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("auth/", include("rest_framework.urls")),
    path("workouts/", WorkoutListView.as_view(), name="workout-list"),
    path("exercises/", ExerciseListView.as_view(), name="exercise-list"),
    path("workouts/create/", CreateWorkoutView.as_view(), name="workout-create"),
    path("workouts/delete/<int:pk>/", WorkoutDeleteView.as_view(), name="workout-delete"),
    path("workout/<int:pk>/exercises/", ListExercisesInWorkoutView.as_view(), name="workout-exercises"),
    path("workouts/update/<int:pk>/", UpdateWorkoutView.as_view(), name="workout-update"),
    path("workouts/<int:pk>/", WorkoutDetailView.as_view(), name="get-workout"),
    path("exercises/<int:pk>/", ExerciseDetailView.as_view(), name="get-exercise"),
    path("workout/session/create/", CreateWorkoutSessionView.as_view(), name="workout_session-create"),
    path("exercise/session/create/", CreateExerciseSessionView.as_view(), name="exercise_session-create"),
    path("set/create/", CreateSetView.as_view(), name="set-create"),
    path("workouts_sessions/", WorkoutSessionListView.as_view(), name="workout_session-list"),
    path("chat_room/<int:pk>/", ChatRoomRetrieveView.as_view(), name="chat_room-retrieve"),
    path("chat_rooms/", ChatRoomListView.as_view(), name="chat_rooms-list"),
    path("chat_room/create/", ChatRoomCreateView.as_view(), name="chat_room-create"),
    path("chat_room/delete/<int:pk>/", ChatRoomDeleteView.as_view(), name="chat_room-delete"),
    path("chat_room/<int:pk>/participants/", ListParticipantsInChatRoomView.as_view(), name="chat_room-participants"),
    path("chat_room/<int:pk>/messages/", ListMessagesInChatRoomView.as_view(), name="chat_room-messages"),
    path("chat_room/<int:pk>/workout_messages/", ListWorkoutMessagesInChatRoomView.as_view(), name="chat_room-workout_messages"),
    path("users/", ListUserView.as_view(), name="user-list"),
    path("users-pts/", ListPtAndUserView.as_view(), name="user-pt-list"),
    path("personal_trainers/", PersonalTrainerListView.as_view(), name="personal_trainer-list"),
    path("user/update/<int:pk>/", UpdateUserView.as_view(), name="user-update"),
    path("personal_trainer/update/<int:pk>/", UpdatePersonalTrainerView.as_view(), name="personal_trainer-update"),
    path("personal_trainer/<int:pk>/", PersonalTrainerDetailView.as_view(), name="personal_trainer-detail"),
    path("personal_trainer/clients/", ClientsListView.as_view(), name="clients-list"),
    path("personal_trainer/client/<int:pk>/scheduled_workouts/", ListScheduledWorkoutsOfClientView.as_view(), name="client-scheduled_workouts-list"),
    path("personal_trainer/client/<int:pk>/workout_sessions/", ListWorkoutSessionsOfClientsView.as_view(), name="client-workout_sessions-list"),
    path("personal_trainer/client/<int:pk>/workouts/", ListWorkoutsOfClientsListView.as_view(), name="client-workouts-list"),
    path("user/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("scheduled_workout/create/", CreateScheduledWorkoutView.as_view(), name="scheduled_workout-create"),
    path("scheduled_workout/delete/<int:pk>/", SchedulesWorkoutDeleteView.as_view(), name="scheduled_workout-delete"),
    path("scheduled_workouts/", ScheduledWorkoutListView.as_view(), name="scheduled_workouts-list"),
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notification/delete/<int:pk>/", NotificationDeleteView.as_view(), name="notification-delete"),
]

"""
    Serve media files during development
    static is a helper function that adds new URL patterns to serve media files
    it is a function that allow serving files that are upploaded from a specified directory (MEDIA_ROOT)"
"""
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
"""
    How it works:
        1: frontend sends a request to http://127.0.0.1:8000/media/exercise_pictures/picture.png
        2: Django's URL configuration looks for URL patters that match the requested path. Since we have set up the static file serving as we have, the requested path will match the condition because it starts with /media/
        3: Since the MEDIA_URL is defined as /media/, Django knows to handle it as a request for a media file
        4: Django will look for the the file in the directory specified by MEDIA_ROOT
"""