import { NavItem } from "@/lib/types";
import LoginButton from "@/components/LoginButton";

export function buildTitleConfig(displayName: string, tagline: string): NavItem {
  return {
    id: "__title__",
    route: "/",
    label: (
      <>
        {displayName}
        <br />
        <span className="text-zinc-500">{tagline}</span>
      </>
    ),
    hidden: false,
    isNotLink: false,
    sectionName: "__title__",
    order: -1,
  };
}

export const aboutConfig: NavItem = {
  id: "__about__",
  route: "/about",
  label: "About",
  hidden: false,
  isNotLink: false,
  sectionName: "__footer__",
  order: 9997,
};

export const defaultConfig: NavItem[] = [
  {
    id: "__copyright__",
    route: "",
    label: (
      <span className="block text-[10px] text-zinc-600 uppercase tracking-wider leading-relaxed">
        &copy; Copyright
        <br />
        All Rights Reserved
      </span>
    ),
    hidden: false,
    isNotLink: true,
    sectionName: "__footer__",
    order: 9998,
  },
  {
    id: "__login__",
    route: "",
    label: <LoginButton />,
    hidden: false,
    isNotLink: true,
    sectionName: "__footer__",
    order: 9999,
  },
];

export function buildRouteConfig(
  firestoreItems: NavItem[],
  displayName: string = "Portfolio",
  tagline: string = ""
): NavItem[] {
  return [buildTitleConfig(displayName, tagline), ...firestoreItems, aboutConfig, ...defaultConfig];
}
