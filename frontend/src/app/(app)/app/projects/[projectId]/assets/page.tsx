import { ProjectAssetsPage } from "@/components/app/projects/project-assets-page";

interface ProjectAssetsRoutePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectAssetsRoutePage({
  params,
}: ProjectAssetsRoutePageProps) {
  const { projectId } = await params;
  return <ProjectAssetsPage projectId={projectId} />;
}
