from django.db import models

class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    due_date = models.DateField(null=True, blank=True)
    duration_days = models.PositiveIntegerField(default=30)
    team_size = models.PositiveIntegerField(default=1)
    progress = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name



    class Meta:
        ordering = ['-created_at']



class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    
    # NEW: Parent task for hierarchy (subtasks)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('todo', 'To Do'),
            ('in-progress', 'In Progress'),
            ('completed', 'Completed'),
        ],
        default='todo'
    )
    estimated_days = models.PositiveIntegerField(default=0)
    estimated_hours = models.PositiveIntegerField(default=0)
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    person_responsible = models.CharField(max_length=100, blank=True)
    due_date = models.DateField(null=True, blank=True)
    progress = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.project.name})"

    class Meta:
        ordering = ['-created_at']