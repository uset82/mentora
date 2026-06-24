"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Maximize2, Minus, Plus, RotateCcw, X, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

// Initialize mermaid on client side
let mermaidInitialized = false;
const initMermaid = () => {
  if (typeof window !== "undefined" && !mermaidInitialized) {
    try {
      import("mermaid").then(({ default: m }) => {
        m.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          themeVariables: {
            background: "#0f172a", // slate-900
            primaryColor: "#1e293b", // slate-800
            primaryTextColor: "#f1f5f9", // slate-100
            primaryBorderColor: "#334155", // slate-700
            lineColor: "#64748b", // slate-500
            secondaryColor: "#1e1b4b", // indigo-950
            tertiaryColor: "#020617",
          },
        });
        mermaidInitialized = true;
      });
    } catch (e) {
      console.error("Failed to load mermaid:", e);
    }
  }
};

interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    initMermaid();
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let active = true;
    const renderSvg = async () => {
      try {
        const { default: m } = await import("mermaid");
        
        // Generate a unique ID for the SVG element
        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 11)}`;
        
        // Render SVG client-side
        const { svg: renderedSvg } = await m.render(id, code.trim());
        
        if (active) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        console.error("Mermaid parsing error:", err);
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
          setSvg(null);
        }
        
        // Clean up bad DOM elements created by failed render
        const badElements = document.querySelectorAll("[id^='dmermaid-']");
        badElements.forEach((el) => el.remove());
      }
    };

    renderSvg();

    return () => {
      active = false;
    };
  }, [code, isMounted]);

  if (!isMounted) {
    return (
      <div className="flex h-32 animate-pulse items-center justify-center rounded-xl bg-slate-900/50 p-4 border border-white/5">
        <div className="text-slate-400 text-xs">Cargando diagrama...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4 rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-slate-100">
        <div className="flex items-center gap-2 text-red-400 text-sm font-semibold mb-2">
          <AlertTriangle size={16} />
          <span>Error al renderizar el diagrama</span>
        </div>
        <pre className="overflow-x-auto rounded bg-black/30 p-3 font-mono text-xs text-red-300 border border-red-950/40">
          {code.trim()}
        </pre>
        <p className="mt-2 text-xs text-slate-400">
          Revisa la sintaxis del código Mermaid.
        </p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-slate-900/50 p-4 border border-white/5">
        <div className="text-slate-400 text-xs">Renderizando diagrama...</div>
      </div>
    );
  }

  return (
    <div className="group/mermaid relative my-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
      <button
        onClick={() => setIsZoomOpen(true)}
        className="absolute top-3 right-3 z-10 cursor-pointer rounded-lg border border-white/10 bg-slate-950/80 p-2 text-slate-400 opacity-0 transition hover:bg-slate-900 hover:text-white group-hover/mermaid:opacity-100 focus-visible:opacity-100"
        type="button"
        title="Ampliar diagrama"
      >
        <Maximize2 size={15} />
      </button>

      <div
        className="mermaid-content overflow-x-auto py-2 [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {isZoomOpen &&
        createPortal(
          <MermaidZoomModal
            svg={svg}
            onClose={() => setIsZoomOpen(false)}
          />,
          document.body
        )}
    </div>
  );
}

interface MermaidZoomModalProps {
  svg: string;
  onClose: () => void;
}

function MermaidZoomModal({ svg, onClose }: MermaidZoomModalProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  // Generate unique IDs for zoomed SVGs to prevent duplicate ID issues
  const zoomSvg = useMemo(() => {
    return svg
      .replace(/id="([^"]+)"/g, 'id="$1-zoom"')
      .replace(/url\(#([^)]+)\)/g, "url(#$1-zoom)")
      .replace(/(href|xlink:href)="#([^"]+)"/g, '$1="#$2-zoom"');
  }, [svg]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleZoom = (factor: number) => {
    setTransform((t) => ({
      ...t,
      scale: Math.min(4, Math.max(0.4, t.scale * factor)),
    }));
  };

  const handleReset = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: transform.x,
      originY: transform.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setTransform((t) => ({
      ...t,
      x: drag.current!.originX + e.clientX - drag.current!.startX,
      y: drag.current!.originY + e.clientY - drag.current!.startY,
    }));
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Viewport for Dragging and Zooming */}
      <div
        ref={viewportRef}
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="flex h-full w-full items-center justify-center transition-transform duration-75 ease-out [&_svg]:max-h-[85vh] [&_svg]:max-w-[85vw] [&_svg]:h-auto"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
          }}
          dangerouslySetInnerHTML={{ __html: zoomSvg }}
        />
      </div>

      {/* Header and Controls */}
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-lg font-semibold text-slate-100">Visor de Diagrama</h3>
        <p className="text-xs text-slate-400">Arrastra para mover · Usa los botones para hacer zoom</p>
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-8 right-1/2 translate-x-1/2 sm:right-8 sm:bottom-8 sm:translate-x-0 z-10 flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => handleZoom(1.2)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          type="button"
          title="Acercar"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => handleZoom(0.85)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          type="button"
          title="Alejar"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          type="button"
          title="Restablecer"
        >
          <RotateCcw size={18} />
        </button>
        <div className="mx-1 h-5 w-px bg-white/10" />
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer"
          type="button"
          title="Cerrar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
