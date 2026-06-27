import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { PROFILE_METADATA, PROFILE_REGISTRY } from "@/lib/profiles";

interface Props {
  params: Promise<{ key: string }>;
}

export async function generateStaticParams() {
  return PROFILE_METADATA.map((p) => ({ key: p.key }));
}

export default async function ProfilePage({ params }: Props) {
  const { key } = await params;
  const content = PROFILE_REGISTRY[key];
  if (!content) notFound();

  const meta = PROFILE_METADATA.find((p) => p.key === key);
  const title = meta ? `${meta.label} — ${meta.group}` : key;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-accent">
          DEV-TELEMETRY · PERFIL DE REFERÊNCIA
        </p>
        <div className="prose-modal">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        <p className="mt-8 font-mono text-[10px] text-muted/40">{title}</p>
      </div>
    </div>
  );
}
