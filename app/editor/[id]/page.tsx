import { EditorContent } from "@/components/editor-content"

export default function EditorPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { accessKey?: string }
}) {
  return <EditorContent documentId={params.id} accessKey={searchParams.accessKey} />
}
