import {
  convertToCoreMessages,
  CoreMessage,
  LanguageModelV1,
  Message,
  StreamData,
  streamObject,
  streamText,
  experimental_createMCPClient as createMCPClient
} from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio";

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { getChatById } from '@/db/cached-queries';
import {
  saveChat,
  saveMessages,
  deleteChatById,
} from '@/db/mutations';
import { createClient } from '@/lib/supabase/server';
import { Database, MessageRole } from '@/lib/supabase/types';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 60;

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


type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

// Add helper function to format message content for database storage
function formatMessageContent(message: CoreMessage): string {
  // For user messages, store as plain text
  if (message.role === 'user') {
    return typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content);
  }

  // For tool messages, format as array of tool results
  if (message.role === 'tool') {
    return JSON.stringify(
      message.content.map((content) => ({
        type: content.type || 'tool-result',
        toolCallId: content.toolCallId,
        toolName: content.toolName,
        result: content.result,
      }))
    );
  }

  // For assistant messages, format as array of text and tool calls
  if (message.role === 'assistant') {
    if (typeof message.content === 'string') {
      return JSON.stringify([{ type: 'text', text: message.content }]);
    }

    return JSON.stringify(
      message.content.map((content) => {
        if (content.type === 'text') {
          return {
            type: 'text',
            text: content.text,
          };
        }else if(content.type === 'tool-call') {
          return {
            type: 'tool-call',
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          };
        }else{
          return null;
        }
        
      })
    );
  }

  return '';
}

export async function GET(request: Request) {
  
  try {

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');


    if (chatId) {

      const { data: chats } = await supabase
      .from('chats')
      .select()
      .eq('id', chatId);
      // .single();
      return Response.json(chats || [], { status: 200 });
     
    }else{
      console.error('Error fetching chats:');
      return new Response('An error occurred', { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching chats:', error);
    return new Response('An error occurred', { status: 500 });
  }
}

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
    agentId,
    agentPrompt,
    agentTools,
  }: { id: string; messages: Array<Message>; modelId: string ; agentId:string ;agentPrompt:string; agentTools:any[]} =
    await request.json();

  

  const user = await getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  try {
    const chat = await getChatById(id);

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });
      await saveChat({ id, userId: user.id, title ,agentId});
    } else if (chat.user_id !== user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await saveMessages({
      chatId: id,
      messages: [
        {
          id: generateUUID(),
          chat_id: id,
          role: userMessage.role as MessageRole,
          content: formatMessageContent(userMessage),
          created_at: new Date().toISOString(),
        },
      ],
    });

   
    let masterTools: Record<string, any> = {};

    if (agentTools) {
      const toolPromises = agentTools.map(async (tool) => {
        if (tool) {
          const mcpClient = await createMCPClient({
            transport: new StdioMCPTransport(tool)
          });

          let mcpTools = await mcpClient.tools();

          return mcpTools;
        }
        return {};
      });

      const toolResults = await Promise.all(toolPromises);
      masterTools = toolResults.reduce((acc, tools) => ({ ...acc, ...tools }), {});

      // Remove the tool with key if it exists
      if (masterTools.hasOwnProperty('read_contract')) {
        delete masterTools['read_contract'];
      }
       if (masterTools.hasOwnProperty('write_contract')) {
        delete masterTools['write_contract'];
      }
    }

    if(masterTools){
      const streamingData = new StreamData();

        const result = await streamText({
          model: customModel(model.apiIdentifier),
          system: agentPrompt,
          messages: coreMessages,
          maxSteps: 5,
          tools: masterTools,
          onFinish: async ({ response }) => {
            if (user && user.id) {
              try {

                // console.log(response)
                const responseMessagesWithoutIncompleteToolCalls =
                  sanitizeResponseMessages(response.messages);

                await saveMessages({
                  chatId: id,
                  messages: responseMessagesWithoutIncompleteToolCalls.map(
                    (message) => {
                      const messageId = generateUUID();

                      if (message.role === 'assistant') {
                        streamingData.appendMessageAnnotation({
                          messageIdFromServer: messageId,
                        });
                      }

                      return {
                        id: messageId,
                        chat_id: id,
                        role: message.role as MessageRole,
                        content: formatMessageContent(message),
                        created_at: new Date().toISOString(),
                      };
                    }
                  ),
                });
              } catch (error) {
                console.error('Failed to save chat:', error);
              }
            }

            streamingData.close();
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
          },
        });

        return result.toDataStreamResponse({
          data: streamingData,
        });
        

    }else{
      console.error('Error fetching content');
      return new Response('An error occurred', { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in chat route:', error);
    if (error instanceof Error && error.message === 'Chat ID already exists') {
      // If chat already exists, just continue with the message saving
      await saveMessages({
        chatId: id,
        messages: [
          {
            id: generateUUID(),
            chat_id: id,
            role: userMessage.role as MessageRole,
            content: formatMessageContent(userMessage),
            created_at: new Date().toISOString(),
          },
        ],
      });
    } else {
      console.error('Error fetching content:', error);
      return new Response('An error occurred', { status: 500 });
    }
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const user = await getUser();

  try {
    const chat = await getChatById(id);

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.user_id !== user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById(id, user.id);

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
