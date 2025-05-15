from django.urls import path
from backend.views.auth import CreateUserView, CreatePersonalTrainerView, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("user/register/", CreateUserView.as_view(), name="register_user"),
    path("personal_trainer/register/", CreatePersonalTrainerView.as_view(), name="register_personal_trainer"),
    path("token/", CustomTokenObtainPairView.as_view(), name="get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
]
