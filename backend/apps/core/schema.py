import graphene
from graphene_django.types import DjangoObjectType

# ==================== IMPORT ALL MODELS ====================
from apps.core.models import Resource          # old model
from apps.milestones.models import Milestone, Deadline   # new models
from apps.ai_tools.models import Project, Task   # ← ADDED (for AI projects)



# ==================== TYPES ====================

class ResourceType(DjangoObjectType):
    class Meta:
        model = Resource
        fields = "__all__"


class MilestoneType(DjangoObjectType):
    class Meta:
        model = Milestone
        fields = "__all__"


class DeadlineType(DjangoObjectType):
    class Meta:
        model = Deadline
        fields = "__all__"



# ====================== NEW: PROJECT TYPE ======================
class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = "__all__"          # gives id, name, description, category, dueDate, durationDays, teamSize, progress etc.


# ====================== NEW : Sub Tasks======================
class TaskType(DjangoObjectType):
    class Meta:
        model = Task
        fields = "__all__"

class AiToolsQuery(graphene.ObjectType):
    all_projects = graphene.List(ProjectType)
# ==================== ROOT QUERY ====================
class Query(graphene.ObjectType):
    # Old query (Resources)
    all_resources = graphene.List(ResourceType)

    # New queries (Dashboard ke liye)
    all_milestones = graphene.List(MilestoneType)
    all_deadlines = graphene.List(DeadlineType)

    # ====================== NEW: AI PROJECTS QUERY ======================
    all_projects = graphene.List(ProjectType)
    all_tasks = graphene.List(TaskType)

    # Resolvers
    def resolve_all_resources(self, info):
        return Resource.objects.all()

    def resolve_all_milestones(self, info):
        return Milestone.objects.all()

    def resolve_all_deadlines(self, info):
        return Deadline.objects.all()

    # ====================== NEW: AI PROJECTS RESOLVER ======================
    def resolve_all_projects(self, info):
        return Project.objects.all()
    
    def resolve_all_tasks(self, info):
        return Task.objects.all()

    def resolve_tasks_by_project(self, info, project_id):
        return Task.objects.filter(project_id=project_id)


# ==================== SCHEMA ====================
schema = graphene.Schema(query=Query)