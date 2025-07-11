'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {useState} from 'react'
import { useWindowSize } from 'usehooks-ts';


import { ModelSelector } from '@/components/custom/model-selector';
import { SidebarToggle } from '@/components/custom/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { BetterTooltip } from '@/components/ui/tooltip';

import { ChatSelectionModal } from './ChatSelectionModal';
import { PlusIcon, VercelIcon } from './icons';
import { useSidebar } from '../ui/sidebar';

export function ChatHeader({ selectedModelId }: { selectedModelId: string }) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <ChatSelectionModal open={modalOpen} onOpenChange={setModalOpen} />
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
        <SidebarToggle />
        {(!open || windowWidth < 768) && (
          <BetterTooltip content="New Chat">
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => setModalOpen(true)}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </BetterTooltip>
        )}
        <ModelSelector
          selectedModelId={selectedModelId}
          className="order-1 md:order-2"
        />
      </header>
    </>
  );
}
