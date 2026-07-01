import { ProjectHubPage } from "@/components/app/projects/project-hub-page";

interface ProjectDetailRouteProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailRoutePage({
  params,
}: ProjectDetailRouteProps) {
  const { projectId } = await params;
  return <ProjectHubPage projectId={projectId} />;
}
