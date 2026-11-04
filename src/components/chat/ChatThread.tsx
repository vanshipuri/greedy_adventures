"use client";

import {
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  type TextMessagePartComponent,
} from "@assistant-ui/react";
import { ConciergeExtras } from "@/components/chat/ConciergeExtras";
import { SafeMarkdown } from "@/components/chat/SafeMarkdown";

const quickPrompts = [
  "What is included in the package?",
  "Can you send me a brochure?",
  "Can I see a video of the experience?",
  "Send me the brochure and a video.",
  "How much is the VIP package?",
  "Is there a weight limit?",
];

const AssistantText: TextMessagePartComponent = ({ text }) => (
  <SafeMarkdown markdown={text} className="assistant-markdown" />
);

const UserText: TextMessagePartComponent = ({ text }) => (
  <p className="user-text">{text}</p>
);

function UserMessage() {
  return (
    <MessagePrimitive.Root className="chat-message chat-message--user">
      <div className="chat-message__body">
        <span className="chat-message__role">You</span>
        <div className="chat-message__content">
          <MessagePrimitive.Parts components={{ Text: UserText }} />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="chat-message chat-message--assistant">
      <div className="chat-message__avatar" aria-hidden="true">
        GA
      </div>
      <div className="chat-message__body">
        <span className="chat-message__role">Sea View concierge</span>
        <div className="chat-message__content">
          <MessagePrimitive.Parts
            components={{
              Text: AssistantText,
              data: { by_name: { concierge: ConciergeExtras } },
            }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function Welcome() {
  return (
    <AuiIf condition={(state) => state.thread.isEmpty}>
      <div className="chat-welcome">
        <span className="eyebrow">Ask the concierge</span>
        <h2>Grounded answers, right here.</h2>
        <p>
          I use a captured snapshot of the public Sea View Skydiving pages, link my sources and can share the demo brochure or film.
        </p>
        <div className="quick-prompts" aria-label="Suggested questions">
          {quickPrompts.map((prompt) => (
            <ThreadPrimitive.Suggestion key={prompt} prompt={prompt} send asChild>
              <button type="button" className="quick-prompt">
                {prompt}
              </button>
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      </div>
    </AuiIf>
  );
}

function Loading() {
  return (
    <AuiIf condition={(state) => state.thread.isRunning}>
      <div className="chat-loading" role="status" aria-live="polite">
        <span className="typing-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Checking the supplied pages…
      </div>
    </AuiIf>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="chat-composer">
      <label className="sr-only" htmlFor="concierge-input">
        Message the Sea View concierge
      </label>
      <ComposerPrimitive.Input
        id="concierge-input"
        data-chat-composer="true"
        className="chat-composer__input"
        aria-label="Message the Sea View concierge"
        placeholder="Ask about packages, prices or demo files…"
        rows={2}
        maxLength={1000}
      />
      <div className="chat-composer__actions">
        <span className="chat-composer__hint">Enter to send · Shift + Enter for a new line</span>
        <AuiIf condition={(state) => !state.thread.isRunning}>
          <ComposerPrimitive.Send className="chat-send" aria-label="Send message" type="button">
            <span aria-hidden="true">→</span>
            <span className="sr-only">Send</span>
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(state) => state.thread.isRunning}>
          <ComposerPrimitive.Cancel className="chat-send chat-send--cancel" aria-label="Cancel response" type="button">
            <span aria-hidden="true">■</span>
            <span className="sr-only">Stop</span>
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </ComposerPrimitive.Root>
  );
}

export function ChatThread() {
  return (
    <ThreadPrimitive.Root className="chat-thread">
      <ThreadPrimitive.Viewport className="chat-thread__viewport" aria-label="Conversation" role="log">
        <Welcome />
        <ThreadPrimitive.Messages>
          {({ message }) =>
            message.role === "user" ? <UserMessage /> : <AssistantMessage />
          }
        </ThreadPrimitive.Messages>
        <Loading />
        <ThreadPrimitive.ViewportFooter className="chat-thread__footer">
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}
