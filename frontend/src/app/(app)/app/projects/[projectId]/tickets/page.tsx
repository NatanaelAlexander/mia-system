import { ProjectTicketsPage } from "@/components/app/projects/project-tickets-page";

interface ProjectTicketsRouteProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectTicketsRoutePage({
  params,
}: ProjectTicketsRouteProps) {
  const { projectId } = await params;
  return <ProjectTicketsPage projectId={projectId} />;
}
