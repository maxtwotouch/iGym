from django.urls import path
from backend.views.notification import NotificationListView, NotificationDeleteView

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("delete/<int:pk>/", NotificationDeleteView.as_view(), name="notification-delete"),
]