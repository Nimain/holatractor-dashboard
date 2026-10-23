import "../../globals.css";
import { ReactNode } from "react";
import ReduxWrapper from "@/components/Dashboards/agent/wrapper/ReduxWrapper";

export default function AgentLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <ReduxWrapper>
            <div className="bg-[#e5e5e5] min-h-screen">{children}</div>
        </ReduxWrapper>
    );
}
