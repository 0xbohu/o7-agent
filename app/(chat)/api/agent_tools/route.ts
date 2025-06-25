import { getAgents } from '@/db/cached-queries';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  
  try {

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    if (agentId) {
      const { data: tools } = await supabase
      .from('agent_tools')
      .select(`
        id
        ,tools(name,description,icon,summary,configuration)
        `)
      // .eq('is_active', true)
      .eq('agent_id', agentId);
      // console.log('agentId',agentId)
      // console.log('supabase tools',tools)
      return Response.json(tools || [], { status: 200 });
     
    }else{
        console.error('Error fetching tools:');
        return new Response('An error occurred', { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching tools:', error);
    return new Response('An error occurred', { status: 500 });
  }
}