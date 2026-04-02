from django.urls import path

from .views import CreateProjectAPIView, ModifyProjectAPIView

urlpatterns = [
    path('projects/', CreateProjectAPIView.as_view(), name='soap-create-project'),
    path('projects/<str:project_id>/', ModifyProjectAPIView.as_view(), name='soap-modify-project'),
]
