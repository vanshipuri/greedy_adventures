"use client";

import { createContext, useContext } from "react";

export interface OpenChatOptions {
  /** Send the supplied prompt immediately after opening the panel. */
  send?: boolean;
}

export interface ChatDockContextValue {
  open: boolean;
  openChat: (prompt?: string, options?: OpenChatOptions) => void;
  closeChat: () => void;
  resetConversation: () => Promise<void>;
}

export const ChatDockContext = createContext<ChatDockContextValue | null>(null);

export function useChatDock() {
  const value = useContext(ChatDockContext);
  if (!value) throw new Error("useChatDock must be used inside ChatProvider.");
  return value;
}
