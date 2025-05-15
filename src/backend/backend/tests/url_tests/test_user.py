from django.test import TestCase
from django.urls import resolve
from backend.views.user import (
    ListUserView, UpdateUserView, UserDetailView, ListPtAndUserView
)

class UserUrlsTest(TestCase):
    def test_gym_url_to_list_users_endpoint(self):
        view = resolve('/user/')
        self.assertEqual(view.func.view_class, ListUserView)
    
    def test_gym_url_to_update_user_endpoint(self):
        view = resolve('/user/update/1/')
        self.assertEqual(view.func.view_class, UpdateUserView)
    
    def test_gym_url_to_get_user_detail_endpoint(self):
        view = resolve('/user/1/')
        self.assertEqual(view.func.view_class, UserDetailView)
    
    def test_gym_url_to_list_pt_and_user_endpoint(self):
        view = resolve('/user/pt/')
        self.assertEqual(view.func.view_class, ListPtAndUserView)


