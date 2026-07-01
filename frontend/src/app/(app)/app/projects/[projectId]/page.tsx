import { ProjectHubPage } from "@/components/app/projects/project-hub-page";

interface ProjectHubRoutePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectHubRoutePage({
  params,
}: ProjectHubRoutePageProps) {
  const { projectId } = await params;
  return <ProjectHubPage projectId={projectId} />;
}
