import { ReactNode } from "react";
import PublicFooter from "@/shared/ui/PublicFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-pitch flex flex-col font-body">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
