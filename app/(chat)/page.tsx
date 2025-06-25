import { cookies } from 'next/headers';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import AgentIntro from '@/components/custom/AgentIntro';
import { Chat } from '@/components/custom/chat';
import { generateUUID } from '@/lib/utils';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise < {
    agent: string
  } > ;
  searchParams: Promise < {
    [key: string]: string | string[] | undefined
  } > ;
}) {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

    const sp = await searchParams;
    const agentId = sp.agent?.toString() || '';

  if (!agentId) {
    return <AgentIntro />;
  }

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
      selectedAgentId={agentId}
    />
  );
}
