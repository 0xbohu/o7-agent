'use client';

import { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/custom/chat-header';
import { PreviewMessage, ThinkingMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { Database } from '@/lib/supabase/types';
import { fetcher } from '@/lib/utils';

import { Block, UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';

type Agent = Database['public']['Tables']['agents']['Row'];
type AgentTool = {
  id: string;
  tools: Tool;
};
type Tool = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  summary: string | null;
  configuration: any;
};


type Vote = Database['public']['Tables']['votes']['Row'];
type ChatRow = {
  id: string;
  title: string | null;
  user_id: string;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
};

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedAgentId,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedAgentId: string;
}) {
  const { mutate } = useSWRConfig();

  let chatAgentId = selectedAgentId;

  // console.log(chatAgentId,id)

  const { data: chats, isLoading: isChatsLoading } = useSWR<Array<ChatRow>>(
    !chatAgentId && id ? `/api/chat?chatId=${id}` : null,
    async (url: string) => {
      const response = await fetcher(url);
      return response;
    }
  );

  if (!isChatsLoading && chats) {
    chatAgentId = chats[0]?.agent_id?.toString() || '';
    console.log('fetching chatAgentID', chatAgentId);
  }

  const { data: agents, isLoading: isAgentsLoading } = useSWR<Array<Agent>>(
    `/api/agents?agentId=${chatAgentId}`,
    async (url: string) => {
      const response = await fetcher(url);
      return response;
    }
  );

  const agentPrompt = !isAgentsLoading && agents 
  && agents[0] 
  && agents[0].prompts ? agents[0].prompts.toString() : '';

  const tools_configurations: any[] = [];

  const { data: agent_tools, isLoading: isToolsLoading } = useSWR<Array<AgentTool>>(
    // `/api/agent_tools?agentId=${chatAgentId}`,

    chatAgentId ?`/api/agent_tools?agentId=${chatAgentId}`: null,
    
    async (url: string) => {
      const response = await fetcher(url);
      return response;
    }
  );

  
  if (!isToolsLoading && agent_tools) {
    agent_tools.forEach(agent_tool => {
      if (agent_tool.tools.configuration) {
        tools_configurations.push(agent_tool.tools.configuration);
      }
    });
  }


  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    data: streamingData,
  } = useChat(
    chatAgentId && agentPrompt && tools_configurations.length > 0 ? {
      body: { id, modelId: selectedModelId, agentId: chatAgentId, agentPrompt: agentPrompt, agentTools: tools_configurations },
      initialMessages,
      onFinish: () => {
        mutate('/api/history');
      },
    } : undefined
  );

  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize();

  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );

  

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);


  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader selectedModelId={selectedModelId} />
        <div
          ref={messagesContainerRef}
          className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message, index) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              message={message}
              block={block}
              setBlock={setBlock}
              isLoading={isLoading && messages.length - 1 === index}
              vote={
                votes
                  ? votes.find((vote) => vote.message_id === message.id)
                  : undefined
              }
            />
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <ThinkingMessage />
            )}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={append}
          />
        </form>
      </div>

      <AnimatePresence>
        {block && block.isVisible && (
          <Block
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            block={block}
            setBlock={setBlock}
            messages={messages}
            setMessages={setMessages}
            votes={votes}
          />
        )}
      </AnimatePresence>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
    </>
  );
}
