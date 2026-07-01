import { UserDetailPage } from "@/components/app/users/user-detail-page";

interface UserDetailRoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailRoutePage({
  params,
}: UserDetailRoutePageProps) {
  const { id } = await params;

  return <UserDetailPage userId={id} />;
}
