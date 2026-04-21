import { ReactNode } from "react";
import PublicFooter from "@/shared/ui/PublicFooter";
import PublicNav from "@/shared/ui/PublicNav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-pitch flex flex-col font-body">
      <PublicNav />
      <div className="flex-1 flex flex-col pb-16 sm:pb-0 sm:ml-56">
        {children}
        <PublicFooter />
      </div>
    </div>
  );
}
