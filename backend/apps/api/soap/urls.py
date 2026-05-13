from django.urls import path

from .views import (
    CreateProjectAPIView, 
    ModifyProjectAPIView,
    CustomerDropdownView,
    SiteDropdownView,
    SyncMasterDataAPIView,
    CreateTaskAPIView,
    CreateSubTaskAPIView,
    UpdateTaskAPIView,
    UpdateSubTaskAPIView,
)

urlpatterns = [
    # Your existing endpoints for Project creation and modification
    path('projects/', CreateProjectAPIView.as_view(), name='soap-create-project'),
    path('projects/<str:project_id>/', ModifyProjectAPIView.as_view(), name='soap-modify-project'),
    
    path('tasks/', CreateTaskAPIView.as_view(), name='soap-create-task'),
    path('tasks/<str:task_id>/', UpdateTaskAPIView.as_view(), name='soap-update-task'),
    path('subtasks/', CreateSubTaskAPIView.as_view(), name='soap-create-sub-task'),
    path('subtasks/<str:task_id>/', UpdateSubTaskAPIView.as_view(), name='soap-update-sub-task'),
    
    # Your new endpoints for the React dropdown UI
    path('customers/', CustomerDropdownView.as_view(), name='soap-customer-dropdown'),
    path('sites/', SiteDropdownView.as_view(), name='soap-site-dropdown'),
    path('sync-master-data/', SyncMasterDataAPIView.as_view(), name='soap-sync-master-data'),
]
