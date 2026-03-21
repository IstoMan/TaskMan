export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 dark:bg-zinc-950 px">
      <div className="w-full max-w-sm mx-auto">
        {children}
      </div>
    </main>
  );
}