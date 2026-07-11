export type MenuItem = {
  title: string;
  url: string;
  icon?: React.ComponentType | null;
  children?: MenuItem[];
  // Rendered greyed out (e.g. an archived book list) while still navigable.
  muted?: boolean;
};
