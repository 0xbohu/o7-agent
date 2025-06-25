import { getAgents } from '@/db/cached-queries';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  
  try {

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');


    if (agentId) {

      const { data: agents } = await supabase
      .from('agents')
      .select()
      .eq('id', agentId);
      return Response.json(agents || [], { status: 200 });
     
    }else{
      const agents = await getAgents();
      return Response.json(agents);
    }
    
    
  } catch (error) {
    console.error('Error fetching agents:', error);
    return new Response('An error occurred', { status: 500 });
  }
}