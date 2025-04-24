from django.urls import path
from backend.views.user import (
    ListUserView, UpdateUserView, UserDetailView, ListPtAndUserView
)

urlpatterns = [
    path("", ListUserView.as_view(), name="user-list"),
    path("pt/", ListPtAndUserView.as_view(), name="user-pt-list"),
    path("update/<int:pk>/", UpdateUserView.as_view(), name="user-update"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
]
