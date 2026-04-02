from django.db import models
import json

class Resource(models.Model):
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    department = models.CharField(max_length=50)
    avatar = models.CharField(max_length=10, blank=True)
    email = models.EmailField(unique=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)

    # Availability & Capacity
    availability = models.CharField(
        max_length=20,
        choices=[('available', 'Available'), ('partial', 'Partially Available'), ('busy', 'Busy')],
        default='available'
    )
    capacity = models.IntegerField(default=0)           # %
    hoursPerWeek = models.IntegerField(default=40)
    hoursAllocated = models.IntegerField(default=0)
    hoursAvailable = models.IntegerField(default=0)

    # Performance
    tasksCompleted = models.IntegerField(default=0)
    tasksInProgress = models.IntegerField(default=0)
    avgCompletionTime = models.FloatField(default=0.0)  # days
    rating = models.FloatField(default=0.0)

    # Extra fields from frontend (stored as JSON)
    skills = models.JSONField(default=list, blank=True)             # list of dicts
    qualifications = models.JSONField(default=list, blank=True)     # list of dicts
    currentProjects = models.JSONField(default=list, blank=True)    # list of dicts
    weeklyAvailability = models.JSONField(default=list, blank=True) # list of dicts

    def __str__(self):
        return self.name