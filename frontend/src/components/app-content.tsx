export function AppContent({
  children,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0" {...props}>
      {children}
    </main>
  );
}
