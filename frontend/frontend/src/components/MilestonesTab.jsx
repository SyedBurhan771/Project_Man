import React from 'react';
import { CheckCircle2, Clock, Circle, Calendar, Flag } from 'lucide-react';

export default function MilestonesTab({ project }) {
  if (!project?.milestones) {
    return <div className="text-gray-500">No milestones available</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Flag className="w-4 h-4" />
          Project Milestones
        </h3>
        <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
          + Add Milestone
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {project.milestones.map((milestone, idx) => {
          const isLast = idx === project.milestones.length - 1;

          return (
            <div key={milestone.id} className="relative">
              {/* Vertical timeline line */}
              {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
              )}

              <div className="flex gap-4">
                {/* Status Circle */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      milestone.status === 'completed'
                        ? 'bg-green-500'
                        : milestone.status === 'in-progress'
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : milestone.status === 'in-progress' ? (
                      <Clock className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Milestone Card */}
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">
                        {milestone.name}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                        milestone.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : milestone.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {milestone.status === 'completed'
                        ? 'Completed'
                        : milestone.status === 'in-progress'
                        ? 'In Progress'
                        : 'Pending'}
                    </span>
                  </div>

                  {/* Date & Days Remaining */}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(milestone.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {milestone.status === 'pending' && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium text-amber-600">
                          {Math.ceil(
                            (new Date(milestone.date) - new Date()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          days remaining
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-700">
              {project.milestones.filter((m) => m.status === 'completed').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-blue-700">
              {project.milestones.filter((m) => m.status === 'in-progress').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-gray-700">
              {project.milestones.filter((m) => m.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}