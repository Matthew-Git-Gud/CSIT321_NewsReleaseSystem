import { ROLES, type Role } from "../constants/roles";

export type MenuItem = {
  label: string;
  path: string;
};

export const menuByRole: Record<Role, MenuItem[]> = {
  [ROLES.GUEST]: [
    {
      label: "Discover",
      path: "/discover",
    },
    {
      label: "Latest",
      path: "/#latest",
    },
    {
      label: "Categories",
      path: "/#categories",
    },
    
  ],

  [ROLES.REGISTERED]: [
    {
      label: "Discover",
      path: "/discover",
    },
    {
      label: "Latest",
      path: "/#latest",
    },
    {
      label: "Categories",
      path: "/#categories",
    },
    {
      label: "My Feed",
      path: "/feed",
    },
    {
      label: "+ Write",
      path: "/publish",
    },
    {
      label: "My Articles",
      path: "/my-articles",
    },
    {
      label: "Friends",
      path: "/friends",
    },
    {
      label: "Shared with me",
      path: "/shared-articles",
    },
    {
      label: "Saved",
      path: "/saved",
    },
    {
      label: "Preferences",
      path: "/preferences",
    },
    
  ],

  [ROLES.ADMIN]: [
    {
      label: "Dashboard",
      path: "/admin",
    },
    {
      label: "User Management",
      path: "/admin/users",
    },
    {
      label: "Credibility Moderation",
      path: "/admin/credibility",
    },
    {
      label: "Preferences",
      path: "/preferences",
    },
  ],
};
