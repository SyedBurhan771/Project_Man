import { Users, CheckCircle2, AlertCircle, Circle } from 'lucide-react';

function ResourcesTab({ project }) {
  if (!project || !project.subtasks) return null;

  // Derive resources from unique personResponsible
  const resourcesMap = project.subtasks.reduce((acc, t) => {
    const name = t.personResponsible || 'Unassigned';
    if (!acc[name]) {
      acc[name] = { name, tasks: 0, avatar: name.slice(0,2).toUpperCase() };
    }
    acc[name].tasks += 1;
    return acc;
  }, {});

  const resources = Object.values(resourcesMap);

  const getAvailabilityBadge = (tasksCount) => {
    if (tasksCount <= 2) return { color: 'bg-green-500', text: 'Available', icon: CheckCircle2 };
    if (tasksCount <= 5) return { color: 'bg-yellow-500', text: 'Partial', icon: AlertCircle };
    return { color: 'bg-red-500', text: 'Busy', icon: Circle };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Project Resources ({resources.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Role</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Tasks Assigned</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {resources.map((res) => {
              const avail = getAvailabilityBadge(res.tasks);
              const AvailIcon = avail.icon;
              return (
                <tr key={res.name} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {res.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{res.name}</p>
                        <p className="text-xs text-gray-600">Team Member</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">Assigned</td>
                  <td className="px-4 py-4 text-center font-semibold">{res.tasks}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`${avail.color} text-white px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1`}>
                      <AvailIcon className="w-3.5 h-3.5" />
                      {avail.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResourcesTab;