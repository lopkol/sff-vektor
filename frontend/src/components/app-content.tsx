import { cn } from "@/lib/utils";

export function AppContent({
  children,
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      className={cn("flex flex-1 flex-col gap-4 p-4 pt-0", className)}
      {...props}
    >
      {children}
    </main>
  );
}
