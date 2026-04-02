import React, { useState, useEffect } from 'react';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Sparkles,
  Plus,
  Filter,
  Award,
  Briefcase,
  Clock,
  FolderOpen,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Circle
} from 'lucide-react';

// GraphQL query – fetches all needed fields from your backend
const GET_RESOURCES = gql`
  query GetAllResources {
    allResources {
      id
      name
      role
      department
      avatar
      email
      phone
      location
      availability
      capacity
      hoursPerWeek
      hoursAllocated
      hoursAvailable
      tasksCompleted
      tasksInProgress
      avgCompletionTime
      rating
      skills
      qualifications
      currentProjects
      weeklyAvailability
    }
  }
`;

export default function ResourcesScreen() {
  const { loading, error, data } = useQuery(GET_RESOURCES);

  const [selectedResource, setSelectedResource] = useState(null);
  const [showAIAllocator, setShowAIAllocator] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');

  // Parse DB data safely
  const resources = data?.allResources?.map(res => ({
    ...res,
    skills: JSON.parse(res.skills || '[]'),
    qualifications: JSON.parse(res.qualifications || '[]'),
    currentProjects: JSON.parse(res.currentProjects || '[]'),
    weeklyAvailability: JSON.parse(res.weeklyAvailability || '[]'),
    availability: res.availability?.toLowerCase() || 'available',
  })) || [];

  const filteredResources = resources.filter(r => {
    const deptMatch = filterDepartment === 'all' || r.department === filterDepartment;
    const availMatch = filterAvailability === 'all' || r.availability === filterAvailability;
    return deptMatch && availMatch;
  });

  useEffect(() => {
    if (!filteredResources.find(r => r.id === selectedResource)) {
      setSelectedResource(null);
    }
  }, [filterDepartment, filterAvailability, filteredResources]);

  const selectedResourceData = resources.find(r => r.id === selectedResource);

  const getAvailabilityBadge = (status) => {
    const badges = {
      available: { color: 'bg-green-500', text: 'Available', icon: CheckCircle2 },
      partial:   { color: 'bg-yellow-500', text: 'Partially Available', icon: AlertCircle },
      busy:      { color: 'bg-red-500', text: 'Fully Allocated', icon: Circle }
    };
    return badges[status] || { color: 'bg-gray-500', text: 'Unknown', icon: Circle };
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      Expert: 'bg-green-100 text-green-700 border-green-300',
      Advanced: 'bg-blue-100 text-blue-700 border-blue-300',
      Intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Beginner: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[level] || colors['Beginner'];
  };

  // Optional: Uncomment when you want AI matching back
  // const calculateSkillMatch = (resource, projectSkills) => { ... };

  if (loading) return <div className="p-6 text-center text-gray-600">Loading resources from database...</div>;
  if (error) return <div className="p-6 text-red-600">Error loading data: {error.message}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-600 mt-1">Manage team members, skills & availability</p>
        </div>

        <button
          onClick={() => setShowAIAllocator(prev => !prev)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          AI Allocate Resource
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="w-4 h-4" /> Filters:
        </div>

        <select
          value={filterDepartment}
          onChange={e => setFilterDepartment(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm"
        >
          <option value="all">All Departments</option>
          <option value="Development">Development</option>
          <option value="Marketing">Marketing</option>
          <option value="Finance">Finance</option>
          <option value="IT">IT Infrastructure</option>
          <option value="Ai">AI</option>
        </select>

        <select
          value={filterAvailability}
          onChange={e => setFilterAvailability(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm"
        >
          <option value="all">All Availability</option>
          <option value="available">Available</option>
          <option value="partial">Partially Available</option>
          <option value="busy">Fully Allocated</option>
        </select>

        <div className="ml-auto text-sm text-gray-500">
          {filteredResources.length} resources
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Resource List */}
        <div className="col-span-5 space-y-3">
          {filteredResources.map(resource => {
            const badge = getAvailabilityBadge(resource.availability);
            const Icon = badge.icon;

            return (
              <div
                key={resource.id}
                onClick={() => setSelectedResource(resource.id)}
                className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
                  selectedResource === resource.id ? 'border-blue-600 shadow-lg' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                    {resource.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{resource.name}</h3>
                    <p className="text-sm text-gray-600">{resource.role}</p>
                    <span className={`${badge.color} text-white text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 mt-2`}>
                      <Icon className="w-3 h-3" />
                      {badge.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Full Detail Panel – restored from your old mock version */}
        <div className="col-span-7">
          {selectedResourceData && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {selectedResourceData.avatar}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedResourceData.name}</h2>
                      <p className="text-sm text-gray-600 mb-2">{selectedResourceData.role}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {selectedResourceData.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {selectedResourceData.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {selectedResourceData.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const availBadge = getAvailabilityBadge(selectedResourceData.availability);
                    const AvailIcon = availBadge.icon;
                    return (
                      <span className={`${availBadge.color} text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2`}>
                        <AvailIcon className="w-4 h-4" />
                        {availBadge.text}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Skills & Expertise */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Skills & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedResourceData.skills.map((skill, idx) => (
                      <div key={idx} className={`px-3 py-1.5 rounded-lg border ${getSkillLevelColor(skill.level)}`}>
                        <span className="text-sm font-semibold">{skill.name}</span>
                        <span className="text-xs ml-2">• {skill.level}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Qualifications */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Qualifications
                  </h3>
                  <div className="space-y-3">
                    {selectedResourceData.qualifications.map((qual, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{qual.degree}</p>
                          <p className="text-xs text-gray-600">{qual.institution} • {qual.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workload & Availability */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Workload & Availability
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Total Hours/Week</p>
                      <p className="text-2xl font-bold text-blue-700">{selectedResourceData.hoursPerWeek}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Hours Allocated</p>
                      <p className="text-2xl font-bold text-orange-700">{selectedResourceData.hoursAllocated}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Hours Available</p>
                      <p className="text-2xl font-bold text-green-700">{selectedResourceData.hoursAvailable}</p>
                    </div>
                  </div>

                  {/* Weekly Calendar */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-3">This Week Availability</p>
                    <div className="grid grid-cols-7 gap-2">
                      {selectedResourceData.weeklyAvailability.map((day, idx) => (
                        <div key={idx} className="text-center">
                          <div className={`rounded-lg p-3 ${
                            day.available ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
                          }`}>
                            <p className="text-xs font-bold text-gray-900">{day.day}</p>
                            <p className="text-xs text-gray-600 mt-1">{day.hours}h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Uncomment when ready */}
                {/* Current Projects */}
                {/* <div>...</div> */}

                {/* Performance Metrics */}
                {/* <div>...</div> */}

                {/* AI Skill Matching */}
                {/* <div>...</div> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}