import OwnerShrimmer from "@/components/Dashboards/Owner/_components/OwnerShrimmer";
import dynamic from "next/dynamic";

const TasksConsole = dynamic(
  () => import("@/components/Dashboards/Owner/tasks/TasksConsole"),
  {
    ssr: false,
    loading: () => <OwnerShrimmer />,
  }
);

export default function FieldTasksPage() {
  return <TasksConsole />;
}
