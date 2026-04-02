import React, { useMemo } from 'react';
import { Circle, Clock, CheckCircle2, Calendar, User, ArrowRight } from 'lucide-react';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
const GET_ALL_TASKS = gql`
  query GetAllTasks {
    allTasks {
      id
      title
      description
      status
      estimatedDays
      estimatedHours
      estimatedBudget
      personResponsible
      dueDate
      progress
      project {
        id
      }
    }
  }
`;

const NEXT_STATUS = {
  'todo':        'in-progress',
  'in-progress': 'completed',
  'completed':   'todo',
};

export default function BoardTab({ project, onTaskStatusChange }) {
  if (!project) return <div className="p-8 text-center text-gray-500">No project data</div>;

  // Fetch all tasks and filter by current project
  const { data } = useQuery(GET_ALL_TASKS);

  const dbTasks = useMemo(() => {
    if (!data?.allTasks || !project?.id) return [];
    return data.allTasks.filter(task => 
      String(task.project?.id) === String(project.id)
    );
  }, [data, project?.id]);

  // Use DB tasks for AI projects, otherwise use Sage subtasks
  const subtasks = useMemo(() => {
    if (dbTasks.length > 0) {
      return dbTasks.map(t => ({
        id: String(t.id),
        title: t.title,
        status: t.status,
        progress: t.progress || 0,
        personResponsible: t.personResponsible || 'Unassigned',
        endDate: t.dueDate,
        avatar: t.personResponsible ? t.personResponsible.slice(0, 2).toUpperCase() : 'AI',
      }));
    }
    return project.subtasks || [];
  }, [dbTasks, project.subtasks]);

  const todoTasks       = subtasks.filter(t => t.status === 'todo' || !t.status);
  const inProgressTasks = subtasks.filter(t => t.status === 'in-progress');
  const doneTasks       = subtasks.filter(t => t.status === 'completed');

  const handleMove = (taskId, currentStatus) => {
    if (onTaskStatusChange) {
      onTaskStatusChange(taskId, NEXT_STATUS[currentStatus]);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    if (/^\d{6}$/.test(dateStr)) {
      const day   = dateStr.slice(0, 2);
      const month = dateStr.slice(2, 4);
      const year  = '20' + dateStr.slice(4, 6);
      return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getProgress = (task) => {
    const raw = task.progress;
    if (raw != null && raw !== '' && raw !== '0') {
      return Math.min(parseInt(raw, 10), 100);
    }
    return 0;
  };

  const getAvatar = (task) => {
    if (task.avatar) return task.avatar;
    const name = task.personResponsible || '';
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'UN';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Board View</h3>
        <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-medium hover:brightness-105 transition-all">
          + Add Task
        </button>
      </div>

      {/* Summary bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-sm text-gray-600 font-medium">To Do</span>
          <span className="text-sm font-bold text-gray-900">{todoTasks.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600 font-medium">In Progress</span>
          <span className="text-sm font-bold text-gray-900">{inProgressTasks.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600 font-medium">Done</span>
          <span className="text-sm font-bold text-gray-900">{doneTasks.length}</span>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* TO DO */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <Circle className="w-5 h-5 text-gray-400" />
              <h4 className="font-semibold text-gray-900">To Do</h4>
            </div>
            <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
              {todoTasks.length}
            </span>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-4 space-y-3">
            {todoTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleMove(task.id, 'todo')}
                className="bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all rounded-3xl p-5 cursor-pointer group relative"
              >
                <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-40 rounded-3xl transition-opacity pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start gap-2">
                    <h5 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm leading-snug">
                      {task.title}
                    </h5>
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getAvatar(task)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                    <User className="w-3.5 h-3.5" />
                    <span>{task.personResponsible || 'Unassigned'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due {formatDate(task.endDate)}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-3.5 h-3.5" />
                    Move to In Progress
                  </div>
                </div>
              </div>
            ))}

            {todoTasks.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">No tasks in To Do</div>
            )}
          </div>
        </div>

        {/* IN PROGRESS */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-blue-50 px-6 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">In Progress</h4>
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-4 space-y-3">
            {inProgressTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleMove(task.id, 'in-progress')}
                className="bg-white border border-blue-100 hover:border-green-300 hover:shadow-md transition-all rounded-3xl p-5 cursor-pointer group relative"
              >
                <div className="absolute inset-0 bg-green-50 opacity-0 group-hover:opacity-40 rounded-3xl transition-opacity pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start gap-2">
                    <h5 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors text-sm leading-snug">
                      {task.title}
                    </h5>
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getAvatar(task)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                    <User className="w-3.5 h-3.5" />
                    <span>{task.personResponsible || 'Unassigned'}</span>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${getProgress(task)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                      <span>Progress</span>
                      <span>{getProgress(task)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due {formatDate(task.endDate)}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-3.5 h-3.5" />
                    Mark as Done
                  </div>
                </div>
              </div>
            ))}

            {inProgressTasks.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">No tasks in progress</div>
            )}
          </div>
        </div>

        {/* DONE */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-green-50 px-6 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Done</h4>
            </div>
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
              {doneTasks.length}
            </span>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-4 space-y-3">
            {doneTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleMove(task.id, 'completed')}
                className="bg-white border border-green-100 hover:border-gray-300 hover:shadow-md transition-all rounded-3xl p-5 cursor-pointer group relative"
              >
                <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-40 rounded-3xl transition-opacity pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start gap-2">
                    <h5 className="font-semibold text-gray-500 line-through text-sm leading-snug">
                      {task.title}
                    </h5>
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getAvatar(task)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-green-600 mt-4">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed</span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-3.5 h-3.5" />
                    Move back to Todo
                  </div>
                </div>
              </div>
            ))}

            {doneTasks.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">No completed tasks yet</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}