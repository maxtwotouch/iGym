from backend.models import Notification
from backend.serializers import NotificationSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics

class NotificationListView(generics.ListAPIView):
     serializer_class = NotificationSerializer
     permission_classes = [IsAuthenticated]
     
     # Get all notifications related to the current user
     def get_queryset(self):
         user = self.request.user
         return Notification.objects.filter(user=user).order_by("-date_sent")
     
class NotificationDeleteView(generics.DestroyAPIView):
     serializer_class = NotificationSerializer
     permission_classes = [IsAuthenticated]
     
     # Can only delete notifications related to the current user
     def get_queryset(self):
         user = self.request.user
         return Notification.objects.filter(user=user)