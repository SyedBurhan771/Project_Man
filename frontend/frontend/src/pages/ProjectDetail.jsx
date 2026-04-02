import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
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
      project {
        id
      }
    }
  }
`;

const tabList = [
  { id: "overview",   label: "Overview",     icon: LayoutDashboard },
  { id: "lifecycle",  label: "Lifecycle",     icon: TrendingUp      },
  { id: "general",    label: "General Info",  icon: FileText        },
  { id: "financial",  label: "Financial",     icon: DollarSign      },
  { id: "resources",  label: "Resources",     icon: Users           },
  { id: "tasks",      label: "Tasks",         icon: Target          },
  { id: "board",      label: "Board",         icon: Kanban          },
  { id: "sprints",    label: "Sprints",       icon: Zap             },
  { id: "milestones", label: "Milestones",    icon: Flag            },
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

function ProjectDetail() {
  const { id } = useParams();
  const location = useLocation();
  const BACKEND_URL = "http://127.0.0.1:8000";

  // ====================== ALL HOOKS MUST BE AT THE TOP ======================
  // UI state refs - MOVED TO TOP
  const scrollRef = useRef(null);
  const lastSyncedIdRef = useRef(null);
  
  // UI state - MOVED TO TOP
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
        const response = await fetch(`${BACKEND_URL}/api/soap/projects/`);
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
            name: description || projectId || "New Sage Project",
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
  }, [BACKEND_URL]);

  // ── 1. Memoize Sage project lookup — stable, never re-runs unless id changes
  const routeProject = useMemo(() => {
    const routeStateProject = location?.state?.project;
    if (!routeStateProject || String(routeStateProject.id) !== String(id)) return null;
    return {
      ...routeStateProject,
      description: routeStateProject.description || "Project created from UI.",
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

  const sageProject = useMemo(() => {
    const staticProject = projects.find((p) => p.id === id);
    if (staticProject) return staticProject;

    const persistedProject = persistedSageProjects.find((p) => String(p.id) === String(id));
    if (persistedProject) return persistedProject;

    if (routeProject) return routeProject;
    return null;
  }, [id, persistedSageProjects, routeProject]);

  // ── 2. Memoize DB projects list — only recomputes when GraphQL data changes
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
        planning:   { status: 'in-progress', progress: 30, dueDate: '—' },
        execution:  { status: 'pending', progress: 0, dueDate: '—' },
        monitoring: { status: 'pending', progress: 0, dueDate: '—' },
        testing:    { status: 'pending', progress: 0, dueDate: '—' },
        deployment: { status: 'pending', progress: 0, dueDate: '—' },
        closure:    { status: 'pending', progress: 0, dueDate: '—' },
      },
      subtasks: [],
    }));
  }, [projectsData]);

  // ── 3. THE KEY FIX: Memoize DB tasks filtered for THIS project id ───────────
  const dbSubtasksForProject = useMemo(() => {
    if (!tasksData?.allTasks) return [];
    return tasksData.allTasks
      .filter(t => String(t.project?.id) === String(id))
      .map(t => ({
        id:                String(t.id),
        title:             t.title,
        description:       t.description,
        status:            t.status || 'todo',
        progress:          t.progress || 0,
        estimatedDays:     t.estimatedDays,
        estimatedHours:    t.estimatedHours,
        expense:           t.estimatedBudget || 0,
        personResponsible: t.personResponsible || 'Unassigned',
        endDate:           t.dueDate,
        avatar:            t.personResponsible
                             ? t.personResponsible.slice(0, 2).toUpperCase()
                             : 'AI',
        budgets: [],
      }));
  }, [tasksData, id]);

  // ── 4. Memoize the fully resolved project object ────────────────────────────
  const project = useMemo(() => {
    if (sageProject) return sageProject;

    const dbProject = dbProjects.find(p => p.id === String(id));
    if (!dbProject) return null;

    return { ...dbProject, subtasks: dbSubtasksForProject };
  }, [sageProject, dbProjects, dbSubtasksForProject, id]);

  // ── 5. liveSubtasks sync — local state that allows BoardTab status changes ────────
  useEffect(() => {
    if (!project) return;

    const subtasks = project.subtasks || [];
    const projectChanged = lastSyncedIdRef.current !== id;
    const dbTasksJustArrived = liveSubtasks.length === 0 && subtasks.length > 0;

    if (projectChanged || dbTasksJustArrived) {
      setLiveSubtasks(subtasks);
      lastSyncedIdRef.current = id;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, project]);

  // ── 6. Intersection observer for section tracking - MOVED TO TOP ────────────────────────────
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

  // ── 7. Hash change handler - MOVED TO TOP ────────────────────────────────────────────────────
  useEffect(() => {
    const scrollTo = (sectionId) => {
      setCollapsedSections(prev => ({ ...prev, [sectionId]: true }));
      setActiveSection(sectionId);
      window.history.replaceState(null, "", `#${sectionId}`);
      const element = document.getElementById(`section-${sectionId}`);
      if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") || "overview";
      scrollTo(hash);
    };
    window.addEventListener("hashchange", handleHash);
    handleHash();
    return () => window.removeEventListener("hashchange", handleHash);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 8. liveProject — stable object passed to every child tab ────────────────
  const liveProject = useMemo(() => {
    if (!project) return null;
    return { ...project, subtasks: liveSubtasks };
  }, [project, liveSubtasks]);

  // ====================== CALLBACKS ======================
  const handleAssignmentsChange = (updatedAssignments) => {
    setTaskAssignments(updatedAssignments);
  };

  const handleTaskStatusChange = (taskId, newStatus) => {
    setLiveSubtasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    );
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

  // ── NOW CONDITIONAL RETURNS ARE SAFE (all hooks already called) ───
  if (!sageProject && (projectsLoading || tasksLoading || persistedSageLoading)) {
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">

      {/* Sticky Horizontal Tabs */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="flex px-8 overflow-x-auto">
          {tabList.map(tab => (
            <button
              key={tab.id}
              onClick={() => scrollTo(tab.id)}
              className={`px-6 py-5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                activeSection === tab.id
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

        {/* Financial tab receives taskAssignments */}
        <Section id="financial" title="Financial" icon={DollarSign}
          isOpen={collapsedSections.financial !== false} toggleSection={toggleSection}>
          <FinancialTab project={liveProject} taskAssignments={taskAssignments} />
        </Section>

        <Section id="resources" title="Resources" icon={Users}
          isOpen={collapsedSections.resources !== false} toggleSection={toggleSection}>
          <ResourcesTab project={liveProject} />
        </Section>

        {/* Tasks tab receives onAssignmentsChange callback */}
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
