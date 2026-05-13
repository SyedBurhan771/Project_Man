import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, FileText, DollarSign, Users,
  Target, Kanban, Zap, Flag, ChevronDown, ChevronUp
} from "lucide-react";

import OverviewTab from "../components/OverviewTab";
import LifecycleTimeline from "../components/LifecycleTimeline";
import GeneralTab from "../components/GeneralTab";
import FinancialTab from "../components/FinancialTab";
import ResourcesTab from "../components/ResourcesTab";
import TasksTab from "../components/TasksTab";
import BoardTab from "../components/BoardTab";
import SprintsTab from "../components/SprintsTab";
import MilestonesTab from "../components/MilestonesTab";

import { projects } from "../pages/Projects";
import API_URL from '../config';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// ====================== GraphQL Queries ======================
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
      parent {
        id
      }
      subtasks {
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
        parent {
          id
        }
      }
      project {
        id
      }
    }
  }
`;

const tabList = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "lifecycle", label: "Lifecycle", icon: TrendingUp },
  { id: "general", label: "General Info", icon: FileText },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "resources", label: "Resources", icon: Users },
  { id: "tasks", label: "Tasks", icon: Target },
  { id: "board", label: "Board", icon: Kanban },
  { id: "sprints", label: "Sprints", icon: Zap },
  { id: "milestones", label: "Milestones", icon: Flag },
];

function Section({ id, title, icon: Icon, children, isOpen, toggleSection }) {
  return (
    <div id={`section-${id}`} className="mb-8 scroll-mt-24">
      <div
        onClick={() => toggleSection(id)}
        className="bg-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between cursor-pointer hover:bg-blue-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5" />}
          <span className="font-semibold text-lg tracking-wide">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>
      {isOpen && (
        <div className="bg-white border border-gray-200 border-t-0 rounded-b-2xl p-6">
          {children}
        </div>
      )}
    </div>
  );
}

function ProjectDetail({ createMode = false }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();          // ← FIXED: Properly imported and called

  // ====================== ALL HOOKS MUST BE AT THE TOP ======================
  const scrollRef = useRef(null);
  const lastSyncedIdRef = useRef(null);

  const [activeSection, setActiveSection] = useState("overview");
  const [collapsedSections, setCollapsedSections] = useState({});
  const [liveSubtasks, setLiveSubtasks] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState({});
  const [persistedSageProjects, setPersistedSageProjects] = useState([]);
  const [persistedSageLoading, setPersistedSageLoading] = useState(true);

  // ====================== Fetch AI Projects from DB ======================
  const { data: projectsData, loading: projectsLoading } = useQuery(GET_PROJECTS);

  // ====================== Fetch ALL Tasks from DB ======================
  const { data: tasksData, loading: tasksLoading } = useQuery(GET_ALL_TASKS);

  useEffect(() => {
    const fetchPersistedSageProjects = async () => {
      try {
        const response = await fetch(`${API_URL}/api/soap/projects/`);
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success || !Array.isArray(result.projects)) {
          setPersistedSageProjects([]);
          return;
        }

        const normalized = result.projects.map((p) => {
          const projectId = String(p.project_id || "").trim();
          const description = String(p.description || "").trim();
          const site = String(p.site || "").trim() || "Sage";
          const category = String(p.category || "").trim() || "010";
          const salesRep = String(p.sales_rep || "").trim() || "Unassigned";

          return {
            id: projectId,
            name: p.projectName || p.short_desc || description || projectId || "Untitled Sage Project",
            code: projectId || "Pending ID",
            category: `${site} / ${category}`,
            status: "Open",
            health: "good",
            progress: 0,
            endDate: "-",
            duration: 60,
            description: description || "Project created from Sage SOAP UI form.",
            customer: {
              name: p.customer ? `BP ${p.customer}` : "Unknown",
              contactName: "-",
              salesRepName: salesRep,
            },
            sageX3: p,
            startDate: "-",
            timeSpent: 0,
            estimatedTime: 60,
            personResponsible: salesRep,
            currentPhase: "planning",
            totalBudget: 0,
            currency: "EUR",
            projectResources: [],
            phases: {
              initiation: { status: "completed", progress: 100, dueDate: "-" },
              planning: { status: "in-progress", progress: 20, dueDate: "-" },
              execution: { status: "pending", progress: 0, dueDate: "-" },
              monitoring: { status: "pending", progress: 0, dueDate: "-" },
              testing: { status: "pending", progress: 0, dueDate: "-" },
              deployment: { status: "pending", progress: 0, dueDate: "-" },
              closure: { status: "pending", progress: 0, dueDate: "-" },
            },
            subtasks: [],
          };
        });

        setPersistedSageProjects(normalized);
      } catch {
        setPersistedSageProjects([]);
      } finally {
        setPersistedSageLoading(false);
      }
    };

    fetchPersistedSageProjects();
  }, []);

  const routeProject = useMemo(() => {
    const routeStateProject = location?.state?.project;
    if (!routeStateProject || String(routeStateProject.id) !== String(id)) return null;
    return {
      ...routeStateProject,
      description: routeStateProject.description || "",
      customer: routeStateProject.customer || { name: "Unknown", contactName: "-", salesRepName: "-" },
      sageX3: routeStateProject.sageX3 || null,
      startDate: routeStateProject.startDate || "-",
      timeSpent: routeStateProject.timeSpent || 0,
      estimatedTime: routeStateProject.estimatedTime || routeStateProject.duration || 60,
      personResponsible: routeStateProject.personResponsible || "Unassigned",
      currentPhase: routeStateProject.currentPhase || "planning",
      totalBudget: routeStateProject.totalBudget || 0,
      currency: routeStateProject.currency || "EUR",
      projectResources: routeStateProject.projectResources || [],
      phases: routeStateProject.phases || {
        initiation: { status: "completed", progress: 100, dueDate: "-" },
        planning: { status: "in-progress", progress: 20, dueDate: "-" },
        execution: { status: "pending", progress: 0, dueDate: "-" },
        monitoring: { status: "pending", progress: 0, dueDate: "-" },
        testing: { status: "pending", progress: 0, dueDate: "-" },
        deployment: { status: "pending", progress: 0, dueDate: "-" },
        closure: { status: "pending", progress: 0, dueDate: "-" },
      },
      subtasks: routeStateProject.subtasks || [],
    };
  }, [location.state, id]);

  const dbProjects = useMemo(() => {
    return (projectsData?.allProjects || []).map((p) => ({
      id: String(p.id),
      name: p.name,
      code: `AI-${p.id}`,
      category: p.category || 'Finance / Development',
      status: 'Open',
      health: 'good',
      progress: p.progress || 0,
      endDate: p.dueDate ? p.dueDate.split('T')[0] : '—',
      duration: p.durationDays || 60,
      description: p.description || 'AI-generated project',
      customer: { name: 'Unknown Client', contactName: '—', salesRepName: '—' },
      sageX3: null,
      startDate: '—',
      timeSpent: 0,
      estimatedTime: p.durationDays || 60,
      personResponsible: 'AI Assistant',
      currentPhase: 'planning',
      totalBudget: 0,
      currency: 'USD',
      projectResources: [],
      phases: {
        initiation: { status: 'completed', progress: 100, dueDate: '—' },
        planning: { status: 'in-progress', progress: 30, dueDate: '—' },
        execution: { status: 'pending', progress: 0, dueDate: '—' },
        monitoring: { status: 'pending', progress: 0, dueDate: '—' },
        testing: { status: 'pending', progress: 0, dueDate: '—' },
        deployment: { status: 'pending', progress: 0, dueDate: '—' },
        closure: { status: 'pending', progress: 0, dueDate: '—' },
      },
      subtasks: [],
    }));
  }, [projectsData]);

  const dbSubtasksForProject = useMemo(() => {
    if (!tasksData?.allTasks) return [];

    const tasks = tasksData.allTasks.filter(t => String(t.project?.id) === String(id) && !t.parent?.id);

    return tasks.map(t => ({
      id: String(t.id),
      title: t.title,
      description: t.description,
      status: t.status || 'todo',
      progress: t.progress || 0,
      estimatedDays: t.estimatedDays,
      estimatedHours: t.estimatedHours,
      expense: parseFloat(t.estimatedBudget) || 0,
      personResponsible: t.personResponsible || 'Unassigned',
      endDate: t.dueDate,
      parent: t.parent || null,
      avatar: t.personResponsible ? t.personResponsible.slice(0, 2).toUpperCase() : 'AI',
      budgets: [],
      subtasks: (t.subtasks || []).map(sub => ({
        id: String(sub.id),
        title: sub.title,
        description: sub.description,
        status: sub.status || 'todo',
        progress: sub.progress || 0,
        estimatedDays: sub.estimatedDays,
        estimatedHours: sub.estimatedHours,
        expense: parseFloat(sub.estimatedBudget) || 0,
        personResponsible: sub.personResponsible || 'Unassigned',
        endDate: sub.dueDate,
        parent: { id: String(t.id) },
        avatar: sub.personResponsible ? sub.personResponsible.slice(0, 2).toUpperCase() : 'AI',
        budgets: [],
        subtasks: [],
      })),
    }));
  }, [tasksData, id]);

  const project = useMemo(() => {
    const staticProject = projects.find((p) => p.id === id);
    if (staticProject) return staticProject;

    const persistedProject = persistedSageProjects.find((p) => String(p.id) === String(id));
    if (persistedProject) return persistedProject;

    const dbProject = dbProjects.find(p => p.id === String(id));
    if (dbProject) {
      return { ...dbProject, subtasks: dbSubtasksForProject };
    }

    if (routeProject) {
      if (routeProject.code && routeProject.code.startsWith('AI-')) {
        return { ...routeProject, subtasks: dbSubtasksForProject };
      }
      return routeProject;
    }

    return null;
  }, [dbProjects, dbSubtasksForProject, id, persistedSageProjects, routeProject]);

  const [sageSubtasks, setSageSubtasks] = useState([]);

  useEffect(() => {
    const oppnum = project?.projectNum || project?.id;
    if (!oppnum || String(oppnum).startsWith('draft')) return;

    const fetchSageTasks = async () => {
      try {
        const response = await fetch(`${API_URL}/api/soap/tasks/?oppnum=${oppnum}`);
        const result = await response.json();
        if (result.success && result.tasks) {
          const mapped = result.tasks.map(t => ({
            id: t.taskCode,
            title: t.description || t.shortDesc || t.taskCode,
            status: String(t.status) === '1' ? 'todo' : String(t.status) === '2' ? 'in-progress' : String(t.status) === '3' ? 'completed' : 'todo',
            progress: t.progress || 0,
            personResponsible: 'Unassigned',
            endDate: t.endDate || t.startDate || '—',
            avatar: 'SA',
          }));
          setSageSubtasks(mapped);
        }
      } catch (err) {
        console.error("Error fetching sage tasks for project detail:", err);
      }
    };

    fetchSageTasks();
  }, [project?.projectNum, project?.id]);

  useEffect(() => {
    if (!project) return;
    
    // Combine local subtasks and mapped Sage subtasks, ensuring no duplicates by ID
    const localTasks = project.subtasks || [];
    const combined = [...localTasks];
    
    sageSubtasks.forEach(st => {
      if (!combined.find(lt => String(lt.id) === String(st.id))) {
        combined.push(st);
      }
    });

    // Sort combined tasks by id (T-01, T-02, etc.) in ascending order
    combined.sort((a, b) => {
      const idA = String(a.id || '');
      const idB = String(b.id || '');
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });

    setLiveSubtasks(combined);
  }, [project, sageSubtasks]);

  // Intersection observer & hash handling (unchanged)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let visibleId = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sId = entry.target.id.replace("section-", "");
            if (!visibleId || entry.boundingClientRect.top < visibleId.top) {
              visibleId = { id: sId, top: entry.boundingClientRect.top };
            }
          }
        });
        if (visibleId) {
          setActiveSection(visibleId.id);
          window.history.replaceState(null, "", `#${visibleId.id}`);
        }
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: "-120px 0px -40% 0px" }
    );
    document.querySelectorAll("div[id^='section-']").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scrollToSection = (sectionId) => {
      setCollapsedSections(prev => ({ ...prev, [sectionId]: true }));
      setActiveSection(sectionId);
      window.history.replaceState(null, "", `#${sectionId}`);
      const element = document.getElementById(`section-${sectionId}`);
      if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") || "overview";
      scrollToSection(hash);
    };
    window.addEventListener("hashchange", handleHash);
    handleHash();
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const liveProject = useMemo(() => {
    if (!project) return null;
    return { ...project, subtasks: liveSubtasks };
  }, [project, liveSubtasks]);

  const handleAssignmentsChange = (updatedAssignments) => {
    setTaskAssignments(updatedAssignments);
  };

  const handleTaskStatusChange = (taskId, newStatus) => {
    const updateTasks = (tasks) => {
      return tasks.map(t => {
        if (t.id === taskId) return { ...t, status: newStatus };
        if (t.subtasks && t.subtasks.length > 0) {
          return { ...t, subtasks: updateTasks(t.subtasks) };
        }
        return t;
      });
    };
    setLiveSubtasks(prev => updateTasks(prev));
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const scrollTo = (sectionId) => {
    setCollapsedSections(prev => ({ ...prev, [sectionId]: true }));
    setActiveSection(sectionId);
    window.history.replaceState(null, "", `#${sectionId}`);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!project && (projectsLoading || tasksLoading || persistedSageLoading)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!liveProject) return <div className="p-10 text-red-500">Project not found</div>;

  if (createMode) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
          <div className="flex px-8 overflow-x-auto">
            {tabList.map(tab => (
              <button
                key={tab.id}
                className={`px-6 py-5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${tab.id === 'general'
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
                disabled={tab.id !== 'general'}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <Section id="general" title="General Info" icon={FileText} isOpen={true} toggleSection={() => {}}>
            <GeneralTab 
              createMode={true} 
              onProjectCreated={() => navigate('/projects')} 
            />
          </Section>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Sticky Horizontal Tabs */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="flex px-8 overflow-x-auto">
          {tabList.map(tab => (
            <button
              key={tab.id}
              onClick={() => scrollTo(tab.id)}
              className={`px-6 py-5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${activeSection === tab.id
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8">
        <Section id="overview" title="Overview" icon={LayoutDashboard}
          isOpen={collapsedSections.overview !== false} toggleSection={toggleSection}>
          <OverviewTab project={liveProject} onViewTasks={() => scrollTo("tasks")} />
        </Section>

        <Section id="lifecycle" title="Lifecycle" icon={TrendingUp}
          isOpen={collapsedSections.lifecycle !== false} toggleSection={toggleSection}>
          <LifecycleTimeline project={liveProject} />
        </Section>

        <Section id="general" title="General Info" icon={FileText}
          isOpen={collapsedSections.general !== false} toggleSection={toggleSection}>
          <GeneralTab project={liveProject} />
        </Section>

        <Section id="financial" title="Financial" icon={DollarSign}
          isOpen={collapsedSections.financial !== false} toggleSection={toggleSection}>
          <FinancialTab project={liveProject} taskAssignments={taskAssignments} />
        </Section>

        <Section id="resources" title="Resources" icon={Users}
          isOpen={collapsedSections.resources !== false} toggleSection={toggleSection}>
          <ResourcesTab project={liveProject} />
        </Section>

        <Section id="tasks" title="Tasks" icon={Target}
          isOpen={collapsedSections.tasks !== false} toggleSection={toggleSection}>
          <TasksTab
            project={liveProject}
            onAssignmentsChange={handleAssignmentsChange}
          />
        </Section>

        <Section id="board" title="Board" icon={Kanban}
          isOpen={collapsedSections.board !== false} toggleSection={toggleSection}>
          <BoardTab
            project={liveProject}
            onTaskStatusChange={handleTaskStatusChange}
          />
        </Section>

        <Section id="sprints" title="Sprints" icon={Zap}
          isOpen={collapsedSections.sprints !== false} toggleSection={toggleSection}>
          <SprintsTab project={liveProject} />
        </Section>

        <Section id="milestones" title="Milestones" icon={Flag}
          isOpen={collapsedSections.milestones !== false} toggleSection={toggleSection}>
          <MilestonesTab project={liveProject} />
        </Section>
      </div>
    </div>
  );
}

export default ProjectDetail;