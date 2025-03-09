export type MenuItem = {
  title: string;
  url: string;
  icon?: React.ComponentType | null;
  children?: MenuItem[];
};
