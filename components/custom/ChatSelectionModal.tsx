import { useRouter } from 'next/navigation';
import * as React from 'react';
import useSWR, { useSWRConfig } from 'swr';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';
import { Database } from '@/lib/supabase/types';
import { fetcher } from '@/lib/utils';

import * as Icons from './icons';

interface ChatSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

function getAgentIcon(iconName: string | null) {
  if (!iconName) return <Icons.BotIcon />;
  const IconComponent = (Icons as any)[iconName];
  return IconComponent ? <IconComponent /> : <Icons.BotIcon />;
}


type Agent = Database['public']['Tables']['agents']['Row'];

export function ChatSelectionModal({
  open,
  onOpenChange,
  title = 'Select an Agent',
}: ChatSelectionModalProps) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const { data: agents } = useSWR<Array<Agent>>(
    `/api/agents`,
    fetcher
  );

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    mutate('/api/agents')
      .then((data: any) => {
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Failed to load agents');
        setLoading(false);
      });
  }, [open, mutate]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl p-8">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading agents...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="flex flex-col gap-4">
              {agents && agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-row items-center gap-6 border rounded-xl p-5 bg-card shadow-sm hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => {
                    router.push(`/?agent=${agent.id}`);
                    router.refresh();
                    onOpenChange(false);
                  }}
                >
                  <div
                    className="flex-0 text-2xl text-foreground dark:text-foreground"
                    dangerouslySetInnerHTML={{ __html: agent.icon || '' }}
                  />
                  <div className="flex flex-col">
                    <div className="font-semibold text-lg">{agent.name}</div>
                    <div className="text-muted-foreground text-sm mt-1">
                      {agent.description || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <AlertDialogCancel>Close</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
} 