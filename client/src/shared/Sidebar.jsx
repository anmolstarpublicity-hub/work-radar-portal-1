import React, { useState, memo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import { useLogoutMutation } from '../services/apiSlice';
import { HomeIcon, UsersIcon, UserGroupIcon, ClipboardDocumentListIcon, EyeIcon, ListBulletIcon, CheckBadgeIcon, ChartBarIcon, TrophyIcon, CalendarDaysIcon, CalendarIcon, MegaphoneIcon, DocumentTextIcon, BuildingLibraryIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon, ChevronDoubleLeftIcon, PencilSquareIcon, ArchiveBoxIcon, InformationCircleIcon, BriefcaseIcon, ChevronDownIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import volgaInfosysLogo from '../assets/volgainfosys.png';
import starPublicityLogo from '../assets/starpublicity.png';

const Sidebar = memo(({ activeComponent, setActiveComponent, sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) => {
  const user = useSelector(selectCurrentUser);
  const [isHovering, setIsHovering] = useState(false);
  const isExpanded = !isCollapsed || isHovering;
  const [logout] = useLogoutMutation();

  const adminMenuGroups = [
    {
      title: "Dashboard",
      items: [{ id: 'dashboard', icon: HomeIcon, label: 'Dashboard' }]
    },
    {
      title: "User Management",
      items: [
        { id: 'employees', icon: UsersIcon, label: 'Employee Management' },
        { id: 'assign', icon: UserGroupIcon, label: 'Employee Assignment' },
        { id: 'attendance-management', icon: ClipboardDocumentCheckIcon, label: 'Attendance Management' },
      ]
    },
    {
      title: "Task Management",
      items: [
        { id: 'view-tasks', icon: EyeIcon, label: 'View Employee Tasks' },
        { id: 'task-overview', icon: ListBulletIcon, label: 'Task Overview' },
        { id: 'assign-task', icon: ClipboardDocumentListIcon, label: 'Assign Task to Employee' },
        { id: 'assign-to-managers', icon: BriefcaseIcon, label: 'Assign to Managers' },
        { id: 'task-approvals', icon: CheckBadgeIcon, label: 'Pending Approvals' },
      ]
    },
    {
      title: "Reports & Analytics",
      items: [
        { id: 'team-reports', icon: DocumentTextIcon, label: 'Team Reports' },
        { id: 'hall-of-fame', icon: BuildingLibraryIcon, label: 'Hall of Fame' },
        { id: 'analytics', icon: ChartBarIcon, label: 'Performance Analytics' },
        { id: 'employee-of-the-month', icon: TrophyIcon, label: 'Employee of the Month' },
        { id: 'all-attendance', icon: CalendarDaysIcon, label: 'All Employee Attendance' },
      ]
    },
    {
      title: "System Management",
      items: [
        { id: 'holidays', icon: CalendarIcon, label: 'Holiday Management' },
        { id: 'announcements', icon: MegaphoneIcon, label: 'Manage Announcements' },
      ]
    }
  ];

  const managerMenuGroups = [
    {
      title: "Dashboard",
      items: [{ id: 'dashboard', icon: HomeIcon, label: 'Dashboard' }]
    },
    {
      title: "Task Management",
      items: [
        { id: 'assign-task', icon: PencilSquareIcon, label: 'Assign Task' },
        { id: 'view-team-tasks', icon: EyeIcon, label: 'View Team Tasks' },
        { id: 'task-approvals', icon: CheckBadgeIcon, label: 'Pending Approvals' },
      ]
    },
    {
      title: "Team & Reports",
      items: [
        { id: 'team-info', icon: InformationCircleIcon, label: 'Team Information' },
        { id: 'team-reports', icon: DocumentTextIcon, label: 'Team Reports' },
        { id: 'analytics', icon: ChartBarIcon, label: 'Team Performance Analytics' }
      ]
    }
  ];

  const employeeMenuGroups = [
    { title: "Dashboard", items: [{ id: 'dashboard', icon: HomeIcon, label: 'Dashboard' }] },
    { title: "My Work", items: [{ id: 'my-tasks', icon: ClipboardDocumentListIcon, label: 'My Tasks' }, { id: 'my-report', icon: DocumentTextIcon, label: 'Today\'s Progress Report' }, { id: 'my-history', icon: ArchiveBoxIcon, label: 'My Report History' }] },
    { title: "Analytics", items: [{ id: 'attendance', icon: CalendarDaysIcon, label: 'My Attendance' }, { id: 'analytics', icon: ChartBarIcon, label: 'My Performance Analytics' }] }
  ];

  let displayMenuGroups = adminMenuGroups;
  if (user?.role === 'Employee' || user?.dashboardAccess === 'Employee Dashboard') {
    displayMenuGroups = employeeMenuGroups;
  } else if (user?.role === 'Manager' || user?.dashboardAccess === 'Manager Dashboard') {
    displayMenuGroups = managerMenuGroups;
  }

  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev };
      displayMenuGroups.forEach(group => {
        if (group.items.some(item => item.id === activeComponent)) {
          next[group.title] = true;
        } else if (next[group.title] === undefined) {
          next[group.title] = false;
        }
      });
      return next;
    });
  }, [activeComponent, user]);

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className={`fixed md:sticky top-0 z-50 h-screen flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isExpanded ? 'w-[260px]' : 'w-20'}`}
      onMouseEnter={() => isCollapsed && setIsHovering(true)}
      onMouseLeave={() => isCollapsed && setIsHovering(false)}
    >
      <aside className="h-full w-full bg-white text-slate-700 flex flex-col border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors">
        <div className={`h-[72px] flex items-center border-b border-slate-200 dark:border-slate-800 flex-shrink-0 ${isExpanded ? 'px-6 gap-3' : 'justify-center'}`}>
          {user?.company === 'Volga Infosys' ? (
            <img src={volgaInfosysLogo} alt="Logo" className={`transition-all ${isExpanded ? 'h-8 w-auto' : 'h-10 w-10'}`} />
          ) : (
            <img src={starPublicityLogo} alt="Logo" className={`transition-all ${isExpanded ? 'h-8 w-auto' : 'h-10 w-10'}`} />
          )}
          {isExpanded && (
            <span className="text-lg font-extrabold text-slate-800 dark:text-white truncate tracking-tight" title={user?.company}>{user?.company || 'Work Radar'}</span>
          )}
        </div>
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          {displayMenuGroups.map((group, idx) => {
            const isOpen = openGroups[group.title];
            return (
            <div key={idx} className="mb-4 last:mb-0">
              {isExpanded && (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-3 py-1.5 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg focus:outline-none"
                >
                  <span>{group.title}</span>
                  <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
              <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveComponent(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left relative ${!isExpanded && 'justify-center'} ${
                      activeComponent === item.id
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${activeComponent === item.id ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                    {isExpanded && <span className="text-sm">{item.label}</span>}
                    {activeComponent === item.id && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-xl"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={() => setActiveComponent('profile')}
            className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors font-semibold"
          >
            <Cog8ToothIcon className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm truncate">Settings</span>}
          </button>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-semibold"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm truncate">Logout</span>}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronDoubleLeftIcon className={`h-6 w-6 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;