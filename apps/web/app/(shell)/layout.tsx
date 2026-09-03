import type { ReactNode } from "react";
import { getCurrentUser } from "../lib/permissions";
import { ShellHeader } from "./_components/shell-header";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <ShellHeader me={me} />
      <div className="flex flex-1">{children}</div>
    </div>
  );
}
