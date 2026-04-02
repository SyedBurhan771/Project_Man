from django.db import models

class Milestone(models.Model):
    name = models.CharField(max_length=200)
    project = models.CharField(max_length=100)
    due_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('in_progress', 'In Progress'),
            ('on_track', 'On Track'),
            ('complete', 'Complete')
        ],
        default='in_progress'
    )

    def __str__(self):
        return self.name


class Deadline(models.Model):
    task = models.CharField(max_length=200)
    project = models.CharField(max_length=100)
    assignee = models.CharField(max_length=100)
    due_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('overdue', 'Overdue'),
            ('due_soon', 'Due Soon')
        ],
        default='due_soon'
    )

    def __str__(self):
        return self.task