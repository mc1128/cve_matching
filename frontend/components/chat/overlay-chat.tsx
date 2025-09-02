"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useChatState } from "./use-chat-state";
import PlusIcon from "../icons/plus";
import ChatPreview from "./chat-preview";
import ChatConversation from "./chat-conversation";
import { ChatHeader } from "./chat-header";
import { AnimatePresence, motion } from "motion/react";

export default function OverlayChat() {
  const {
    chatState,
    conversations,
    newMessage,
    setNewMessage,
    activeConversation,
    handleSendMessage,
    openConversation,
    goBack,
    toggleExpanded,
  } = useChatState();

  const isExpanded = chatState.state !== "collapsed";

  return (
    <motion.div
      className="h-full flex flex-col bg-background border border-border rounded-xl overflow-hidden"
      initial={{ height: "60px" }}
      animate={{ 
        height: isExpanded ? "500px" : "60px" 
      }}
      transition={{ duration: 0.3, ease: "circInOut" }}
    >
      {/* Header */}
      <ChatHeader
        variant="desktop"
        onClick={toggleExpanded}
        showBackButton={chatState.state === "conversation"}
        onBackClick={goBack}
      />

      {/* Content */}
      <motion.div 
        className="flex-1 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.2, delay: isExpanded ? 0.1 : 0 }}
      >
        {isExpanded && (
          <div className="h-full">
            <AnimatePresence mode="wait">
              {chatState.state === "expanded" && (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col"
                >
                  {/* Conversations List */}
                  <div className="flex-1 flex flex-col overflow-y-auto">
                    {conversations.map((conversation) => (
                      <ChatPreview
                        key={conversation.id}
                        conversation={conversation}
                        onOpenConversation={openConversation}
                      />
                    ))}

                    {/* Footer */}
                    <div className="mt-auto flex justify-end p-4 sticky bottom-0 bg-gradient-to-t from-background via-background/80 to-black/0">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="pl-0 py-0 gap-4 overflow-clip"
                      >
                        <div className="bg-primary text-primary-foreground h-full aspect-square border-r-2 border-background flex items-center justify-center">
                          <PlusIcon className="size-4" />
                        </div>
                        New Chat
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {chatState.state === "conversation" && activeConversation && (
                <motion.div
                  key="conversation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ChatConversation
                    activeConversation={activeConversation}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    onSendMessage={handleSendMessage}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
