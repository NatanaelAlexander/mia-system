import { ProjectTicketsPage } from "@/components/app/projects/project-tickets-page";

interface ProjectTicketsRoutePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectTicketsRoutePage({
  params,
}: ProjectTicketsRoutePageProps) {
  const { projectId } = await params;
  return <ProjectTicketsPage projectId={projectId} />;
}
