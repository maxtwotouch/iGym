from django.test import TestCase
from django.urls import resolve
from backend.views.auth import CreateUserView, CreatePersonalTrainerView, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

class AuthUrlsTest(TestCase):
    def test_gym_url_resolve_to_create_user_endpoint(self):
        view = resolve('/auth/user/register/')
        self.assertEqual(view.func.view_class, CreateUserView)
        
    def test_gym_url_to_create_personal_trainer_endpoint(self):
        view = resolve('/auth/personal_trainer/register/')
        self.assertEqual(view.func.view_class, CreatePersonalTrainerView)
        
    def test_gym_url_to_obtain_token_endpoint(self):
        view = resolve('/auth/token/')
        self.assertEqual(view.func.view_class, CustomTokenObtainPairView)
        
    def test_gym_url_to_refresh_token_endpoint(self):
        view = resolve('/auth/refresh/')
        self.assertEqual(view.func.view_class, TokenRefreshView)
    
    
    