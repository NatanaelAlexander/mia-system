import { ProjectAssetsPage } from "@/components/app/projects/project-assets-page";

interface ProjectAssetsRouteProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectAssetsRoutePage({
  params,
}: ProjectAssetsRouteProps) {
  const { projectId } = await params;
  return <ProjectAssetsPage projectId={projectId} />;
}
