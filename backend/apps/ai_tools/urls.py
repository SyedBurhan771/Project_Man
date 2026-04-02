from django.urls import path
from . import views

urlpatterns = [
    path('generate-ideas/', views.generate_project_ideas, name='generate_project_ideas'),
    path('create-project/', views.create_project, name='create_project'),  # ← ONLY THIS LINE ADDED
    path('create-task/', views.create_task, name='create_task'),
    path('generate-tasks/', views.generate_tasks_for_project, name='generate_tasks_for_project'),
    path('update-task/', views.update_task, name='update_task'),   # ← ADD THIS   # ← ADD THIS LINE
    path('create-subtask/', views.create_subtask, name='create_subtask'),
]