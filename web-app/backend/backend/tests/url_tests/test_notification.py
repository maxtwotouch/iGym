from django.test import TestCase
from django.urls import resolve
from backend.views.notification import NotificationListView, NotificationDeleteView

class NotificationUrlsTest(TestCase):
    def test_gym_url_to_list_notifications_endpoint(self):
        view = resolve('/notification/')
        self.assertEqual(view.func.view_class, NotificationListView)
        
    def test_gym_url_to_delete_notification_endpoint(self):
        view = resolve('/notification/delete/1/')
        self.assertEqual(view.func.view_class, NotificationDeleteView)


