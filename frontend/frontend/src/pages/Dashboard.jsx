import React from 'react';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { 
  FolderOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  Flag, 
  DollarSign, 
  ChevronRight,
  Calendar,
  ChevronLeft,
  Clock,
  Zap,
  FileText,
  X
} from 'lucide-react';

// Import REAL Sage X3 data
import { sageX3Projects } from '../data/sageX3Projects';
const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    allMilestones {
      id
      name
      project
      dueDate
      status
    }
    allDeadlines {
      id
      task
      project
      assignee
      dueDate
      status
    }
  }
`;

// Enrich Sage X3 data (no filtering applied here)
const projects = sageX3Projects.map((p, index) => ({
  id: p.projectNum,
  name: p.projectName || p.projectNum,
  code: p.projectNum,
  category: p.projectType || p.salesSite || 'General',
  status: p.closeFlag === "1" ? "Closed" : "In Progress",
  health: index === 0 ? "good" : index === 1 ? "warning" : "good",
  progress: [65, 42, 78, 30, 55][index % 5], // cycle through dummy values; replace with real if available
  dueDate: '2026-03-05',
  budget: { spent: 12000, total: 20000 } // dummy - can be made real later
}));

const companyResources = [
  { name: 'Sarah Mitchell', role: 'Marketing Manager', allocation: 95, projects: 2, status: 'busy' },
  { name: 'Michael Chen', role: 'Full Stack Developer', allocation: 60, projects: 2, status: 'partial' },
  { name: 'Emma Rodriguez', role: 'Data Analyst', allocation: 40, projects: 2, status: 'available' },
  { name: 'David Kim', role: 'Senior Developer', allocation: 75, projects: 1, status: 'partial' },
];

// const upcomingDeadlines = [
//   { task: 'AI content generation setup', project: 'Phoenix Initiative', assignee: 'Michael Chen', date: '2026-02-10', daysLeft: -13, overdue: true },
//   { task: 'Analytics dashboard setup', project: 'Phoenix Initiative', assignee: 'Emma Rodriguez', date: '2026-02-20', daysLeft: -3, overdue: true },
//   { task: 'System architecture design', project: 'Budget Planning', assignee: 'David Kim', date: '2026-02-28', daysLeft: 5, overdue: false },
// ];

// const upcomingMilestones = [
//   { name: 'AI Integration Complete', project: 'Phoenix Initiative', date: '2026-02-20', status: 'in-progress' },
//   { name: 'Analytics Dashboard Live', project: 'Phoenix Initiative', date: '2026-02-25', status: 'on-track' },
//   { name: 'Campaign Launch', project: 'Phoenix Initiative', date: '2026-03-01', status: 'on-track' },
// ];

const PROJECT_META = {
  "MKT-789": { name: "Phoenix Initiative", color: "#6366f1" },
  "FIN-654": { name: "Budget Planning", color: "#0ea5e9" },
};

const ALL_EVENTS = [
  { date: "2026-02-10", label: "Sprint 12 Start", project: "MKT-789", category: "sprint" },
  { date: "2026-02-10", label: "AI content generation due", project: "MKT-789", category: "deadline", status: "overdue" },
  { date: "2026-02-10", label: "Requirements Finalized", project: "FIN-654", category: "milestone", status: "completed" },
  { date: "2026-02-15", label: "Campaign Content Ready", project: "MKT-789", category: "milestone", status: "completed" },
  { date: "2026-02-15", label: "Architecture design due", project: "FIN-654", category: "deadline" },
  { date: "2026-02-20", label: "AI Integration Complete", project: "MKT-789", category: "milestone", status: "in-progress" },
  { date: "2026-02-20", label: "Analytics dashboard due", project: "MKT-789", category: "deadline", status: "overdue" },
  { date: "2026-02-24", label: "Sprint 12 End", project: "MKT-789", category: "sprint" },
  { date: "2026-02-25", label: "Analytics Dashboard Live", project: "MKT-789", category: "milestone", status: "pending" },
  { date: "2026-02-25", label: "Sprint 13 Start", project: "MKT-789", category: "sprint" },
  { date: "2026-03-01", label: "Campaign Launch", project: "MKT-789", category: "milestone", status: "pending" },
  { date: "2026-03-01", label: "Architecture Design Done", project: "FIN-654", category: "milestone", status: "pending" },
  { date: "2026-03-05", label: "Project Deadline", project: "MKT-789", category: "deadline" },
  { date: "2026-03-11", label: "Sprint 13 End", project: "MKT-789", category: "sprint" },
  { date: "2026-03-15", label: "Execution Phase Starts", project: "FIN-654", category: "phase" },
  { date: "2026-04-10", label: "Budget System Testing", project: "FIN-654", category: "milestone", status: "pending" },
  { date: "2026-04-20", label: "Deployment Phase", project: "FIN-654", category: "phase" },
  { date: "2026-04-25", label: "Project Deadline", project: "FIN-654", category: "deadline" },
];

const CAT_STYLES = {
  milestone: { dotClass: "bg-amber-400", icon: "flag", label: "Milestone" },
  deadline: { dotClass: "bg-red-500", icon: "clock", label: "Deadline" },
  sprint: { dotClass: "bg-green-500", icon: "zap", label: "Sprint" },
  phase: { dotClass: "bg-purple-500", icon: "list", label: "Phase" },
};

function CatIcon({ type, className }) {
  if (type === "flag") return <Flag className={className} />;
  if (type === "clock") return <Clock className={className} />;
  if (type === "zap") return <Zap className={className} />;
  return <FileText className={className} />;
}

function ProjectCalendar() {
  const [viewDate, setViewDate] = React.useState(new Date(2026, 1, 1));
  const [selectedDay, setSelectedDay] = React.useState(null);
  const [filters, setFilters] = React.useState(new Set(["milestone", "deadline", "sprint", "phase"]));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const eventsFor = (day) => {
    const ds = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    return ALL_EVENTS.filter((e) => e.date === ds && filters.has(e.category));
  };
  const toggleFilter = (cat) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };
  const isToday = (d) => d === 27 && month === 1 && year === 2026;
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const selectedEvents = selectedDay ? eventsFor(selectedDay) : [];
  const monthEvents = ALL_EVENTS
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year && filters.has(e.category);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Project Delivery Calendar</h2>
            <p className="text-xs text-gray-500">All deliverables, milestones and deadlines across projects</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-bold text-gray-800 w-40 text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 mr-1">Show:</span>
        {Object.entries(CAT_STYLES).map(([cat, style]) => (
          <button
            key={cat}
            onClick={() => toggleFilter(cat)}
            className={
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all " +
              (filters.has(cat)
                ? style.dotClass + " border-transparent text-white"
                : "bg-white border-gray-200 text-gray-400")
            }
          >
            {style.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4">
          {Object.entries(PROJECT_META).map(([code, meta]) => (
            <div key={code} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
              <span className="text-xs text-gray-600 font-medium">{meta.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="min-h-16" />;
                  const events = eventsFor(day);
                  const isSelected = selectedDay === day;
                  const isTod = isToday(day);
                  return (
                    <div
                      key={di}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={
                        "min-h-16 rounded-lg p-1.5 cursor-pointer border transition-all " +
                        (isSelected
                          ? "bg-indigo-50 border-indigo-300 shadow-sm"
                          : events.length > 0
                            ? "hover:bg-gray-50 border-gray-100"
                            : "hover:bg-gray-50 border-transparent")
                      }
                    >
                      <div
                        className={
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 mx-auto " +
                          (isTod ? "bg-indigo-600 text-white" : isSelected ? "bg-indigo-200 text-indigo-800" : "text-gray-700")
                        }
                      >
                        {day}
                      </div>
                      {events.slice(0, 2).map((ev, ei) => {
                        const pm = PROJECT_META[ev.project];
                        return (
                          <div
                            key={ei}
                            className="flex items-center gap-1 px-1 py-0.5 rounded truncate mb-0.5"
                            style={{ background: pm.color + "18", color: pm.color }}
                            title={ev.label}
                          >
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pm.color }} />
                            <span className="truncate" style={{ fontSize: "10px" }}>{ev.label}</span>
                          </div>
                        );
                      })}
                      {events.length > 2 && (
                        <div className="text-center text-gray-400 font-semibold" style={{ fontSize: "10px" }}>
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="w-64 border-l border-gray-100 bg-gray-50 flex flex-col" style={{ minHeight: "400px" }}>
          {selectedDay && selectedEvents.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    {new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long" })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(year, month, selectedDay).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-1 hover:bg-gray-200 rounded text-gray-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedEvents.map((ev, i) => {
                  const pm = PROJECT_META[ev.project];
                  const cs = CAT_STYLES[ev.category];
                  return (
                    <div key={i} className="bg-white rounded-lg border p-3 shadow-sm" style={{ borderColor: pm.color + "40" }}>
                      <div className="flex items-start gap-2">
                        <div className="rounded-full flex-shrink-0 mt-1" style={{ background: pm.color, width: "3px", minHeight: "32px" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 mb-1">{ev.label}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: pm.color + "20", color: pm.color }}>
                            {pm.name}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">{cs.label}</span>
                          {ev.status && (
                            <div className="mt-1">
                              <span className={
                                "text-xs px-1.5 py-0.5 rounded font-semibold " +
                                (ev.status === "completed" ? "bg-green-100 text-green-700" :
                                 ev.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                                 ev.status === "overdue" ? "bg-red-100 text-red-700" :
                                 "bg-gray-100 text-gray-600")
                              }>
                                {ev.status === "overdue" ? "Overdue" :
                                 ev.status === "in-progress" ? "In Progress" :
                                 ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-900">This Month</p>
                <p className="text-xs text-gray-500">All scheduled deliverables</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {monthEvents.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400">No events this month</div>
                )}
                {monthEvents.map((ev, i) => {
                  const pm = PROJECT_META[ev.project];
                  const cs = CAT_STYLES[ev.category];
                  const evDay = parseInt(ev.date.split("-")[2]);
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDay(evDay)}
                      className="bg-white rounded-lg border border-gray-100 p-2.5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                          style={{ background: pm.color + "15" }}
                        >
                          <span className="text-xs font-black leading-none" style={{ color: pm.color }}>
                            {new Date(ev.date).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-sm font-black leading-none" style={{ color: pm.color }}>{evDay}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{ev.label}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pm.color }} />
                            <span className="text-xs text-gray-500 truncate">{pm.name}</span>
                            <span className="text-gray-300 mx-0.5">·</span>
                            <span className="text-xs text-gray-400">{cs.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  // ============== REAL DATA FETCHING ==============
  const { loading, error, data } = useQuery(GET_DASHBOARD_DATA);
  if (loading) return <div className="p-6 text-center text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;
  const upcomingMilestones = data.allMilestones || [];
  const upcomingDeadlines = data.allDeadlines || [];

  const totalProjects = projects.length;

  const onTrack = projects.filter(p => p.progress >= 50).length;
  const atRisk = projects.filter(p => p.progress < 50 && p.status !== 'Closed').length;

  // SHOW ALL PROJECTS — no filter, sorted by progress descending
  const topProjects = [...projects]
    .sort((a, b) => b.progress - a.progress); // highest first

  const sortedResources = [...companyResources].sort((a, b) => b.allocation - a.allocation);

  const getStatusStyle = (status) => {
    if (status === 'Planning') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (status === 'In Progress') return { bg: 'bg-purple-100', text: 'text-purple-700' };
    if (status === 'Closed') return { bg: 'bg-red-100', text: 'text-red-700' };
    return { bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Executive Dashboard</h1>
        <p className="text-gray-600">Company-wide overview for program managers</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{totalProjects}</span>
          </div>
          <p className="text-sm text-gray-600">Total Projects</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-700">{onTrack}</span>
          </div>
          <p className="text-sm text-gray-600">On Track</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-orange-700">{atRisk}</span>
          </div>
          <p className="text-sm text-gray-600">At Risk</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">{companyResources.length}</span>
          </div>
          <p className="text-sm text-gray-600">Team Members</p>
        </div>
      </div>

      {/* Top Projects – ALL PROJECTS + SCROLLBAR */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />Top Projects
        </h2>

        {/* SCROLLABLE CONTAINER */}
        <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50">
          {topProjects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No projects available</p>
          ) : (
            <div className="space-y-4">
              {topProjects.map((proj, idx) => {
                const style = getStatusStyle(proj.status);
                return (
                  <div 
                    key={proj.id}     
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex-shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{proj.name}</p>
                          <p className="text-xs text-gray-500">
                            {proj.code} • {proj.category} • Due {new Date(proj.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-indigo-700">{proj.progress}%</span>
                          <p className="text-xs text-gray-500">complete</p>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" 
                          style={{ width: `${proj.progress}%` }} 
                        />
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${style.bg} ${style.text}`}>
                      {proj.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Milestones + Deadlines Grid - REAL DATA */}
