import {
  ClipboardList,
  LayoutDashboard,
  Layers,
  Settings,
  UserMinus,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type SidebarNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export const sidebarNavItems: SidebarNavItem[] = [
  { to: '/employees', label: 'Employees', icon: Users, end: true },
  { to: '/employees/left', label: 'Left Employees', icon: UserMinus },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/drafts', label: 'Drafts', icon: ClipboardList },
  { to: '/templates', label: 'Templates', icon: Layers },
  { to: '/settings', label: 'Settings', icon: Settings },
];
