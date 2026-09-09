import { ROLES, type Role } from "../constants/roles";

export type MenuItem = {
  label: string;
  path: string;
};

export const menuByRole: Record<Role, MenuItem[]> = {
  [ROLES.GUEST]: [
    {
      label: "Latest",
      path: "/#latest",
    },
    {
      label: "Categories",
      path: "/#categories",
    },
    {
      label: "About",
      path: "/#about",
    },
  ],

  [ROLES.REGISTERED]: [
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
      label: "Saved",
      path: "/saved",
    },
    {
      label: "Preferences",
      path: "/preferences",
    },
    {
      label: "About",
      path: "/#about",
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
  ],
};