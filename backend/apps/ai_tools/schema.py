import graphene
from graphene_django.types import DjangoObjectType

# ==================== IMPORT ALL MODELS ====================
from apps.core.models import Resource
from apps.milestones.models import Milestone, Deadline
from apps.ai_tools.models import Project, Task

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

class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = "__all__"

# ====================== TASK TYPE WITH HIERARCHY ======================
class TaskType(DjangoObjectType):
    class Meta:
        model = Task
        fields = "__all__"

    # Allow fetching subtasks recursively
    subtasks = graphene.List(lambda: TaskType)

    def resolve_subtasks(self, info):
        return self.subtasks.all()

# ==================== ROOT QUERY ====================
class Query(graphene.ObjectType):
    all_resources = graphene.List(ResourceType)
    all_milestones = graphene.List(MilestoneType)
    all_deadlines = graphene.List(DeadlineType)
    all_projects = graphene.List(ProjectType)
    all_tasks = graphene.List(TaskType)

    # Resolvers
    def resolve_all_resources(self, info):
        return Resource.objects.all()

    def resolve_all_milestones(self, info):
        return Milestone.objects.all()

    def resolve_all_deadlines(self, info):
        return Deadline.objects.all()

    def resolve_all_projects(self, info):
        return Project.objects.all()

    def resolve_all_tasks(self, info):
        return Task.objects.all()

# ==================== SCHEMA ====================
schema = graphene.Schema(query=Query)