<div className="grid grid-cols-2 gap-6">

  {/* Upcoming Milestones */}
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
      <Flag className="w-5 h-5" /> Upcoming Milestones
    </h2>
    <div className="space-y-3">
      {upcomingMilestones.map((milestone) => {
        const dueDate = new Date(milestone.dueDate);
        return (
          <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                milestone.status === 'on_track' ? 'bg-green-500' : 
                milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{milestone.name}</p>
                <p className="text-xs text-gray-600">{milestone.project}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <span className={`text-xs font-semibold ${
                milestone.status === 'on_track' ? 'text-green-600' : 
                milestone.status === 'in_progress' ? 'text-blue-600' : 'text-red-600'
              }`}>
                {milestone.status === 'on_track' ? 'On Track' : 
                 milestone.status === 'in_progress' ? 'In Progress' : 'At Risk'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* Upcoming Deadlines */}
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
      <AlertTriangle className="w-5 h-5 text-orange-500" /> Upcoming Deadlines
    </h2>
    <div className="space-y-3">
      {upcomingDeadlines.map((dl) => {
        const dueDate = new Date(dl.dueDate);
        const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysLeft < 0;

        return (
          <div 
            key={dl.id} 
            className={`flex items-center justify-between p-3 rounded-lg ${
              isOverdue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-orange-400'}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{dl.task}</p>
                <p className="text-xs text-gray-600">{dl.project} • {dl.assignee}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <span className={`text-xs font-semibold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>

</div>

      <ProjectCalendar />

      {/* Top Resources */}
      
      {/* Company Budget Overview */}
      
    </div>
  );
}

export default Dashboard;