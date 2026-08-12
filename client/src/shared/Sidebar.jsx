import React, { useState, memo, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import { useLogoutMutation } from '../services/apiSlice';
import {
  HomeIcon, UsersIcon, UserGroupIcon, ClipboardDocumentListIcon, EyeIcon,
  ListBulletIcon, CheckBadgeIcon, ChartBarIcon, TrophyIcon, CalendarDaysIcon,
  CalendarIcon, MegaphoneIcon, DocumentTextIcon, BuildingLibraryIcon,
  Cog8ToothIcon, ArrowRightOnRectangleIcon, PencilSquareIcon, ArchiveBoxIcon,
  InformationCircleIcon, BriefcaseIcon, ChevronDownIcon, ChevronRightIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import volgaInfosysLogo from '../assets/volgainfosys.png';
import starPublicityLogo from '../assets/starpublicity.png';

const adminMenuGroups = [
  {
    title: 'General',
    items: [
      { id: 'dashboard', icon: HomeIcon, label: 'Dashboard' },
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
  { title: 'General', items: [{ id: 'dashboard', icon: HomeIcon, label: 'Dashboard' }] },
  { title: 'Task Management', items: [{ id: 'assign-task', icon: PencilSquareIcon, label: 'Assign Task' }, { id: 'view-team-tasks', icon: EyeIcon, label: 'View Team Tasks' }, { id: 'task-approvals', icon: CheckBadgeIcon, label: 'Pending Approvals' }] },
  { title: 'Team & Reports', items: [{ id: 'team-info', icon: InformationCircleIcon, label: 'Team Information' }, { id: 'team-reports', icon: DocumentTextIcon, label: 'Team Reports' }, { id: 'analytics', icon: ChartBarIcon, label: 'Team Performance Analytics' }] },
];

const employeeMenuGroups = [
  { title: 'General', items: [{ id: 'dashboard', icon: HomeIcon, label: 'Dashboard' }] },
  { title: 'My Work', items: [{ id: 'my-tasks', icon: ClipboardDocumentListIcon, label: 'My Tasks' }, { id: 'my-report', icon: DocumentTextIcon, label: "Today's Progress Report" }, { id: 'my-history', icon: ArchiveBoxIcon, label: 'My Report History' }] },
  { title: 'Analytics', items: [{ id: 'attendance', icon: CalendarDaysIcon, label: 'My Attendance' }, { id: 'analytics', icon: ChartBarIcon, label: 'My Performance Analytics' }] },
];

// Floating popover for collapsed group items
function CollapsedGroupPopover({ group, activeComponent, setActiveComponent, setSidebarOpen, anchorRef }) {
  const [pos, setPos] = useState({ top: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.top });
    }
  }, [anchorRef]);

  return (
    <div
      className="fixed z-[200] ml-1 w-44 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 px-1"
      style={{ left: 72, top: pos.top }}
    >
      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.title}</p>
      {group.items.map(item => {
        const isActive = activeComponent === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { setActiveComponent(item.id); setSidebarOpen(false); }}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            {isActive && <ChevronRightIcon className="ml-auto h-3.5 w-3.5" />}
          </button>
        );
      })}
    </div>
  );
}

function CollapsedGroupItem({ group, activeComponent, setActiveComponent, setSidebarOpen }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const hasActive = group.items.some(i => i.id === activeComponent);
  const Icon = group.items[0]?.icon ?? HomeIcon;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors mx-auto ${hasActive ? 'text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
        style={hasActive ? { background: 'linear-gradient(135deg, #48306A, #8E5FD0)', color: '#FFFFFF' } : undefined}
      >
        <Icon className="h-5 w-5" />
      </button>
      {open && (
        <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          <CollapsedGroupPopover
            group={group}
            activeComponent={activeComponent}
            setActiveComponent={setActiveComponent}
            setSidebarOpen={setSidebarOpen}
            anchorRef={btnRef}
          />
        </div>
      )}
    </div>
  );
}

