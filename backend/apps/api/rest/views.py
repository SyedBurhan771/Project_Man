from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from Integrations.rest import client


@api_view(['GET', 'POST'])
def project_list(request):
    """Handle GET (all projects) and POST (create new project) from React."""
    if request.method == 'GET':
        try:
            data = client.get_all_projects()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    elif request.method == 'POST':
        try:
            data = client.create_project(request.data)
            return Response(data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
def project_detail(request, project_num):
    """Handle GET (single project) and PUT (update project) from React."""
    if request.method == 'GET':
        try:
            data = client.get_project(project_num)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'PUT':
        try:
            data = client.update_project(project_num, request.data)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
