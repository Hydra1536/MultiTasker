import { requireAuth } from "@/components/shared/auth-guard";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  await requireAuth();
  return <TasksClient />;
}
