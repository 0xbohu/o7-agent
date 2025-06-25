"use client";

import { useState } from 'react';

import { ChatSelectionModal } from '@/components/custom/ChatSelectionModal';
import { StarkIcon, EVMIcon, O7Icon, MessageIcon } from '@/components/custom/icons';


export default function AgentIntro() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to O7 Platform</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          A platform of Web3 Agents. Start chatting with agents. 
        </p>
        <button
          className="mt-6 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition"
          onClick={() => setModalOpen(true)}
        >
          New Chat
        </button>
      </div>
      <p className="flex flex-row justify-center gap-4 items-center">
        <EVMIcon size={35} />
        <span>+</span>
        <StarkIcon size={45} />
        <span>+</span>
        <O7Icon size={32} />
        <span>+</span>
        <MessageIcon size={32} />
      </p>
      <p></p>
      <ChatSelectionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
} 