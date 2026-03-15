import { notFound } from "next/navigation";
import { getRepository } from "@/db/queries/projects";
import { RepositoryHeader } from "@/components/repository-header";

type Props = {
  params: Promise<{ repositoryId: string }>;
};

/** リポジトリダッシュボードページ */
export default async function DashboardPage({ params }: Props) {
  const { repositoryId } = await params;
  const repository = await getRepository(repositoryId);

  if (!repository) {
    notFound();
  }

  return (
    <>
      <RepositoryHeader repositoryName={repository.name} currentPage="ダッシュボード" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <p className="text-muted-foreground">リポジトリの概要がここに表示されます。</p>
      </div>
    </>
  );
}
