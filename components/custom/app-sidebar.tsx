'use client';

import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import {useState} from 'react'

import { PlusIcon,O7Icon } from '@/components/custom/icons';
import { SidebarHistory } from '@/components/custom/sidebar-history';
import { SidebarUserNav } from '@/components/custom/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { BetterTooltip } from '@/components/ui/tooltip';

import { ChatSelectionModal } from './ChatSelectionModal';

export function AppSidebar({ user }: { user: User | null }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <ChatSelectionModal open={modalOpen} onOpenChange={setModalOpen} />
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row justify-between items-center">
              <div
                onClick={() => {
                  setOpenMobile(false);
                  router.push('/');
                  router.refresh();
                }}
                className="flex flex-row gap-3 items-center"
              >
                {/* <img src="/images/o7.png" alt="o7" className="w-8 h-8" /> */}
                <O7Icon />
                <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                  O7 Agent
                </span>
              </div>
              <BetterTooltip content="New Chat" align="start">
                <Button
                  variant="ghost"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    setModalOpen(true);
                  }}
                >
                  <PlusIcon />
                </Button>
              </BetterTooltip>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarHistory user={user ?? undefined} />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-0">
          {user && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarUserNav user={user} />
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
