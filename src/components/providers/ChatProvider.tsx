"use client";

import {
  AssistantRuntimeProvider,
  useLocalRuntime,
} from "@assistant-ui/react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ChatDock } from "@/components/chat/ChatDock";
import {
  ChatDockContext,
  type ChatDockContextValue,
  type OpenChatOptions,
} from "@/components/providers/chat-context";
import { conciergeAdapter } from "@/lib/chat/adapter";

export function ChatProvider({ children }: { children: ReactNode }) {
  const runtime = useLocalRuntime(conciergeAdapter);
  const [open, setOpen] = useState(false);

  const openChat = useCallback(
    (prompt?: string, options?: OpenChatOptions) => {
      setOpen(true);
      if (!prompt) return;
      runtime.thread.composer.setText(prompt);
      if (options?.send) {
        // Let React commit the open panel before starting the run.
        window.setTimeout(() => runtime.thread.composer.send(), 0);
      }
    },
    [runtime],
  );

  const closeChat = useCallback(() => setOpen(false), []);

  const resetConversation = useCallback(async () => {
    await runtime.threads.switchToNewThread();
    await runtime.thread.composer.reset();
  }, [runtime]);

  const value = useMemo<ChatDockContextValue>(
    () => ({ open, openChat, closeChat, resetConversation }),
    [open, openChat, closeChat, resetConversation],
  );

  return (
    <ChatDockContext.Provider value={value}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
        <ChatDock />
      </AssistantRuntimeProvider>
    </ChatDockContext.Provider>
  );
}
