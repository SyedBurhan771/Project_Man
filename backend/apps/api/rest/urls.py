from django.urls import path
from . import views

urlpatterns = [
    # React calls: GET /api/rest/projects/ or POST /api/rest/projects/
    path('projects/', views.project_list, name='project-list'),
    
    # React calls: GET /api/rest/projects/PRJ-001/ or PUT /api/rest/projects/PRJ-001/
    path('projects/<str:project_num>/', views.project_detail, name='project-detail'),
]