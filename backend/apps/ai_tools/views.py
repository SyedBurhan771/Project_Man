from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import re
import ollama
from .models import Project, Task

# ====================== COLAB OLLAMA CONFIGURATION ======================
# ←←← CHANGE THIS URL EVERY TIME YOU GET A NEW LINK FROM GOOGLE COLAB
OLLAMA_HOST = "http://xxpmi-35-247-167-11.run.pinggy-free.link"   # ← Paste your current Pinggy URL here
OLLAMA_MODEL = "phi3:mini"

# Create remote client (this talks to Google Colab)
client = ollama.Client(host=OLLAMA_HOST)
# =====================================================================

SYSTEM_PROMPT = """You are an expert Project Manager. 
Your ONLY job is to generate or refine project ideas.

STRICT RULES (never break them):
- ALWAYS respond with a VALID JSON ARRAY of projects. 
- Never add any extra text, explanation, greeting, or markdown outside the JSON.
- Even if user says "create a project" or "give me one idea", return an array (can have 1 or 2-3 items).
- Use this EXACT format for every project:

[
  {
    "name": "Project Name Here",
    "description": "2-4 sentence professional description",
    "category": "Education / Development / Marketing / Healthcare / Finance / Operations / HR / Other",
    "progress": 0,
    "dueDate": "YYYY-MM-DD",
    "teamSize": integer,
    "estimatedDurationDays": integer
  }
]

- If user wants only 1 project → still return array with 1 object.
- If user wants to refine → return updated array (usually 1-3 variations).
- Never respond in plain text when suggesting projects.

Current conversation history will be given."""

@csrf_exempt
def generate_project_ideas(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        data = json.loads(request.body)
        messages = data.get("messages", [])

        if not messages:
            return JsonResponse({"error": "No messages provided"}, status=400)

        ollama_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ] + messages

        # ==================== USING COLAB OLLAMA ====================
        response = client.chat(
            model=OLLAMA_MODEL,
            messages=ollama_messages,
            options={
                "temperature": 0.7,
                "keep_alive": "30m"
            }
        )
        # ===========================================================

        ai_content = response["message"]["content"].strip()

        # Clean common markdown junk
        ai_content = re.sub(r'^```json\s*|\s*```$', '', ai_content, flags=re.MULTILINE | re.IGNORECASE).strip()

        result = {"text": ai_content}

        # Try to parse as JSON projects
        try:
            parsed = json.loads(ai_content)
            if isinstance(parsed, list):
                result["projects"] = parsed
            elif isinstance(parsed, dict) and "name" in parsed:
                result["projects"] = [parsed]
        except json.JSONDecodeError:
            match = re.search(r'\[\s*{.*?}\s*\]', ai_content, re.DOTALL)
            if match:
                try:
                    extracted = json.loads(match.group(0))
                    result["projects"] = extracted if isinstance(extracted, list) else [extracted]
                except:
                    pass

        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ====================== CREATE PROJECT (No Change) ======================
