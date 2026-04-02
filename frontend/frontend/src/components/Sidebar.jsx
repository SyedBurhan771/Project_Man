import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign,
  Users,
  Target,
  Kanban,
  Zap,
  Flag,
  LogOut,
  Settings,
} from "lucide-react";

import { projects } from "../pages/Projects";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isProjectDetail = location.pathname.startsWith("/projects/");

  // Dynamic active section (this will update when you scroll)
  const [activeSection, setActiveSection] = useState(
    window.location.hash.replace("#", "") || "overview"
  );

  let currentProject = null;
  if (isProjectDetail) {
    const idPart = location.pathname.split("/projects/")[1]?.split("/")[0]?.split("#")[0];
    currentProject = projects.find((p) => p.id === idPart);
  }

  // Listen to hash change (from scroll in ProjectDetail.jsx)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") || "overview";
      setActiveSection(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navButton = (key, Icon, label) => (
    <button
      onClick={() => {
        window.location.hash = key;
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        activeSection === key ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
      } ${isCollapsed ? "justify-center" : ""}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && <span className="flex-1 text-left">{label}</span>}
      {!isCollapsed && activeSection === key && (
        <div className="w-2 h-2 bg-blue-600 rounded-full" />
      )}
    </button>
  );

  if (isProjectDetail) {
    return (
      <div className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/projects", { replace: true })}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {!isCollapsed && <span>Back to Projects</span>}
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {currentProject && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex-shrink-0" />
              {!isCollapsed && (
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{currentProject.name}</h3>
                  <p className="text-xs text-gray-600">
                    {currentProject.id} • {currentProject.category || currentProject.department || "—"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navButton("overview", LayoutDashboard, "Overview")}
          {navButton("lifecycle", TrendingUp, "Lifecycle")}
          {navButton("general", FileText, "General Info")}
          {navButton("financial", DollarSign, "Financial")}
          {navButton("resources", Users, "Resources")}
          {navButton("tasks", Target, "Tasks")}
          {navButton("board", Kanban, "Board")}
          {navButton("sprints", Zap, "Sprints")}
          {navButton("milestones", Flag, "Milestones")}
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200 space-y-1">
          <button
            className={`flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg w-full transition-all ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span>Settings</span>}
          </button>

          <button className={`flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg w-full transition-all ${isCollapsed ? "justify-center" : ""}`}>
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>
      </div>
    );
  }

  // Normal sidebar (unchanged)
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Avataar</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
          <Folder className="w-4 h-4" />
          <span>Projects</span>
        </NavLink>
        <NavLink to="/resources" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
          <Users className="w-4 h-4" />
          <span>Resources</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;