import { useEffect, useState } from 'react';
import { Plus, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AICreateProject from '../components/AICreateProject';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
// Import real Sage X3 data
import { sageX3Projects } from '../data/sageX3Projects';
import API_URL from '../config';   // ← Added this import

// Date parser helper
const parseSageDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 6) return '—';
  const day = dateStr.slice(0, 2);
  const month = dateStr.slice(2, 4);
  const year = `20${dateStr.slice(4, 6)}`;
  return `${year}-${month}-${day}`;
};

// Enrich projects with real data + Lifecycle Phases
export const projects = sageX3Projects.map((p) => {
  const allLines = p.tasks.flatMap((t) =>
    (t.budgets || []).flatMap((b) => b.lines || [])
  );

  const totalBudget = allLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const overallProgress = p.tasks.length > 0
    ? Math.round(p.tasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / p.tasks.length)
    : 0;

  // ==================== ADD LIFECYCLE PHASES ====================
  const phases = {
    initiation: { status: 'completed', progress: 100, dueDate: parseSageDate(p.openDate) },
    planning: { status: overallProgress > 20 ? 'completed' : 'in-progress', progress: Math.min(100, overallProgress * 2), dueDate: '2026-01-15' },
    execution: { status: overallProgress > 40 ? 'in-progress' : 'pending', progress: Math.max(0, Math.min(100, overallProgress - 30)), dueDate: '2026-02-15' },
    monitoring: { status: overallProgress > 60 ? 'in-progress' : 'pending', progress: Math.max(0, Math.min(100, overallProgress - 50)), dueDate: '2026-02-20' },
    testing: { status: overallProgress > 75 ? 'in-progress' : 'pending', progress: Math.max(0, Math.min(100, overallProgress - 70)), dueDate: '2026-02-25' },
    deployment: { status: 'pending', progress: 0, dueDate: '2026-03-01' },
    closure: { status: 'pending', progress: 0, dueDate: parseSageDate(p.tasks.length ? p.tasks[p.tasks.length-1].endDate : '000000') }
  };

  const currentPhase = overallProgress < 20 ? 'planning' :
                       overallProgress < 50 ? 'execution' :
                       overallProgress < 70 ? 'monitoring' :
                       overallProgress < 85 ? 'testing' : 'deployment';

  return {
    id: p.projectNum,
    name: p.projectName || p.projectNum,
    code: p.projectNum,
    category: p.projectType || p.salesSite || 'General',
    status: p.closeFlag === '1' ? 'Open' : 'Closed',
    health: 'good',
    progress: overallProgress,
    totalBudget,
    currency: p.currency,
    customer: {
      name: p.customerBP ? `BP ${p.customerBP}` : 'Unknown',
      contactName: p.contactRelation || '—',
      salesRepName: p.salesRep || '—',
    },
    sageX3: p,
    startDate: parseSageDate(p.openDate),
    endDate: p.tasks.length > 0
      ? parseSageDate(p.tasks.reduce((max, t) => (t.endDate > max ? t.endDate : max), '000000'))
      : '—',
    duration: 60,
    timeSpent: 120,
    estimatedTime: 200,
    personResponsible: p.creationUser || p.changeUser || 'Admin',
    currentPhase,

    // ← THIS WAS MISSING — NOW ADDED
    phases: phases,

    subtasks: p.tasks.map((t, idx) => {
      const taskBudget = (t.budgets || []).reduce(
        (sum, b) => sum + (b.lines || []).reduce((l, line) => l + (line.amount || 0), 0),
        0
      );
      return {
        id: t.systemId || `task-${idx}`,
        title: t.taskCode,
        status: Number(t.progress) === 100 ? 'completed' : Number(t.progress) > 0 ? 'in-progress' : 'todo',
        progress: Number(t.progress) || 0,
        category: t.category,
        startDate: parseSageDate(t.startDate),
        endDate: parseSageDate(t.endDate),
        personResponsible: t.personResponsible || 'Unassigned',
        budgetLink: t.budgetLink || '—',
        budgets: t.budgets || [],
        expense: taskBudget,
        budgetedExpense: taskBudget * 1.2,
        avatar: t.personResponsible?.slice(0, 2).toUpperCase() || 'UN',
      };
    }),
    projectResources: [],
  };
});

// ====================== GraphQL Query ======================
const GET_PROJECTS = gql`
  query GetAllProjects {
    allProjects {
      id
      name
      description
      category
      dueDate
      durationDays
      teamSize
      progress
    }
  }
`;

function Projects() {
  const navigate = useNavigate();
  const [newSageProjects, setNewSageProjects] = useState([]);
  const [persistedSageProjects, setPersistedSageProjects] = useState([]);

  // ====================== Fetch AI Projects from DB ======================
  const { data } = useQuery(GET_PROJECTS);

  const dbProjects = (data?.allProjects || []).map((p) => ({
    id: String(p.id),
    name: p.name,
    code: `AI-${p.id}`,
    category: p.category || 'Finance / Development',
    status: 'Open',
    health: 'good',
    progress: p.progress || 0,
    endDate: p.dueDate ? p.dueDate.split('T')[0] : '—',
    duration: p.durationDays || 60,
    subtasks: Array.from({ length: p.teamSize || 1 }, (_, i) => ({
      personResponsible: `Member ${i + 1}`,
    })),
  }));

  useEffect(() => {
    const fetchPersistedSageProjects = async () => {
      try {
        const response = await fetch(`${API_URL}/api/soap/projects/`);
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success || !Array.isArray(result.projects)) return;

        const normalized = result.projects.map((p) => {
          const projectId = String(p.project_id || '').trim();
          const description = String(p.description || '').trim();
          const site = String(p.site || '').trim() || 'Sage';
          const category = String(p.category || '').trim() || '010';

          return {
            id: projectId || `sage-db-${Date.now()}`,
            name: description || projectId || 'New Sage Project',
            code: projectId || 'Pending ID',
            category: `${site} / ${category}`,
            status: 'Open',
            health: 'good',
            progress: 0,
            endDate: '-',
            duration: 60,
            subtasks: [],
            source: 'soap-db',
          };
        });

        setPersistedSageProjects(normalized);
      } catch {
        // no-op: keep page usable even if backend fetch fails
      }
    };

    fetchPersistedSageProjects();
  }, []);

  const handleSageProjectCreated = (created) => {
    const projectId = String(created?.project_id || '').trim();
    const description = created?.description || projectId || 'New Sage Project';
    const site = created?.site || 'Sage';
    const category = created?.category || '010';

    const normalizedProject = {
      id: projectId || `sage-${Date.now()}`,
      name: description,
      code: projectId || 'Pending ID',
      category: `${site} / ${category}`,
      status: 'Open',
      health: 'good',
      progress: 0,
      endDate: '-',
      duration: 60,
      subtasks: [],
      source: 'soap-ui',
    };

    setNewSageProjects((prev) => {
      const withoutDuplicate = prev.filter((p) => p.id !== normalizedProject.id);
      return [normalizedProject, ...withoutDuplicate];
    });
  };

  const allProjects = [...newSageProjects, ...persistedSageProjects, ...projects, ...dbProjects].filter(
    (project, index, arr) => arr.findIndex((p) => String(p.id) === String(project.id)) === index
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Projects</h1>
          <p className="text-gray-600 mt-1">Select a project to view details</p>
        </div>
        <AICreateProject
          buttonText="New Project"
          onSageProjectCreated={handleSageProjectCreated}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {allProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`, { state: { project } })}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {project.code} • {project.category}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                project.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {project.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Due: {project.endDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{new Set(project.subtasks.map(t => t.personResponsible)).size} members</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;