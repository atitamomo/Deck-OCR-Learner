import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ServerAPI } from "decky-frontend-lib";

interface OCRBox {
  box: number[][];
  text: string;
  confidence: number;
}

interface Definition {
  expression: string;
  reading: string;
  definition: string;
  pos: string;
  popularity: number;
  sequence: number;
  dictionary: string;
}

interface Token {
  surface: string;
  base: string;
  reading: string;
  pos: string;
  definitions: Definition[];
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const sortBoxes = (ocrBoxes: OCRBox[]): OCRBox[] => {
  return [...ocrBoxes].sort((a, b) => {
    const cy = (box: OCRBox) => {
      const ys = box.box.map(p => p[1]);
      return (Math.min(...ys) + Math.max(...ys)) / 2;
    };
    const cx = (box: OCRBox) => {
      const xs = box.box.map(p => p[0]);
      return (Math.min(...xs) + Math.max(...xs)) / 2;
    };
    const dy = cy(a) - cy(b);
    if (Math.abs(dy) > 8) return dy;
    return cx(a) - cx(b);
  });
};

export const Overlay: React.FC<{
  serverApi: ServerAPI;
  focusWindow?: Window;
  renderWindow?: Window;
  onActivationChange?: (active: boolean) => void;
}> = ({ serverApi, focusWindow, renderWindow, onActivationChange }) => {
  const activeWindow   = focusWindow  || window;
  const activeDocument = activeWindow.document;
  const displayWindow  = renderWindow || window;

  // ── State ────────────────────────────────────────────────────────────────────
  const [isActive,         setIsActive]         = useState(false);
  const [isScanLoading,    setIsScanLoading]    = useState(false);
  const [isTokenizing,     setIsTokenizing]     = useState(false);
  const [errorMessage,     setErrorMessage]     = useState("");
  const [boxes,            setBoxes]            = useState<OCRBox[]>([]);
  const [screenshotWidth,  setScreenshotWidth]  = useState(1280);
  const [screenshotHeight, setScreenshotHeight] = useState(800);

  // Tokens from the combined text of all boxes
  const [tokens,           setTokens]           = useState<Token[]>([]);
  const [activeTokenIdx,   setActiveTokenIdx]   = useState<number | null>(null);

  // Definition popup — only shown when user explicitly presses A
  const [showDef,          setShowDef]          = useState(false);
  const [saveStatus,       setSaveStatus]       = useState<string | null>(null);

  // ── Refs (stale-closure-safe) ────────────────────────────────────────────────
  const isActiveRef      = useRef(false);
  const tokensRef        = useRef<Token[]>([]);
  const activeTokenIdxRef= useRef<number | null>(null);
  const showDefRef       = useRef(false);
  const tokenRectsListRef = useRef<Rect[][]>([]);

  useEffect(() => { isActiveRef.current       = isActive;       }, [isActive]);
  useEffect(() => { tokensRef.current         = tokens;         }, [tokens]);
  useEffect(() => { activeTokenIdxRef.current = activeTokenIdx; }, [activeTokenIdx]);
  useEffect(() => { showDefRef.current        = showDef;        }, [showDef]);

  useEffect(() => {
    if (onActivationChange) onActivationChange(isActive);
  }, [isActive, onActivationChange]);

  // ── Deactivate ───────────────────────────────────────────────────────────────
  const deactivate = useCallback(() => {
    setIsActive(false);       isActiveRef.current = false;
    setIsScanLoading(false);
    setBoxes([]);
    setTokens([]);            tokensRef.current = [];
    setActiveTokenIdx(null);  activeTokenIdxRef.current = null;
    setShowDef(false);        showDefRef.current = false;
    setSaveStatus(null);
    setErrorMessage("");
    try {
      const qam = activeDocument.body.firstElementChild as HTMLElement;
      if (qam) qam.style.visibility = "visible";
      activeDocument.body.style.visibility = "visible";
    } catch {}
    serverApi.callPluginMethod("notify_deactivated", {}).catch(() => {});
  }, [activeDocument, serverApi]);

  const deactivateRef = useRef<() => void>(deactivate);
  useEffect(() => { deactivateRef.current = deactivate; }, [deactivate]);

  useEffect(() => () => {
    try {
      const qam = activeDocument.body.firstElementChild as HTMLElement;
      if (qam) qam.style.visibility = "visible";
      activeDocument.body.style.visibility = "visible";
    } catch {}
    serverApi.callPluginMethod("notify_deactivated", {}).catch(() => {});
  }, [activeDocument, serverApi]);

  // ── Tokenize combined text ───────────────────────────────────────────────────
  const tokenizeCombined = useCallback(async (ocrBoxes: OCRBox[]) => {
    if (!ocrBoxes.length) return;

    const sorted = sortBoxes(ocrBoxes);
    const combined = sorted.map(b => b.text).join("");

    setIsTokenizing(true);
    setTokens([]);
    setActiveTokenIdx(null);
    setSaveStatus(null);

    try {
      const r = await serverApi.callPluginMethod("lookup_word", { text: combined });
      const res = r.result as any;
      if (r.success && res?.status === "success") {
        const toks: Token[] = res.tokens;
        setTokens(toks);           tokensRef.current = toks;
        const firstDef = toks.findIndex(t => t.definitions.length > 0);
        const start = firstDef !== -1 ? firstDef : 0;
        setActiveTokenIdx(start);  activeTokenIdxRef.current = start;
      } else {
        console.error("[OCR] lookup_word error:", res?.message);
      }
    } catch (e) {
      console.error("[OCR] tokenizeCombined error:", e);
    } finally {
      setIsTokenizing(false);
    }
  }, [serverApi]);

  // ── Trigger OCR ──────────────────────────────────────────────────────────────
  const handleTrigger = useCallback(() => {
    if (isActiveRef.current) { deactivateRef.current(); return; }

    setIsActive(true);       isActiveRef.current = true;
    setIsScanLoading(true);
    setErrorMessage("");
    setBoxes([]);
    setTokens([]);           tokensRef.current = [];
    setActiveTokenIdx(null); activeTokenIdxRef.current = null;
    setShowDef(false);       showDefRef.current = false;
    setSaveStatus(null);

    const qam = activeDocument.body.firstElementChild as HTMLElement;
    if (qam) qam.style.visibility = "hidden";
    serverApi.callPluginMethod("notify_activated", {}).catch(() => {});

    serverApi.callPluginMethod("capture_screen", {}).then((response) => {
      const result = response.result as any;
      if (response.success && result?.status === "success") {
        const ocrBoxes: OCRBox[] = result.results;
        setBoxes(ocrBoxes);
        setScreenshotWidth(result.width  || 1280);
        setScreenshotHeight(result.height || 800);
        if (ocrBoxes.length > 0) {
          tokenizeCombined(ocrBoxes);
        } else {
          setErrorMessage("No text detected.");
        }
      } else {
        setErrorMessage(result?.message || "Capture failed.");
      }
    }).catch(() => setErrorMessage("Unexpected error."))
      .finally(() => setIsScanLoading(false));
  }, [activeDocument, serverApi, tokenizeCombined]);

  const handleTriggerRef = useRef<() => void>(handleTrigger);
  useEffect(() => { handleTriggerRef.current = handleTrigger; }, [handleTrigger]);

  // Event fallback
  useEffect(() => {
    const fire = () => handleTriggerRef.current();
    [activeWindow, activeWindow.parent, activeWindow.top].filter(Boolean).forEach(t => {
      try { t!.addEventListener("decky-ocr-trigger", fire); } catch {}
    });
    return () => {
      [activeWindow, activeWindow.parent, activeWindow.top].filter(Boolean).forEach(t => {
        try { t!.removeEventListener("decky-ocr-trigger", fire); } catch {}
      });
    };
  }, []);

  // Backend poll (trigger / deactivate from hotkey)
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (!alive) return;
      try {
        const r = await serverApi.callPluginMethod("poll_ocr_request", {});
        const res = r.result as any;
        if (r.success && res) {
          if (res.triggered  && !isActiveRef.current) handleTriggerRef.current();
          if (res.deactivate &&  isActiveRef.current) deactivateRef.current();
        }
      } catch {}
      if (alive) setTimeout(poll, 250);
    };
    poll();
    return () => { alive = false; };
  }, []);

  // ── Save word ─────────────────────────────────────────────────────────────────
  const handleSaveWord = useCallback(async () => {
    const idx  = activeTokenIdxRef.current;
    const toks = tokensRef.current;
    if (idx === null || !toks.length) return;
    const tok = toks[idx];
    const def = tok.definitions[0];
    setSaveStatus("saving");
    try {
      const r = await serverApi.callPluginMethod("add_to_vocab", {
        expression: def ? def.expression : tok.base,
        reading:    def ? def.reading    : tok.reading,
        definition: def ? def.definition : JSON.stringify(["No definition found."]),
        sentence:   toks.map(t => t.surface).join("")
      });
      const res = r.result as any;
      setSaveStatus(r.success && res?.status === "success" ? "saved" : "error");
    } catch { setSaveStatus("error"); }
  }, [serverApi]);

  const handleSaveWordRef = useRef<() => void>(handleSaveWord);
  useEffect(() => { handleSaveWordRef.current = handleSaveWord; }, [handleSaveWord]);

  // ── Button handler ────────────────────────────────────────────────────────────
  const handleButton = useCallback((btn: string) => {
    const toks = tokensRef.current;
    const idx  = activeTokenIdxRef.current;
    const defVisible = showDefRef.current;

    // Helper to calculate token center coordinates
    const getCenter = (tIdx: number) => {
      const rects = tokenRectsListRef.current[tIdx];
      if (!rects || !rects.length) return null;
      let sumX = 0, sumY = 0;
      rects.forEach(r => {
        sumX += r.left + r.width / 2;
        sumY += r.top + r.height / 2;
      });
      return { x: sumX / rects.length, y: sumY / rects.length };
    };

    const currentCenter = idx !== null ? getCenter(idx) : null;

    const findSpatialToken = (dir: "UP" | "DOWN") => {
      if (idx === null || !currentCenter) return null;
      let bestIdx: number | null = null;
      let minCost = Infinity;

      for (let j = 0; j < toks.length; j++) {
        if (j === idx) continue;
        const center = getCenter(j);
        if (!center) continue;

        const dx = center.x - currentCenter.x;
        const dy = center.y - currentCenter.y;

        if (dir === "UP") {
          // Candidate must be vertically above the current token (dy < -4)
          if (dy < -4) {
            // Cost function favors vertical proximity but penalizes horizontal deviation
            const cost = (-dy) + 3.0 * Math.abs(dx);
            if (cost < minCost) {
              minCost = cost;
              bestIdx = j;
            }
          }
        } else if (dir === "DOWN") {
          // Candidate must be vertically below the current token (dy > 4)
          if (dy > 4) {
            const cost = dy + 3.0 * Math.abs(dx);
            if (cost < minCost) {
              minCost = cost;
              bestIdx = j;
            }
          }
        }
      }
      return bestIdx;
    };

    switch (btn) {
      case "DPAD_LEFT": case "ArrowLeft":
        if (toks.length && idx !== null) {
          const n = (idx - 1 + toks.length) % toks.length;
          setActiveTokenIdx(n); activeTokenIdxRef.current = n;
          setSaveStatus(null);
        }
        break;

      case "DPAD_RIGHT": case "ArrowRight":
        if (toks.length && idx !== null) {
          const n = (idx + 1) % toks.length;
          setActiveTokenIdx(n); activeTokenIdxRef.current = n;
          setSaveStatus(null);
        }
        break;

      case "DPAD_UP": case "ArrowUp":
        if (toks.length && idx !== null) {
          const target = findSpatialToken("UP");
          if (target !== null) {
            setActiveTokenIdx(target); activeTokenIdxRef.current = target;
            setSaveStatus(null);
          }
        }
        break;

      case "DPAD_DOWN": case "ArrowDown":
        if (toks.length && idx !== null) {
          const target = findSpatialToken("DOWN");
          if (target !== null) {
            setActiveTokenIdx(target); activeTokenIdxRef.current = target;
            setSaveStatus(null);
          }
        }
        break;

      case "A": case "Enter":
        if (defVisible) {
          // A while definition is open = save
          handleSaveWordRef.current();
        } else {
          // A while navigating tokens = open definition
          setShowDef(true); showDefRef.current = true;
          setSaveStatus(null);
        }
        break;

      case "X": case "x": case "Escape":
        if (defVisible) {
          // X or Escape closes definition popup only — never the overlay
          setShowDef(false); showDefRef.current = false;
          setSaveStatus(null);
        }
        break;
    }
  }, []);

  const handleButtonRef = useRef<(b: string) => void>(handleButton);
  useEffect(() => { handleButtonRef.current = handleButton; }, [handleButton]);

  // Poll hidraw nav input (primary — works in GamepadUI)
  useEffect(() => {
    if (!isActive) return;
    let alive = true;
    const poll = async () => {
      if (!alive) return;
      try {
        const r = await serverApi.callPluginMethod("poll_nav_input", {});
        const res = r.result as any;
        if (r.success && res?.button) handleButtonRef.current(res.button);
      } catch {}
      if (alive) setTimeout(poll, 100);
    };
    poll();
    return () => { alive = false; };
  }, [isActive]);

  // Keyboard fallback + capture event blocking to prevent Steam navigation
  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: any) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter","Escape","x","X"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        handleButtonRef.current(e.key);
      }
    };
    
    const targets: (Window | Document)[] = [];
    [activeWindow, displayWindow].forEach(w => {
      if (w) {
        targets.push(w);
        if (w.document) targets.push(w.document);
      }
    });

    [...new Set(targets)].forEach(t => {
      try {
        t.addEventListener("keydown", onKey, true);
      } catch {}
    });

    if (containerRef.current) containerRef.current.focus();

    return () => {
      [...new Set(targets)].forEach(t => {
        try {
          t.removeEventListener("keydown", onKey, true);
        } catch {}
      });
    };
  }, [isActive]);

  // Deactivate/Reactively pause Steam navigation controller
  useEffect(() => {
    if (!isActive) return;
    
    const deactivatedTreesSet = new Set<any>();
    
    const disableTrees = () => {
      try {
        const windows = [
          window,
          activeWindow,
          displayWindow,
          window.parent,
          window.top,
          activeWindow?.parent,
          activeWindow?.top,
          displayWindow?.parent,
          displayWindow?.top
        ].filter(Boolean);
        
        const uniqueWindows = Array.from(new Set(windows));
        
        uniqueWindows.forEach((win: any) => {
          try {
            const focusNav = win.GamepadNavTree?.m_context?.m_controller || win.FocusNavController;
            if (!focusNav) return;
            
            const contexts = [focusNav.m_ActiveContext, focusNav.m_LastActiveContext].filter(Boolean);
            contexts.forEach((context: any) => {
              const rgTrees = context?.m_rgGamepadNavigationTrees || [];
              rgTrees.forEach((tree: any) => {
                if (tree && !deactivatedTreesSet.has(tree)) {
                  const isTreeActive = tree.m_bActive || tree.m_bActive === undefined;
                  if (isTreeActive) {
                    if (typeof tree.SetActive === 'function') {
                      tree.SetActive(false);
                    } else {
                      tree.m_bActive = false;
                    }
                    deactivatedTreesSet.add(tree);
                  }
                }
              });
            });
          } catch (e) {
            console.error("[Overlay] Error disabling trees on window:", e);
          }
        });
      } catch (e) {
        console.error("[Overlay] Error in disableTrees outer block:", e);
      }
    };

    disableTrees();
    const interval = setInterval(disableTrees, 400);
    
    return () => {
      clearInterval(interval);
      try {
        deactivatedTreesSet.forEach((tree: any) => {
          if (tree) {
            if (typeof tree.SetActive === 'function') {
              tree.SetActive(true);
            } else {
              tree.m_bActive = true;
            }
          }
        });
        console.log(`[Overlay] Restored ${deactivatedTreesSet.size} navigation trees.`);
      } catch (e) {
        console.error("[Overlay] Error restoring trees:", e);
      }
    };
  }, [isActive, activeWindow, displayWindow]);

  // Overriding navigator.getGamepads to pause Steam UI input
  useEffect(() => {
    if (!isActive) return;

    console.log("[Overlay] Pausing Steam UI gamepad input...");

    const targets = [
      window,
      activeWindow,
      displayWindow,
      window.parent,
      window.top,
      activeWindow?.parent,
      activeWindow?.top
    ].filter(Boolean);

    // De-duplicate windows
    const uniqueWindows = Array.from(new Set(targets));

    const originalGetGamepadsMap = new Map<Window, any>();

    uniqueWindows.forEach((win: any) => {
      try {
        if (win.navigator && win.navigator.getGamepads) {
          const original = win.navigator.getGamepads;
          originalGetGamepadsMap.set(win, original);
          
          Object.defineProperty(win.navigator, 'getGamepads', {
            value: function() {
              try {
                const gps = original.call(win.navigator);
                if (!gps) return [];
                return Array.from(gps).map((gp: any) => {
                  if (!gp) return null;
                  return {
                    id: gp.id,
                    index: gp.index,
                    connected: gp.connected,
                    timestamp: gp.timestamp,
                    mapping: gp.mapping,
                    buttons: Array.from(gp.buttons || []).map(() => ({ pressed: false, value: 0 })),
                    axes: Array.from(gp.axes || []).map(() => 0)
                  };
                });
              } catch {
                return [];
              }
            },
            configurable: true,
            writable: true
          });
        }
      } catch (e) {
        console.error("[Overlay] Failed to override navigator.getGamepads on window:", e);
      }
    });

    return () => {
      console.log("[Overlay] Restoring Steam UI gamepad input...");
      originalGetGamepadsMap.forEach((original, win: any) => {
        try {
          Object.defineProperty(win.navigator, 'getGamepads', {
            value: original,
            configurable: true,
            writable: true
          });
        } catch (e) {
          try {
            win.navigator.getGamepads = original;
          } catch {}
        }
      });
    };
  }, [isActive, activeWindow, displayWindow]);

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Coordinate scaling & token mappings ──────────────────────────────────────
  const scaleX = displayWindow.innerWidth  / screenshotWidth;
  const scaleY = displayWindow.innerHeight / screenshotHeight;

  const sortedBoxes = useMemo(() => {
    return sortBoxes(boxes);
  }, [boxes]);

  const combinedText = useMemo(() => {
    return sortedBoxes.map(b => b.text).join("");
  }, [sortedBoxes]);

  const charToBoxMap = useMemo(() => {
    const mapping: { boxIdx: number; charIdxInBox: number }[] = [];
    sortedBoxes.forEach((box, boxIdx) => {
      for (let i = 0; i < box.text.length; i++) {
        mapping.push({ boxIdx, charIdxInBox: i });
      }
    });
    return mapping;
  }, [sortedBoxes]);

  const tokenSpans = useMemo(() => {
    let cur = 0;
    return tokens.map(tok => {
      const idx = combinedText.indexOf(tok.surface, cur);
      if (idx !== -1) {
        const span = { start: idx, end: idx + tok.surface.length - 1 };
        cur = idx + tok.surface.length;
        return span;
      } else {
        const span = { start: cur, end: cur + tok.surface.length - 1 };
        cur += tok.surface.length;
        return span;
      }
    });
  }, [tokens, combinedText]);

  const tokenRectsList = useMemo(() => {
    const list: Rect[][] = [];
    tokenSpans.forEach(span => {
      const rects: Rect[] = [];
      const boxSpans: { [boxIdx: number]: { minIdx: number; maxIdx: number } } = {};
      
      for (let idx = span.start; idx <= span.end; idx++) {
        if (idx < 0 || idx >= charToBoxMap.length) continue;
        const { boxIdx, charIdxInBox } = charToBoxMap[idx];
        if (boxSpans[boxIdx] === undefined) {
          boxSpans[boxIdx] = { minIdx: charIdxInBox, maxIdx: charIdxInBox };
        } else {
          boxSpans[boxIdx].minIdx = Math.min(boxSpans[boxIdx].minIdx, charIdxInBox);
          boxSpans[boxIdx].maxIdx = Math.max(boxSpans[boxIdx].maxIdx, charIdxInBox);
        }
      }
      
      Object.keys(boxSpans).forEach(boxIdxStr => {
        const boxIdx = parseInt(boxIdxStr, 10);
        const box = sortedBoxes[boxIdx];
        const bSpan = boxSpans[boxIdx];
        
        const xs = box.box.map(p => p[0]), ys = box.box.map(p => p[1]);
        const left   = Math.min(...xs) * scaleX;
        const top    = Math.min(...ys) * scaleY;
        const width  = (Math.max(...xs) - Math.min(...xs)) * scaleX;
        const height = (Math.max(...ys) - Math.min(...ys)) * scaleY;
        
        const L = box.text.length;
        if (L <= 0) return;
        
        const isVertical = height > width;
        
        if (isVertical) {
          const charHeight = height / L;
          const subTop = top + bSpan.minIdx * charHeight;
          const subHeight = (bSpan.maxIdx - bSpan.minIdx + 1) * charHeight;
          rects.push({ left, top: subTop, width, height: subHeight });
        } else {
          const charWidth = width / L;
          const subLeft = left + bSpan.minIdx * charWidth;
          const subWidth = (bSpan.maxIdx - bSpan.minIdx + 1) * charWidth;
          rects.push({ left: subLeft, top, width: subWidth, height });
        }
      });
      
      list.push(rects);
    });
    return list;
  }, [tokenSpans, charToBoxMap, sortedBoxes, scaleX, scaleY]);

  useEffect(() => {
    tokenRectsListRef.current = tokenRectsList;
  }, [tokenRectsList]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div style={{
        position: "fixed", top: 8, right: 16,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
        padding: "3px 10px", borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.45)",
        fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600,
        zIndex: 999999, pointerEvents: "none",
        display: "flex", alignItems: "center", gap: 6
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#64748b" }} />
        OCR READY
      </div>
    );
  }

  const activeTok = (activeTokenIdx !== null && tokens.length > 0) ? tokens[activeTokenIdx] : null;

  return (
    <div
      ref={containerRef}
      id="decky-ocr-overlay-container"
      tabIndex={0}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        color: "#fff",
        fontFamily: "Inter, 'Noto Sans JP', sans-serif",
        outline: "none", userSelect: "none", pointerEvents: "auto"
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        /* Dim, scale down, and block pointer events on QAM sidebar/tab elements in parent document when overlay is active */
        [class*="sidebar" i],
        [class*="TabBar" i],
        [class*="QuickAccessTab" i],
        [class*="QuickAccessTabBar" i] {
          pointer-events: none !important;
          opacity: 0.15 !important;
          transform: scale(0.65) !important;
          transition: all 0.25s ease !important;
        }

        /* Make the back button header faded and inert */
        div:has(> button:has(svg > path[d^="M257.5 445.1"])) {
          pointer-events: none !important;
          opacity: 0.15 !important;
          transition: all 0.25s ease !important;
        }
      `}} />
      {/* ── Spinner ── */}
      {isScanLoading && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12
        }}>
          <div style={{
            width: 44, height: 44,
            border: "3px solid rgba(255,255,255,0.1)",
            borderTop: "3px solid #facc15",
            borderRadius: "50%", animation: "spin 0.9s linear infinite"
          }} />
          <span style={{ fontSize: 13, opacity: 0.7 }}>Scanning…</span>
        </div>
      )}

      {/* ── Error ── */}
      {errorMessage && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "rgba(200,30,30,0.9)", backdropFilter: "blur(8px)",
          padding: "14px 22px", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.15)",
          textAlign: "center"
        }}>
          <div style={{ marginBottom: 10 }}>{errorMessage}</div>
          <button onClick={deactivate} style={{
            background: "#fff", color: "#b91c1c",
            border: "none", padding: "5px 14px",
            borderRadius: 6, fontWeight: "bold", cursor: "pointer"
          }}>Close</button>
        </div>
      )}

      {/* ── Raw Bounding boxes on screenshot (shown before tokens load) ── */}
      {!isScanLoading && !errorMessage && tokens.length === 0 && sortedBoxes.map((item, i) => {
        const xs = item.box.map(p => p[0]), ys = item.box.map(p => p[1]);
        const left   = Math.min(...xs) * scaleX;
        const top    = Math.min(...ys) * scaleY;
        const width  = (Math.max(...xs) - Math.min(...xs)) * scaleX;
        const height = (Math.max(...ys) - Math.min(...ys)) * scaleY;
        return (
          <div key={i} style={{
            position: "absolute", left, top, width, height,
            border: "1.5px solid rgba(250,204,21,0.45)",
            borderRadius: 3,
            background: "rgba(250,204,21,0.03)",
            pointerEvents: "none"
          }} />
        );
      })}

      {/* ── Token highlights on screenshot (shown once tokenized) ── */}
      {!isScanLoading && !errorMessage && tokenRectsList.map((rects, tokenIdx) => {
        const isActive = tokenIdx === activeTokenIdx;
        return rects.map((r, rectIdx) => (
          <div
            key={`${tokenIdx}-${rectIdx}`}
            style={{
              position: "absolute",
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
              border: isActive ? "2.5px solid #facc15" : "1.2px solid rgba(255, 255, 255, 0.35)",
              borderRadius: 4,
              background: isActive ? "rgba(250, 204, 21, 0.28)" : "rgba(255, 255, 255, 0.05)",
              boxShadow: isActive ? "0 0 12px rgba(250, 204, 21, 0.7)" : "none",
              pointerEvents: "none",
              transition: "all 0.12s ease",
              zIndex: isActive ? 100 : 10
            }}
          />
        ));
      })}

      {/* ── Tokenizing Spinner ── */}
      {isTokenizing && (
        <div style={{
          position: "absolute", bottom: 32, left: "50%",
          transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(15, 15, 27, 0.85)",
          backdropFilter: "blur(10px)",
          padding: "10px 18px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.08)",
          zIndex: 999
        }}>
          <div style={{
            width: 16, height: 16,
            border: "2px solid rgba(255,255,255,0.2)",
            borderTop: "2px solid #facc15",
            borderRadius: "50%", animation: "spin 0.8s linear infinite"
          }} />
          <span style={{ fontSize: 13, color: "#fff" }}>Tokenizing…</span>
        </div>
      )}

      {/* ── Help tooltip / hint ── */}
      {!isScanLoading && !errorMessage && !showDef && tokens.length > 0 && (
        <div style={{
          position: "absolute", bottom: 24, left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15, 15, 27, 0.85)",
          backdropFilter: "blur(10px)",
          padding: "8px 18px", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.45)",
          color: "rgba(255,255,255,0.85)",
          fontSize: 12, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
          zIndex: 999
        }}>
          <span>D-pad ◀ ▶ to navigate</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>A to define</span>
        </div>
      )}

      {/* ── Definition floating card ── */}
      {showDef && activeTok && (
        <div style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: 600,
          background: "rgba(15, 15, 27, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: 12,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          padding: "16px 20px",
          maxHeight: 250,
          overflowY: "auto",
          zIndex: 9999,
          animation: "slideUp 0.15s ease-out",
          fontFamily: "Inter, 'Noto Sans JP', sans-serif"
        }}>
          {/* Headword */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{activeTok.base}</span>
            {activeTok.reading && activeTok.reading !== "*" && (
              <span style={{ fontSize: 16, color: "#fde68a", fontWeight: 600 }}>[{activeTok.reading}]</span>
            )}
            {activeTok.pos && (
              <span style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.12)",
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 500
              }}>{String(activeTok.pos).split(",")[0]}</span>
            )}
          </div>

          {/* Definitions */}
          {activeTok.definitions.length === 0 ? (
            <div style={{ opacity: 0.5, fontStyle: "italic", fontSize: 13, color: "#cbd5e1", margin: "8px 0" }}>
              No dictionary entries found.
            </div>
          ) : activeTok.definitions.slice(0, 3).map((def, i) => {
            let defs: string[] = [];
            try {
              const p = JSON.parse(def.definition);
              defs = Array.isArray(p)
                ? p.map((d: any) => typeof d === "string" ? d : JSON.stringify(d))
                : [String(p)];
            } catch { defs = [String(def.definition)]; }
            return (
              <div key={i} style={{
                marginTop: i > 0 ? 10 : 0,
                paddingTop: i > 0 ? 10 : 0,
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#fde68a", fontWeight: 600 }}>
                    {def.expression} · {def.reading}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{def.dictionary}</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
                  {defs.map((d, j) => <li key={j}>{String(d)}</li>)}
                </ol>
              </div>
            );
          })}

          {/* Action Row */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 14,
            paddingTop: 10,
            borderTop: "1px solid rgba(255,255,255,0.08)"
          }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>X — close · A — save</span>
            <button
              onClick={() => handleSaveWordRef.current()}
              disabled={saveStatus === "saving" || saveStatus === "saved"}
              style={{
                background: saveStatus === "saved" ? "#16a34a" : "#facc15",
                color: saveStatus === "saved" ? "#fff" : "#111",
                border: "none",
                padding: "6px 18px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                opacity: saveStatus === "saving" ? 0.6 : 1,
                transition: "all 0.15s ease",
                boxShadow: saveStatus === "saved" ? "none" : "0 2px 8px rgba(250,204,21,0.3)"
              }}
            >
              {saveStatus === "saving" ? "Saving…" :
               saveStatus === "saved"  ? "✓ Saved" :
               saveStatus === "error"  ? "Error" : "Save"}
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};
