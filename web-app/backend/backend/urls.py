from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("workout/", include("backend.url_patterns.workout")),
    path("chat/", include("backend.url_patterns.chat")),
    path("exercise/", include("backend.url_patterns.exercise")),
    path("trainer/", include("backend.url_patterns.trainer")),
    path("notification/", include("backend.url_patterns.notification")),
    path("schedule/", include("backend.url_patterns.schedule")),
    path("session/", include("backend.url_patterns.session")),
    path("user/", include("backend.url_patterns.user")),
    path("auth/", include("backend.url_patterns.auth")),
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
        1: frontend sends foe example a request to http://127.0.0.1:8000/media/exercise_pictures/picture.png
        2: Django's URL configuration looks for URL patters that match the requested path. Since we have set up the static file serving as we have, the requested path will match the condition because it starts with /media/
        3: Since the MEDIA_URL is defined as /media/, Django knows to handle it as a request for a media file
        4: Django will look for the the file in the directory specified by MEDIA_ROOT
"""