@csrf_exempt
def create_project(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            project = Project.objects.create(
                name=data.get('name'),
                description=data.get('description'),
                category=data.get('category'),
                due_date=data.get('dueDate') or data.get('due_date'),
                duration_days=data.get('estimatedDurationDays') or 
                             data.get('duration') or 
                             data.get('duration_days'),
                team_size=data.get('teamSize') or data.get('team_size'),
                progress=data.get('progress', 0),
            )

            return JsonResponse({
                'success': True,
                'message': f'Project "{project.name}" created successfully!',
                'project_id': project.id
            }, status=201)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Only POST method allowed'}, status=405)


# ====================== CREATE TASK (No Change) ======================
@csrf_exempt
def create_task(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            project_id = data.get('projectId')

            if not project_id:
                return JsonResponse({'success': False, 'error': 'projectId is required'}, status=400)

            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Project not found'}, status=404)

            task = Task.objects.create(
                project=project,
                title=data.get('title', 'Untitled Task'),
                description=data.get('description', ''),
                status=data.get('status', 'todo'),
                estimated_days=data.get('estimatedDays', 0),
                estimated_hours=data.get('estimatedHours', 0),
                estimated_budget=data.get('estimatedBudget', 0),
                person_responsible=data.get('personResponsible', 'Unassigned'),
                progress=0,
            )

            return JsonResponse({
                'success': True,
                'message': f'Task "{task.title}" created',
                'task_id': task.id
            }, status=201)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Only POST allowed'}, status=405)


# ====================== GENERATE TASKS FOR PROJECT (UPDATED) ======================
@csrf_exempt
def generate_tasks_for_project(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        data = json.loads(request.body)
        project = data.get("project", {})
        user_prompt = data.get("prompt", "")

        TASK_SYSTEM_PROMPT = f"""You are a certified PMP (Project Management Professional) expert helping to structure a complete project management plan.

Project Details:
- Project Name: {project.get('name', 'Unnamed Project')}
- Description: {project.get('description', '')}
- Category: {project.get('category', '')}



You must generate realistic, actionable tasks according to the user's request.

### Response Rules:

- If the user asks to generate tasks for the **entire project**:
  - Generate 10 to 16 high-quality tasks in total.
  - Organize them strictly according to the 5 PMP Process Groups in this exact order:
    1. Initiating
    2. Planning
    3. Executing
    4. Monitoring and Controlling
    5. Closing
  - Distribute the tasks evenly across all 5 phases.

- If the user asks to generate tasks for a **specific phase only** (for example: "only Monitoring and Controlling" or "only Initiating phase"):
  - Generate tasks **only** for that requested phase.
  - Do not create tasks for any other phases.
  - Return 2 to 5 high-quality tasks for that specific phase.

In both cases:
- Every task title must start with the exact phase name followed by " - ". 
  Examples: "Initiating - Develop Project Charter", "Monitoring and Controlling - Track Project Progress"
- All task titles must be unique and must not repeat any existing tasks.
- Return ONLY a valid JSON array of tasks.

### Task Format (Use exactly this structure):

{{
  "title": "Phase - Task Title",
  "description": "Clear, concise, and professional description of the task.",
  "estimatedDays": integer (realistic value between 1 and 30),
  "estimatedHours": integer,
  "status": "todo"
}}

Important Guidelines:
- Assume this is a software or system development project.
- Be specific, professional, and realistic in descriptions and estimates.
- Never repeat any task title that already exists.
- Return only pure valid JSON. Do not include any explanation, markdown, or additional text outside the JSON array."""
        messages = [
            {"role": "system", "content": TASK_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt or "Generate complete structured subtasks following PMP methodology for this project"}
        ]

        # ==================== USING COLAB OLLAMA ====================
        response = client.chat(
            model=OLLAMA_MODEL,
            messages=messages,
            options={
                "temperature": 0.65,
                "num_ctx": 4096,
                "keep_alive": "30m"
            }
        )
        # ===========================================================

        ai_content = response["message"]["content"].strip()
        ai_content = re.sub(r'^```json\s*|\s*```$', '', ai_content, flags=re.MULTILINE | re.IGNORECASE).strip()

        result = {"text": ai_content}

        try:
            parsed = json.loads(ai_content)
            if isinstance(parsed, list):
                result["tasks"] = parsed
            elif isinstance(parsed, dict) and "tasks" in parsed:
                result["tasks"] = parsed["tasks"]
        except:
            match = re.search(r'\[\s*\{.*?\}\s*\]', ai_content, re.DOTALL)
            if match:
                try:
                    result["tasks"] = json.loads(match.group(0))
                except:
                    pass

        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ====================== REMAINING FUNCTIONS (NO CHANGE) ======================
@csrf_exempt
def update_task(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            task_id = data.get('taskId')
            title = data.get('title')

            if not task_id or not title or not title.strip():
                return JsonResponse({'success': False, 'error': 'taskId and title are required'}, status=400)

            try:
                task = Task.objects.get(id=task_id)
            except Task.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Task not found'}, status=404)

            task.title = title.strip()
            task.save()

            return JsonResponse({
                'success': True,
                'message': f'Task updated to "{task.title}"',
                'task_id': task.id
            })

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Only POST allowed'}, status=405)


@csrf_exempt
def create_subtask(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            parent_id = data.get('parentId')
            project_id = data.get('projectId')

            if not parent_id or not project_id:
                return JsonResponse({'success': False, 'error': 'parentId and projectId are required'}, status=400)

            try:
                if str(parent_id).startswith('TAS') or not str(parent_id).isdigit():
                    parent_task = Task.objects.get(task_code=parent_id)
                else:
                    parent_task = Task.objects.get(id=int(parent_id))
            except Task.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Parent task not found'}, status=404)

            try:
                if str(project_id).isdigit():
                    project = Project.objects.get(id=int(project_id))
                else:
                    project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Project not found'}, status=404)

            task = Task.objects.create(
                project=project,
                parent=parent_task,
                title=data.get('title', 'Untitled Subtask'),
                description=data.get('description', ''),
                status=data.get('status', 'todo'),
                estimated_days=data.get('estimatedDays', 0),
                estimated_hours=data.get('estimatedHours', 0),
                estimated_budget=data.get('estimatedBudget', 0),
                person_responsible=data.get('personResponsible', 'Unassigned'),
                due_date=data.get('dueDate'),
                progress=0,
            )

            return JsonResponse({
                'success': True,
                'message': f'Subtask "{task.title}" created under {parent_task.title}',
                'task_id': task.id,
                'task_code': task.task_code
            }, status=201)

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Only POST allowed'}, status=405)