"use client";

import React, { useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { CodeBlock } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  // Pre-process citations e.g. [1] -> [1](#cite-1) so react-markdown parses them as links
  const processedContent = useMemo(() => {
    if (!content) return "";
    return content.replace(/\[([0-9]+)\]/g, "[$1](#cite-$1)");
  }, [content]);

  return (
    <div className="markdown-message-root text-slate-200 select-text leading-relaxed">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Overriding headers
          h1: ({ children }) => (
            <h1 className="mt-6 mb-3 text-2xl font-bold text-white first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 mb-2.5 text-xl font-semibold text-white first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-2 text-lg font-medium text-slate-200 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 mb-1.5 text-base font-semibold text-slate-300 first:mt-0">
              {children}
            </h4>
          ),
          
          // Overriding paragraphs and blockquotes
          p: ({ children }) => (
            <p className="my-3 leading-relaxed text-slate-300 first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-cyan-500 bg-white/[0.03] pl-4 pr-3 py-2 rounded-r-lg text-slate-400 italic">
              {children}
            </blockquote>
          ),

          // Overriding lists
          ul: ({ children }) => (
            <ul className="my-3 list-disc pl-6 space-y-1 text-slate-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal pl-6 space-y-1 text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),

          // Overriding links (for citations and standard anchors)
          a: ({ href, children }) => {
            if (href?.startsWith("#cite-")) {
              return (
                <span className="chat-citation-inline mx-0.5 inline-flex items-center justify-center rounded bg-cyan-500/20 px-1 py-0.2 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30 cursor-default select-none hover:bg-cyan-500/30 transition">
                  {children}
                </span>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 transition"
              >
                {children}
              </a>
            );
          },

          // Overriding tables
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/30 shadow-inner">
              <table className="w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/10 bg-white/[0.04]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/5">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-white/[0.01] transition-colors duration-150">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 font-semibold text-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-slate-300">
              {children}
            </td>
          ),

          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !className && !String(children).includes("\n");
            const value = String(children).replace(/\n$/, "");

            if (isInline) {
              return (
                <code 
                  className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-200 border border-white/5"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            if (match && match[1] === "mermaid") {
              return <MermaidDiagram code={value} />;
            }

            return <CodeBlock language={match ? match[1] : "text"} value={value} />;
          }
        }}
      >
        {processedContent}
      </Markdown>
    </div>
  );
}
