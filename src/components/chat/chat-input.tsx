"use client";

import { ChatComposer, type ChatComposerProps } from "./chat-composer";

export type ChatInputProps = ChatComposerProps;

export function ChatInput(props: ChatInputProps) {
  return <ChatComposer {...props} />;
}
