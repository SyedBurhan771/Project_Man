from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from apps.core.schema import schema


def home(request):
    return HttpResponse('<h1>Welcome to Avataar Backend API</h1><p>Use /admin/ for data management or /api/ for endpoints.</p>')


urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('graphql/', csrf_exempt(GraphQLView.as_view(graphiql=True, schema=schema))),
    path('api/ai/', include('apps.ai_tools.urls')),
]

if settings.ENABLE_REST_API:
    urlpatterns += [
        path('api/rest/', include('apps.api.rest.urls')),
    ]

if settings.ENABLE_SOAP_API:
    urlpatterns += [
        path('api/soap/', include('apps.api.soap.urls')),
    ]
