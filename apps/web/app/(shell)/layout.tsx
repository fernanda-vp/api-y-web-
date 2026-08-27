import type { ReactNode } from "react";
import { getApiClient } from "../lib/api";
import { ShellHeader } from "./_components/shell-header";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const me = await getApiClient().auth.me();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <ShellHeader me={me} />
      <div className="flex flex-1">{children}</div>
    </div>
  );
}
