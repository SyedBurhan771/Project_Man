from rest_framework import serializers

from apps.core.models import Resource
from apps.milestones.models import Deadline, Milestone


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = "__all__"


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = "__all__"


class DeadlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deadline
        fields = "__all__"