const Sidebar = memo(({ activeComponent, setActiveComponent, sidebarOpen, setSidebarOpen, isCollapsed = false }) => {
  const user = useSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();

  const displayMenuGroups = useMemo(() => {
    if (user?.role === 'Employee' || user?.dashboardAccess === 'Employee Dashboard') return employeeMenuGroups;
    if (user?.role === 'Manager' || user?.dashboardAccess === 'Manager Dashboard') return managerMenuGroups;
    return adminMenuGroups;
  }, [user?.role, user?.dashboardAccess]);

  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    setOpenGroups(displayMenuGroups.reduce((acc, group) => {
      acc[group.title] = group.items.some(item => item.id === activeComponent);
      return acc;
    }, {}));
  }, [displayMenuGroups, activeComponent]);

  const toggleGroup = title => setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));

  return (
    <aside
      className={`flex flex-col flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-[75px]' : 'w-[255px]'}`}
      style={{ position: 'sticky', top: 0, height: 'calc(100vh - 24px)', alignSelf: 'flex-start', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 24px 0 rgba(72,48,106,0.10)', overflow: 'hidden' }}
    >
        {/* Header */}
        <div className={`flex h-[68px] flex-shrink-0 items-center ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}>
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl overflow-hidden">
            {user?.company === 'Volga Infosys'
              ? <img src={volgaInfosysLogo} alt="Logo" className="h-10 w-10 object-contain" />
              : <img src={starPublicityLogo} alt="Logo" className="h-10 w-10 object-contain" />
            }
          </div>
          <span className="flex-1 truncate text-xl font-semibold" style={{ color: '#48306A' }}>{user?.company || 'Work Radar'}</span>
        </div>
        <div className="mx-4 my-2 h-px rounded-full bg-gradient-to-r from-[#8E5FD0]/20 via-slate-200 to-[#48306A]/20" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4" style={{ scrollbarWidth: 'none' }}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-1 px-2">
              {displayMenuGroups.map((group, idx) => (
                <CollapsedGroupItem
                  key={idx}
                  group={group}
                  activeComponent={activeComponent}
                  setActiveComponent={setActiveComponent}
                  setSidebarOpen={setSidebarOpen}
                />
              ))}
            </div>
          ) : (
            <div className="px-3 space-y-3">
              {displayMenuGroups.map((group, idx) => {
                const isOpen = openGroups[group.title];
                return (
                  <div key={idx}>
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors"
                      style={{ color: '#8E5FD0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F3EEFF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="text-sm font-extrabold uppercase tracking-widest">{group.title}</span>
                      <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-0.5 pb-1">
                        {group.items.map(item => {
                          const isActive = activeComponent === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => { setActiveComponent(item.id); setSidebarOpen(false); }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150"
                              style={isActive
                                ? {
                                    background: 'linear-gradient(135deg, #48306A, #8E5FD0)',
                                    color: '#FFFFFF',
                                  }
                                : { color: '#4B4A6A' }
                              }
                              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F2EFFF'; }}
                              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                              <item.icon className="h-[18px] w-[18px] flex-shrink-0" style={isActive ? { color: '#FFFFFF' } : { color: '#8E5FD0' }} />
                              <span className="text-sm font-bold truncate">{item.label}</span>
                              {isActive && <ChevronRightIcon className="ml-auto h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.85)' }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </nav>
        <div className="mx-4 my-2 h-px rounded-full bg-gradient-to-r from-[#8E5FD0]/20 via-slate-200 to-[#48306A]/20" />
        {/* Footer */}
        <div className={`p-4 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {isCollapsed ? (
            <>
              <button
                onClick={() => setActiveComponent('profile')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
              >
                <Cog8ToothIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => logout()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="rounded-3xl p-4" style={{ background: 'linear-gradient(135deg, #48306A, #8E5FD0)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <img
                    src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=8E5FD0&color=fff`}
                    alt={user?.name || 'User'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user?.name || 'Your Name'}</p>
                  <p className="truncate text-xs text-white/80">{user?.role || 'Your Role'}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                <button
                  onClick={() => setActiveComponent('profile')}
                  className="flex items-center justify-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#48306A] hover:bg-white transition-colors"
                >
                  <Cog8ToothIcon className="h-4 w-4 text-[#48306A]" />
                  My Profile
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center justify-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-[#B91935] hover:bg-red-200 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 text-[#B91935]" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
