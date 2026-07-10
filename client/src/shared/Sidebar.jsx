import React, { useState, memo, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import { useLogoutMutation } from '../services/apiSlice';
import { HomeIcon, UsersIcon, UserGroupIcon, ClipboardDocumentListIcon, EyeIcon, ListBulletIcon, CheckBadgeIcon, ChartBarIcon, TrophyIcon, CalendarDaysIcon, CalendarIcon, MegaphoneIcon, DocumentTextIcon, BuildingLibraryIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon, ChevronDoubleLeftIcon, PencilSquareIcon, ArchiveBoxIcon, InformationCircleIcon, BriefcaseIcon, ChevronDownIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import volgaInfosysLogo from '../assets/volgainfosys.png';
import starPublicityLogo from '../assets/starpublicity.png';

// --- Menu Group Definitions (Moved outside for stability) ---
const adminMenuGroups = [
  {
    title: 'General',
    items: [
      { id: 'dashboard', icon: HomeIcon, label: 'Dashboard' },
      { id: 'profile', icon: UserGroupIcon, label: 'My Profile' },
    ],
  },
  {
    title: 'User Management',
    items: [
      { id: 'employees', icon: UsersIcon, label: 'Employee Management' },
      { id: 'assign', icon: UserGroupIcon, label: 'Employee Assignment' },
      { id: 'attendance-management', icon: ClipboardDocumentCheckIcon, label: 'Attendance Management' },
    ],
  },
  {
    title: 'Task Management',
    items: [
      { id: 'view-tasks', icon: EyeIcon, label: 'View Employee Tasks' },
      { id: 'task-overview', icon: ListBulletIcon, label: 'Task Overview' },
      { id: 'assign-task', icon: ClipboardDocumentListIcon, label: 'Assign Task to Employee' },
      { id: 'assign-to-managers', icon: BriefcaseIcon, label: 'Assign to Managers' },
      { id: 'task-approvals', icon: CheckBadgeIcon, label: 'Pending Approvals' },
    ],
  },
  {
    title: 'Reports & Analytics',
    items: [
      { id: 'team-reports', icon: DocumentTextIcon, label: 'Team Reports' },
      { id: 'hall-of-fame', icon: BuildingLibraryIcon, label: 'Hall of Fame' },
      { id: 'analytics', icon: ChartBarIcon, label: 'Performance Analytics' },
      { id: 'employee-of-the-month', icon: TrophyIcon, label: 'Employee of the Month' },
      { id: 'all-attendance', icon: CalendarDaysIcon, label: 'All Employee Attendance' },
    ],
  },
  {
    title: 'System Management',
    items: [
      { id: 'holidays', icon: CalendarIcon, label: 'Holiday Management' },
      { id: 'announcements', icon: MegaphoneIcon, label: 'Manage Announcements' },
    ],
  },
];

const managerMenuGroups = [
  { title: 'General', items: [{ id: 'dashboard', icon: HomeIcon, label: 'Dashboard' }, { id: 'profile', icon: UserGroupIcon, label: 'My Profile' }] },
  { title: 'Task Management', items: [{ id: 'assign-task', icon: PencilSquareIcon, label: 'Assign Task' }, { id: 'view-team-tasks', icon: EyeIcon, label: 'View Team Tasks' }, { id: 'task-approvals', icon: CheckBadgeIcon, label: 'Pending Approvals' }] },
  { title: 'Team & Reports', items: [{ id: 'team-info', icon: InformationCircleIcon, label: 'Team Information' }, { id: 'team-reports', icon: DocumentTextIcon, label: 'Team Reports' }, { id: 'analytics', icon: ChartBarIcon, label: 'Team Performance Analytics' }] },
];

const employeeMenuGroups = [
  { title: 'General', items: [{ id: 'dashboard', icon: HomeIcon, label: 'Dashboard' }, { id: 'profile', icon: UserGroupIcon, label: 'My Profile' }] },
  { title: 'My Work', items: [{ id: 'my-tasks', icon: ClipboardDocumentListIcon, label: 'My Tasks' }, { id: 'my-report', icon: DocumentTextIcon, label: "Today's Progress Report" }, { id: 'my-history', icon: ArchiveBoxIcon, label: 'My Report History' }] },
  { title: 'Analytics', items: [{ id: 'attendance', icon: CalendarDaysIcon, label: 'My Attendance' }, { id: 'analytics', icon: ChartBarIcon, label: 'My Performance Analytics' }] },
];

const Sidebar = memo(({ activeComponent, setActiveComponent, sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) => {
  const user = useSelector(selectCurrentUser);
  const [isHovering, setIsHovering] = useState(false);
  const isExpanded = !isCollapsed || isHovering;
  const [logout] = useLogoutMutation();

  // Memoize displayMenuGroups to ensure stable reference
  const displayMenuGroups = useMemo(() => {
    if (user?.role === 'Employee' || user?.dashboardAccess === 'Employee Dashboard') {
      return employeeMenuGroups;
    } else if (user?.role === 'Manager' || user?.dashboardAccess === 'Manager Dashboard') {
      return managerMenuGroups;
    }
    return adminMenuGroups; // Default to admin for Admin or Super Admin roles
  }, [user?.role, user?.dashboardAccess]);

  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev };
      let hasActiveComponentBeenOpened = false;
      displayMenuGroups.forEach(group => {
        if (group.items.some(item => item.id === activeComponent)) {
          next[group.title] = true; // Open the group if activeComponent is found
          hasActiveComponentBeenOpened = true;
        } else if (next[group.title] === undefined) { // Initialize if not already set
          next[group.title] = false; // Keep closed by default
        }
      });
      // If no group was explicitly opened by activeComponent, ensure at least the first group is open
      if (!hasActiveComponentBeenOpened && displayMenuGroups.length > 0 && next[displayMenuGroups[0].title] === false) {
        next[displayMenuGroups[0].title] = true;
      }
      return next;
    });
  }, [activeComponent, displayMenuGroups]);

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div // Apply dark mode background to the outer container
      className={`fixed md:sticky top-0 z-50 h-screen flex-shrink-0 transition-all duration-300 bg-slate-50 dark:bg-slate-900 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isExpanded ? 'w-[260px]' : 'w-20'}`}
      onMouseEnter={() => isCollapsed && setIsHovering(true)}
      onMouseLeave={() => isCollapsed && setIsHovering(false)}
    >
      <aside className="flex h-full w-full flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors">
        <div className={`flex h-[76px] flex-shrink-0 items-center ${isExpanded ? 'gap-3 px-6' : 'justify-center'} border-b border-slate-200 dark:border-slate-700`}>
          {user?.company === 'Volga Infosys' ? (
            <img src={volgaInfosysLogo} alt="Logo" className={`transition-all ${isExpanded ? 'h-8 w-auto' : 'h-10 w-10'}`} />
          ) : (
            <img src={starPublicityLogo} alt="Logo" className={`transition-all ${isExpanded ? 'h-8 w-auto' : 'h-10 w-10'}`} />
          )}
          {isExpanded && (
            <span className="truncate text-lg font-extrabold tracking-tight text-slate-800 dark:text-white" title={user?.company}>{user?.company || 'Work Radar'}</span>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar"> {/* Added custom-scrollbar class */}
          {displayMenuGroups.map((group, idx) => {
            const isOpen = openGroups[group.title];
            return (
              <div key={idx} className="mb-4 last:mb-0">
                {isExpanded && (
                  <button
                    onClick={() => toggleGroup(group.title)} // Toggle group on click
                    className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-800 dark:hover:text-white focus:outline-none"
                  >
                    <span>{group.title}</span>
                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
                <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isOpen ? 'mt-1 max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.items.map(item => {
                    const isActive = activeComponent === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveComponent(item.id); setSidebarOpen(false); }}
                        className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${!isExpanded && 'justify-center'} ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'}`}
                      >
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        {isExpanded && <span className="text-sm font-semibold text-slate-800 dark:text-white">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 border-t border-slate-200 dark:border-slate-700 p-4">
          <button
            onClick={() => setActiveComponent('profile')}
            className="flex w-full items-center justify-start gap-3 rounded-xl px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <Cog8ToothIcon className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm truncate">My Profile</span>} {/* Changed to My Profile for consistency */}
          </button>
          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-start gap-3 rounded-xl px-4 py-2.5 font-semibold text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-800 dark:hover:text-red-300"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm truncate">Logout</span>}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
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