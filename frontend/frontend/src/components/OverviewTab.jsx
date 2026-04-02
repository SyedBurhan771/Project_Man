import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';

// Calculates live progress from subtask statuses
// completed = 1 point, in-progress = 0.5 points, todo = 0
function calcLiveProgress(subtasks = []) {
  if (subtasks.length === 0) return 0;
  const score = subtasks.reduce((sum, t) => {
    if (t.status === 'completed')   return sum + 1;
    if (t.status === 'in-progress') return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((score / subtasks.length) * 100);
}

export default function OverviewTab({ project, onViewTasks }) {
  const subtasks     = project.subtasks || [];
  const ongoingTasks = subtasks.filter(t => t.status === 'in-progress');
  const displayedTasks = ongoingTasks.slice(0, 3);

  // Always live — recalculates whenever subtasks change
  const liveProgress = calcLiveProgress(subtasks);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    // Handle Sage X3 DDMMYY format (e.g. "010422")
    if (/^\d{6}$/.test(dateStr)) {
      const day   = dateStr.slice(0, 2);
      const month = dateStr.slice(2, 4);
      const year  = '20' + dateStr.slice(4, 6);
      return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getTaskProgress = (task) => {
    if (task.timeSpent && task.estimatedTime) {
      return Math.min(Math.round((task.timeSpent / task.estimatedTime) * 100), 100);
    }
    if (task.progress != null && task.progress !== '' && task.progress !== '0') {
      return Math.min(parseInt(task.progress, 10), 100);
    }
    return 50;
  };

  return (
    <div className="space-y-6">

      {/* Status + Progress — 2 columns, Health removed */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          <p className="text-xl font-bold text-blue-700">{project.status || 'Active'}</p>
        </div>

        <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
          <p className="text-sm text-gray-500 mb-2">Overall Progress</p>
          <div className="flex items-end justify-between mb-2">
            <p className="text-3xl font-bold text-purple-700">{liveProgress}%</p>
            <p className="text-xs text-gray-500 text-right">
              {subtasks.filter(t => t.status === 'completed').length} of {subtasks.length} tasks done
            </p>
          </div>
          <div className="h-2.5 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${liveProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Team Members */}
      {project.team && project.team.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Team Members</h3>
          <div className="flex gap-2 flex-wrap">
            {project.team.map((member, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {member.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm text-gray-900">{member.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ongoing Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Ongoing Tasks ({ongoingTasks.length})
          </h3>
          {ongoingTasks.length > 3 && onViewTasks && (
            <button
              onClick={onViewTasks}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View More
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {displayedTasks.length > 0 ? (
          <div className="space-y-2">
            {displayedTasks.map((task) => (
              <div
                key={task.id || task.taskCode}
                className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {task.avatar ||
                      (task.personResponsible || task.assignee || 'UN')
                        .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {task.title || task.taskCode}
                      </h4>
                      <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
                      <span>{task.assignee || task.personResponsible || 'Unassigned'}</span>
                      {(task.dueDate || task.endDate) && (
                        <>
                          <span>·</span>
                          <span>Due: {formatDate(task.dueDate || task.endDate)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${getTaskProgress(task)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-blue-700 flex-shrink-0">
                        {getTaskProgress(task)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">No ongoing tasks</p>
            <p className="text-xs text-gray-400 mt-1">
              Go to the <span className="font-semibold text-blue-500">Board</span> tab and click a task to start it
            </p>
          </div>
        )}
      </div>

      {/* Budget */}
      {project.budget && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Budget</h3>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">Spent</span>
            <span className="text-sm font-bold text-gray-900">
              ${project.budget.spent?.toLocaleString()} / ${project.budget.total?.toLocaleString()}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((project.budget.spent / project.budget.total) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

    </div>
  );
}