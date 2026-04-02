import { CheckCircle2, Rocket, FileText, Zap, TrendingUp, TestTube, Package, Shield } from 'lucide-react';

const lifecyclePhases = [
  { id: 'initiation', name: 'Initiation', icon: Rocket, color: 'bg-indigo-500' },
  { id: 'planning', name: 'Planning', icon: FileText, color: 'bg-blue-500' },
  { id: 'execution', name: 'Execution', icon: Zap, color: 'bg-orange-500' },
  { id: 'monitoring', name: 'Monitoring', icon: TrendingUp, color: 'bg-yellow-500' },
  { id: 'testing', name: 'Testing/QA', icon: TestTube, color: 'bg-purple-500' },
  { id: 'deployment', name: 'Deployment', icon: Package, color: 'bg-green-500' },
  { id: 'closure', name: 'Closure', icon: Shield, color: 'bg-gray-500' }
];

function LifecycleTimeline({ project }) {
  if (!project?.phases) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Lifecycle Progress</h3>
        <p className="text-gray-500">Lifecycle data is not available for this project yet.</p>
      </div>
    );
  }

  const currentPhaseId = (project.currentPhase || '').toLowerCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      {/* Dynamic Project Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {project.name || "Project"}
        </h1>
        <p className="text-gray-500 mt-1">
          {project.id} • {project.category || project.department || "—"} • {project.currentPhase || "Unknown"}
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-8">Project Lifecycle Progress</h3>

      <div className="relative px-4">
        {/* Gray background line */}
        <div className="absolute top-[29px] left-[30px] right-[30px] h-[3px] bg-gray-200 rounded-full" />

        {/* Colored progress segments */}
        <div className="absolute top-[29px] left-[30px] right-[30px] h-[3px] flex rounded-full overflow-hidden z-10">
          {lifecyclePhases.slice(0, -1).map((phase, idx) => {
            const phaseData = project.phases[phase.id] || { status: 'pending', progress: 0 };
            let segmentClass = 'bg-gray-200';
            let widthPercent = '0%';

            if (phaseData.status === 'completed') {
              segmentClass = 'bg-emerald-500';
              widthPercent = '100%';
            } else if (phaseData.status === 'in-progress') {
              segmentClass = phase.color;
              widthPercent = `${phaseData.progress}%`;
            }

            return (
              <div key={idx} className="flex-1 h-full relative">
                <div
                  className={`absolute left-0 top-0 h-full transition-all ${segmentClass}`}
                  style={{ width: widthPercent }}
                />
              </div>
            );
          })}
        </div>

        {/* Phase circles + info */}
        <div className="flex justify-between relative z-20">
          {lifecyclePhases.map((phase) => {
            const phaseData = project.phases[phase.id] || {
              status: 'pending',
              progress: 0,
              dueDate: '2026-01-01'
            };
            const Icon = phase.icon;
            const isCompleted = phaseData.status === 'completed';
            const isInProgress = phaseData.status === 'in-progress';
            const isActive = currentPhaseId === phase.id;

            let circleClass = 'bg-white border-4 border-gray-200';
            let iconContent;

            if (isCompleted) {
              circleClass = 'bg-emerald-500 border-emerald-500';
              iconContent = <CheckCircle2 className="w-8 h-8 text-white" />;
            } else if (isInProgress || isActive) {
              circleClass = `${phase.color} border-4 border-white`;
              iconContent = <Icon className="w-8 h-8 text-white" />;
            } else {
              iconContent = <Icon className="w-8 h-8 text-gray-400" />;
            }

            return (
              <div key={phase.id} className="flex flex-col items-center w-[calc(100%/7)]">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all ${circleClass}`}>
                  {iconContent}
                </div>
                <p className={`mt-6 text-sm font-semibold text-center ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                  {phase.name}
                </p>
                <p className="text-xs font-bold text-gray-600 mt-1">
                  {phaseData.progress}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(phaseData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LifecycleTimeline;