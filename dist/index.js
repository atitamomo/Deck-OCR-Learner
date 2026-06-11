(function (deckyFrontendLib, React, ReactDOM) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
  var ReactDOM__default = /*#__PURE__*/_interopDefaultLegacy(ReactDOM);

  var DefaultContext = {
    color: undefined,
    size: undefined,
    className: undefined,
    style: undefined,
    attr: undefined
  };
  var IconContext = React__default["default"].createContext && React__default["default"].createContext(DefaultContext);

  var __assign = undefined && undefined.__assign || function () {
    __assign = Object.assign || function (t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  var __rest = undefined && undefined.__rest || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
    }
    return t;
  };
  function Tree2Element(tree) {
    return tree && tree.map(function (node, i) {
      return React__default["default"].createElement(node.tag, __assign({
        key: i
      }, node.attr), Tree2Element(node.child));
    });
  }
  function GenIcon(data) {
    // eslint-disable-next-line react/display-name
    return function (props) {
      return React__default["default"].createElement(IconBase, __assign({
        attr: __assign({}, data.attr)
      }, props), Tree2Element(data.child));
    };
  }
  function IconBase(props) {
    var elem = function (conf) {
      var attr = props.attr,
        size = props.size,
        title = props.title,
        svgProps = __rest(props, ["attr", "size", "title"]);
      var computedSize = size || conf.size || "1em";
      var className;
      if (conf.className) className = conf.className;
      if (props.className) className = (className ? className + " " : "") + props.className;
      return React__default["default"].createElement("svg", __assign({
        stroke: "currentColor",
        fill: "currentColor",
        strokeWidth: "0"
      }, conf.attr, attr, svgProps, {
        className: className,
        style: __assign(__assign({
          color: props.color || conf.color
        }, conf.style), props.style),
        height: computedSize,
        width: computedSize,
        xmlns: "http://www.w3.org/2000/svg"
      }), title && React__default["default"].createElement("title", null, title), props.children);
    };
    return IconContext !== undefined ? React__default["default"].createElement(IconContext.Consumer, null, function (conf) {
      return elem(conf);
    }) : elem(DefaultContext);
  }

  // THIS FILE IS AUTO GENERATED
  function FaBookOpen (props) {
    return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M542.22 32.05c-54.8 3.11-163.72 14.43-230.96 55.59-4.64 2.84-7.27 7.89-7.27 13.17v363.87c0 11.55 12.63 18.85 23.28 13.49 69.18-34.82 169.23-44.32 218.7-46.92 16.89-.89 30.02-14.43 30.02-30.66V62.75c.01-17.71-15.35-31.74-33.77-30.7zM264.73 87.64C197.5 46.48 88.58 35.17 33.78 32.05 15.36 31.01 0 45.04 0 62.75V400.6c0 16.24 13.13 29.78 30.02 30.66 49.49 2.6 149.59 12.11 218.77 46.95 10.62 5.35 23.21-1.94 23.21-13.46V100.63c0-5.29-2.62-10.14-7.27-12.99z"}}]})(props);
  }function FaBook (props) {
    return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"}}]})(props);
  }function FaPlay (props) {
    return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"}}]})(props);
  }function FaPlus (props) {
    return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"}}]})(props);
  }function FaTrash (props) {
    return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"}}]})(props);
  }

  const sortBoxes = (ocrBoxes) => {
      return [...ocrBoxes].sort((a, b) => {
          const cy = (box) => {
              const ys = box.box.map(p => p[1]);
              return (Math.min(...ys) + Math.max(...ys)) / 2;
          };
          const cx = (box) => {
              const xs = box.box.map(p => p[0]);
              return (Math.min(...xs) + Math.max(...xs)) / 2;
          };
          const dy = cy(a) - cy(b);
          if (Math.abs(dy) > 8)
              return dy;
          return cx(a) - cx(b);
      });
  };
  const Overlay = ({ serverApi, focusWindow, renderWindow, onActivationChange }) => {
      const activeWindow = focusWindow || window;
      const activeDocument = activeWindow.document;
      const displayWindow = renderWindow || window;
      // ── State ────────────────────────────────────────────────────────────────────
      const [isActive, setIsActive] = React.useState(false);
      const [isScanLoading, setIsScanLoading] = React.useState(false);
      const [isTokenizing, setIsTokenizing] = React.useState(false);
      const [errorMessage, setErrorMessage] = React.useState("");
      const [boxes, setBoxes] = React.useState([]);
      const [screenshotWidth, setScreenshotWidth] = React.useState(1280);
      const [screenshotHeight, setScreenshotHeight] = React.useState(800);
      // Tokens from the combined text of all boxes
      const [tokens, setTokens] = React.useState([]);
      const [activeTokenIdx, setActiveTokenIdx] = React.useState(null);
      // Definition popup — only shown when user explicitly presses A
      const [showDef, setShowDef] = React.useState(false);
      const [saveStatus, setSaveStatus] = React.useState(null);
      // ── Refs (stale-closure-safe) ────────────────────────────────────────────────
      const isActiveRef = React.useRef(false);
      const tokensRef = React.useRef([]);
      const activeTokenIdxRef = React.useRef(null);
      const showDefRef = React.useRef(false);
      const tokenRectsListRef = React.useRef([]);
      React.useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
      React.useEffect(() => { tokensRef.current = tokens; }, [tokens]);
      React.useEffect(() => { activeTokenIdxRef.current = activeTokenIdx; }, [activeTokenIdx]);
      React.useEffect(() => { showDefRef.current = showDef; }, [showDef]);
      React.useEffect(() => {
          if (onActivationChange)
              onActivationChange(isActive);
      }, [isActive, onActivationChange]);
      // ── Deactivate ───────────────────────────────────────────────────────────────
      const deactivate = React.useCallback(() => {
          setIsActive(false);
          isActiveRef.current = false;
          setIsScanLoading(false);
          setBoxes([]);
          setTokens([]);
          tokensRef.current = [];
          setActiveTokenIdx(null);
          activeTokenIdxRef.current = null;
          setShowDef(false);
          showDefRef.current = false;
          setSaveStatus(null);
          setErrorMessage("");
          try {
              const qam = activeDocument.body.firstElementChild;
              if (qam)
                  qam.style.visibility = "visible";
              activeDocument.body.style.visibility = "visible";
          }
          catch { }
          serverApi.callPluginMethod("notify_deactivated", {}).catch(() => { });
      }, [activeDocument, serverApi]);
      const deactivateRef = React.useRef(deactivate);
      React.useEffect(() => { deactivateRef.current = deactivate; }, [deactivate]);
      React.useEffect(() => () => {
          try {
              const qam = activeDocument.body.firstElementChild;
              if (qam)
                  qam.style.visibility = "visible";
              activeDocument.body.style.visibility = "visible";
          }
          catch { }
          serverApi.callPluginMethod("notify_deactivated", {}).catch(() => { });
      }, [activeDocument, serverApi]);
      // ── Tokenize combined text ───────────────────────────────────────────────────
      const tokenizeCombined = React.useCallback(async (ocrBoxes) => {
          if (!ocrBoxes.length)
              return;
          const sorted = sortBoxes(ocrBoxes);
          const combined = sorted.map(b => b.text).join("");
          setIsTokenizing(true);
          setTokens([]);
          setActiveTokenIdx(null);
          setSaveStatus(null);
          try {
              const r = await serverApi.callPluginMethod("lookup_word", { text: combined });
              const res = r.result;
              if (r.success && res?.status === "success") {
                  const toks = res.tokens;
                  setTokens(toks);
                  tokensRef.current = toks;
                  const firstDef = toks.findIndex(t => t.definitions.length > 0);
                  const start = firstDef !== -1 ? firstDef : 0;
                  setActiveTokenIdx(start);
                  activeTokenIdxRef.current = start;
              }
              else {
                  console.error("[OCR] lookup_word error:", res?.message);
              }
          }
          catch (e) {
              console.error("[OCR] tokenizeCombined error:", e);
          }
          finally {
              setIsTokenizing(false);
          }
      }, [serverApi]);
      // ── Trigger OCR ──────────────────────────────────────────────────────────────
      const handleTrigger = React.useCallback(() => {
          if (isActiveRef.current) {
              deactivateRef.current();
              return;
          }
          setIsActive(true);
          isActiveRef.current = true;
          setIsScanLoading(true);
          setErrorMessage("");
          setBoxes([]);
          setTokens([]);
          tokensRef.current = [];
          setActiveTokenIdx(null);
          activeTokenIdxRef.current = null;
          setShowDef(false);
          showDefRef.current = false;
          setSaveStatus(null);
          const qam = activeDocument.body.firstElementChild;
          if (qam)
              qam.style.visibility = "hidden";
          serverApi.callPluginMethod("notify_activated", {}).catch(() => { });
          serverApi.callPluginMethod("capture_screen", {}).then((response) => {
              const result = response.result;
              if (response.success && result?.status === "success") {
                  const ocrBoxes = result.results;
                  setBoxes(ocrBoxes);
                  setScreenshotWidth(result.width || 1280);
                  setScreenshotHeight(result.height || 800);
                  if (ocrBoxes.length > 0) {
                      tokenizeCombined(ocrBoxes);
                  }
                  else {
                      setErrorMessage("No text detected.");
                  }
              }
              else {
                  setErrorMessage(result?.message || "Capture failed.");
              }
          }).catch(() => setErrorMessage("Unexpected error."))
              .finally(() => setIsScanLoading(false));
      }, [activeDocument, serverApi, tokenizeCombined]);
      const handleTriggerRef = React.useRef(handleTrigger);
      React.useEffect(() => { handleTriggerRef.current = handleTrigger; }, [handleTrigger]);
      // Event fallback
      React.useEffect(() => {
          const fire = () => handleTriggerRef.current();
          [activeWindow, activeWindow.parent, activeWindow.top].filter(Boolean).forEach(t => {
              try {
                  t.addEventListener("decky-ocr-trigger", fire);
              }
              catch { }
          });
          return () => {
              [activeWindow, activeWindow.parent, activeWindow.top].filter(Boolean).forEach(t => {
                  try {
                      t.removeEventListener("decky-ocr-trigger", fire);
                  }
                  catch { }
              });
          };
      }, []);
      // Backend poll (trigger / deactivate from hotkey)
      React.useEffect(() => {
          let alive = true;
          const poll = async () => {
              if (!alive)
                  return;
              try {
                  const r = await serverApi.callPluginMethod("poll_ocr_request", {});
                  const res = r.result;
                  if (r.success && res) {
                      if (res.triggered && !isActiveRef.current)
                          handleTriggerRef.current();
                      if (res.deactivate && isActiveRef.current)
                          deactivateRef.current();
                  }
              }
              catch { }
              if (alive)
                  setTimeout(poll, 250);
          };
          poll();
          return () => { alive = false; };
      }, []);
      // ── Save word ─────────────────────────────────────────────────────────────────
      const handleSaveWord = React.useCallback(async () => {
          const idx = activeTokenIdxRef.current;
          const toks = tokensRef.current;
          if (idx === null || !toks.length)
              return;
          const tok = toks[idx];
          const def = tok.definitions[0];
          setSaveStatus("saving");
          try {
              const r = await serverApi.callPluginMethod("add_to_vocab", {
                  expression: def ? def.expression : tok.base,
                  reading: def ? def.reading : tok.reading,
                  definition: def ? def.definition : JSON.stringify(["No definition found."]),
                  sentence: toks.map(t => t.surface).join("")
              });
              const res = r.result;
              setSaveStatus(r.success && res?.status === "success" ? "saved" : "error");
          }
          catch {
              setSaveStatus("error");
          }
      }, [serverApi]);
      const handleSaveWordRef = React.useRef(handleSaveWord);
      React.useEffect(() => { handleSaveWordRef.current = handleSaveWord; }, [handleSaveWord]);
      // ── Button handler ────────────────────────────────────────────────────────────
      const handleButton = React.useCallback((btn) => {
          const toks = tokensRef.current;
          const idx = activeTokenIdxRef.current;
          const defVisible = showDefRef.current;
          // Helper to calculate token center coordinates
          const getCenter = (tIdx) => {
              const rects = tokenRectsListRef.current[tIdx];
              if (!rects || !rects.length)
                  return null;
              let sumX = 0, sumY = 0;
              rects.forEach(r => {
                  sumX += r.left + r.width / 2;
                  sumY += r.top + r.height / 2;
              });
              return { x: sumX / rects.length, y: sumY / rects.length };
          };
          const currentCenter = idx !== null ? getCenter(idx) : null;
          const findSpatialToken = (dir) => {
              if (idx === null || !currentCenter)
                  return null;
              let bestIdx = null;
              let minCost = Infinity;
              for (let j = 0; j < toks.length; j++) {
                  if (j === idx)
                      continue;
                  const center = getCenter(j);
                  if (!center)
                      continue;
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
                  }
                  else if (dir === "DOWN") {
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
              case "DPAD_LEFT":
              case "ArrowLeft":
                  if (toks.length && idx !== null) {
                      const n = (idx - 1 + toks.length) % toks.length;
                      setActiveTokenIdx(n);
                      activeTokenIdxRef.current = n;
                      setSaveStatus(null);
                  }
                  break;
              case "DPAD_RIGHT":
              case "ArrowRight":
                  if (toks.length && idx !== null) {
                      const n = (idx + 1) % toks.length;
                      setActiveTokenIdx(n);
                      activeTokenIdxRef.current = n;
                      setSaveStatus(null);
                  }
                  break;
              case "DPAD_UP":
              case "ArrowUp":
                  if (toks.length && idx !== null) {
                      const target = findSpatialToken("UP");
                      if (target !== null) {
                          setActiveTokenIdx(target);
                          activeTokenIdxRef.current = target;
                          setSaveStatus(null);
                      }
                  }
                  break;
              case "DPAD_DOWN":
              case "ArrowDown":
                  if (toks.length && idx !== null) {
                      const target = findSpatialToken("DOWN");
                      if (target !== null) {
                          setActiveTokenIdx(target);
                          activeTokenIdxRef.current = target;
                          setSaveStatus(null);
                      }
                  }
                  break;
              case "A":
              case "Enter":
                  if (defVisible) {
                      // A while definition is open = save
                      handleSaveWordRef.current();
                  }
                  else {
                      // A while navigating tokens = open definition
                      setShowDef(true);
                      showDefRef.current = true;
                      setSaveStatus(null);
                  }
                  break;
              case "X":
              case "x":
              case "Escape":
                  if (defVisible) {
                      // X or Escape closes definition popup only — never the overlay
                      setShowDef(false);
                      showDefRef.current = false;
                      setSaveStatus(null);
                  }
                  break;
          }
      }, []);
      const handleButtonRef = React.useRef(handleButton);
      React.useEffect(() => { handleButtonRef.current = handleButton; }, [handleButton]);
      // Poll hidraw nav input (primary — works in GamepadUI)
      React.useEffect(() => {
          if (!isActive)
              return;
          let alive = true;
          const poll = async () => {
              if (!alive)
                  return;
              try {
                  const r = await serverApi.callPluginMethod("poll_nav_input", {});
                  const res = r.result;
                  if (r.success && res?.button)
                      handleButtonRef.current(res.button);
              }
              catch { }
              if (alive)
                  setTimeout(poll, 100);
          };
          poll();
          return () => { alive = false; };
      }, [isActive]);
      // Keyboard fallback + capture event blocking to prevent Steam navigation
      React.useEffect(() => {
          if (!isActive)
              return;
          const onKey = (e) => {
              if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape", "x", "X"].includes(e.key)) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleButtonRef.current(e.key);
              }
          };
          const targets = [];
          [activeWindow, displayWindow].forEach(w => {
              if (w) {
                  targets.push(w);
                  if (w.document)
                      targets.push(w.document);
              }
          });
          [...new Set(targets)].forEach(t => {
              try {
                  t.addEventListener("keydown", onKey, true);
              }
              catch { }
          });
          if (containerRef.current)
              containerRef.current.focus();
          return () => {
              [...new Set(targets)].forEach(t => {
                  try {
                      t.removeEventListener("keydown", onKey, true);
                  }
                  catch { }
              });
          };
      }, [isActive]);
      // Deactivate/Reactively pause Steam navigation controller
      React.useEffect(() => {
          if (!isActive)
              return;
          const deactivatedTreesSet = new Set();
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
                  uniqueWindows.forEach((win) => {
                      try {
                          const focusNav = win.GamepadNavTree?.m_context?.m_controller || win.FocusNavController;
                          if (!focusNav)
                              return;
                          const contexts = [focusNav.m_ActiveContext, focusNav.m_LastActiveContext].filter(Boolean);
                          contexts.forEach((context) => {
                              const rgTrees = context?.m_rgGamepadNavigationTrees || [];
                              rgTrees.forEach((tree) => {
                                  if (tree && !deactivatedTreesSet.has(tree)) {
                                      const isTreeActive = tree.m_bActive || tree.m_bActive === undefined;
                                      if (isTreeActive) {
                                          if (typeof tree.SetActive === 'function') {
                                              tree.SetActive(false);
                                          }
                                          else {
                                              tree.m_bActive = false;
                                          }
                                          deactivatedTreesSet.add(tree);
                                      }
                                  }
                              });
                          });
                      }
                      catch (e) {
                          console.error("[Overlay] Error disabling trees on window:", e);
                      }
                  });
              }
              catch (e) {
                  console.error("[Overlay] Error in disableTrees outer block:", e);
              }
          };
          disableTrees();
          const interval = setInterval(disableTrees, 400);
          return () => {
              clearInterval(interval);
              try {
                  deactivatedTreesSet.forEach((tree) => {
                      if (tree) {
                          if (typeof tree.SetActive === 'function') {
                              tree.SetActive(true);
                          }
                          else {
                              tree.m_bActive = true;
                          }
                      }
                  });
                  console.log(`[Overlay] Restored ${deactivatedTreesSet.size} navigation trees.`);
              }
              catch (e) {
                  console.error("[Overlay] Error restoring trees:", e);
              }
          };
      }, [isActive, activeWindow, displayWindow]);
      // Overriding navigator.getGamepads to pause Steam UI input
      React.useEffect(() => {
          if (!isActive)
              return;
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
          const originalGetGamepadsMap = new Map();
          uniqueWindows.forEach((win) => {
              try {
                  if (win.navigator && win.navigator.getGamepads) {
                      const original = win.navigator.getGamepads;
                      originalGetGamepadsMap.set(win, original);
                      Object.defineProperty(win.navigator, 'getGamepads', {
                          value: function () {
                              try {
                                  const gps = original.call(win.navigator);
                                  if (!gps)
                                      return [];
                                  return Array.from(gps).map((gp) => {
                                      if (!gp)
                                          return null;
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
                              }
                              catch {
                                  return [];
                              }
                          },
                          configurable: true,
                          writable: true
                      });
                  }
              }
              catch (e) {
                  console.error("[Overlay] Failed to override navigator.getGamepads on window:", e);
              }
          });
          return () => {
              console.log("[Overlay] Restoring Steam UI gamepad input...");
              originalGetGamepadsMap.forEach((original, win) => {
                  try {
                      Object.defineProperty(win.navigator, 'getGamepads', {
                          value: original,
                          configurable: true,
                          writable: true
                      });
                  }
                  catch (e) {
                      try {
                          win.navigator.getGamepads = original;
                      }
                      catch { }
                  }
              });
          };
      }, [isActive, activeWindow, displayWindow]);
      const containerRef = React.useRef(null);
      // ── Coordinate scaling & token mappings ──────────────────────────────────────
      const scaleX = displayWindow.innerWidth / screenshotWidth;
      const scaleY = displayWindow.innerHeight / screenshotHeight;
      const sortedBoxes = React.useMemo(() => {
          return sortBoxes(boxes);
      }, [boxes]);
      const combinedText = React.useMemo(() => {
          return sortedBoxes.map(b => b.text).join("");
      }, [sortedBoxes]);
      const charToBoxMap = React.useMemo(() => {
          const mapping = [];
          sortedBoxes.forEach((box, boxIdx) => {
              for (let i = 0; i < box.text.length; i++) {
                  mapping.push({ boxIdx, charIdxInBox: i });
              }
          });
          return mapping;
      }, [sortedBoxes]);
      const tokenSpans = React.useMemo(() => {
          let cur = 0;
          return tokens.map(tok => {
              const idx = combinedText.indexOf(tok.surface, cur);
              if (idx !== -1) {
                  const span = { start: idx, end: idx + tok.surface.length - 1 };
                  cur = idx + tok.surface.length;
                  return span;
              }
              else {
                  const span = { start: cur, end: cur + tok.surface.length - 1 };
                  cur += tok.surface.length;
                  return span;
              }
          });
      }, [tokens, combinedText]);
      const tokenRectsList = React.useMemo(() => {
          const list = [];
          tokenSpans.forEach(span => {
              const rects = [];
              const boxSpans = {};
              for (let idx = span.start; idx <= span.end; idx++) {
                  if (idx < 0 || idx >= charToBoxMap.length)
                      continue;
                  const { boxIdx, charIdxInBox } = charToBoxMap[idx];
                  if (boxSpans[boxIdx] === undefined) {
                      boxSpans[boxIdx] = { minIdx: charIdxInBox, maxIdx: charIdxInBox };
                  }
                  else {
                      boxSpans[boxIdx].minIdx = Math.min(boxSpans[boxIdx].minIdx, charIdxInBox);
                      boxSpans[boxIdx].maxIdx = Math.max(boxSpans[boxIdx].maxIdx, charIdxInBox);
                  }
              }
              Object.keys(boxSpans).forEach(boxIdxStr => {
                  const boxIdx = parseInt(boxIdxStr, 10);
                  const box = sortedBoxes[boxIdx];
                  const bSpan = boxSpans[boxIdx];
                  const xs = box.box.map(p => p[0]), ys = box.box.map(p => p[1]);
                  const left = Math.min(...xs) * scaleX;
                  const top = Math.min(...ys) * scaleY;
                  const width = (Math.max(...xs) - Math.min(...xs)) * scaleX;
                  const height = (Math.max(...ys) - Math.min(...ys)) * scaleY;
                  const L = box.text.length;
                  if (L <= 0)
                      return;
                  const isVertical = height > width;
                  if (isVertical) {
                      const charHeight = height / L;
                      const subTop = top + bSpan.minIdx * charHeight;
                      const subHeight = (bSpan.maxIdx - bSpan.minIdx + 1) * charHeight;
                      rects.push({ left, top: subTop, width, height: subHeight });
                  }
                  else {
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
      React.useEffect(() => {
          tokenRectsListRef.current = tokenRectsList;
      }, [tokenRectsList]);
      // ─────────────────────────────────────────────────────────────────────────────
      // Render
      // ─────────────────────────────────────────────────────────────────────────────
      if (!isActive) {
          return (React__default["default"].createElement("div", { style: {
                  position: "fixed", top: 8, right: 16,
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                  padding: "3px 10px", borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600,
                  zIndex: 999999, pointerEvents: "none",
                  display: "flex", alignItems: "center", gap: 6
              } },
              React__default["default"].createElement("div", { style: { width: 5, height: 5, borderRadius: "50%", background: "#64748b" } }),
              "OCR READY"));
      }
      const activeTok = (activeTokenIdx !== null && tokens.length > 0) ? tokens[activeTokenIdx] : null;
      return (React__default["default"].createElement("div", { ref: containerRef, id: "decky-ocr-overlay-container", tabIndex: 0, style: {
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              fontFamily: "Inter, 'Noto Sans JP', sans-serif",
              outline: "none", userSelect: "none", pointerEvents: "auto"
          } },
          React__default["default"].createElement("style", { dangerouslySetInnerHTML: { __html: `
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
      ` } }),
          isScanLoading && (React__default["default"].createElement("div", { style: {
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12
              } },
              React__default["default"].createElement("div", { style: {
                      width: 44, height: 44,
                      border: "3px solid rgba(255,255,255,0.1)",
                      borderTop: "3px solid #facc15",
                      borderRadius: "50%", animation: "spin 0.9s linear infinite"
                  } }),
              React__default["default"].createElement("span", { style: { fontSize: 13, opacity: 0.7 } }, "Scanning\u2026"))),
          errorMessage && (React__default["default"].createElement("div", { style: {
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  background: "rgba(200,30,30,0.9)", backdropFilter: "blur(8px)",
                  padding: "14px 22px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  textAlign: "center"
              } },
              React__default["default"].createElement("div", { style: { marginBottom: 10 } }, errorMessage),
              React__default["default"].createElement("button", { onClick: deactivate, style: {
                      background: "#fff", color: "#b91c1c",
                      border: "none", padding: "5px 14px",
                      borderRadius: 6, fontWeight: "bold", cursor: "pointer"
                  } }, "Close"))),
          !isScanLoading && !errorMessage && tokens.length === 0 && sortedBoxes.map((item, i) => {
              const xs = item.box.map(p => p[0]), ys = item.box.map(p => p[1]);
              const left = Math.min(...xs) * scaleX;
              const top = Math.min(...ys) * scaleY;
              const width = (Math.max(...xs) - Math.min(...xs)) * scaleX;
              const height = (Math.max(...ys) - Math.min(...ys)) * scaleY;
              return (React__default["default"].createElement("div", { key: i, style: {
                      position: "absolute", left, top, width, height,
                      border: "1.5px solid rgba(250,204,21,0.45)",
                      borderRadius: 3,
                      background: "rgba(250,204,21,0.03)",
                      pointerEvents: "none"
                  } }));
          }),
          !isScanLoading && !errorMessage && tokenRectsList.map((rects, tokenIdx) => {
              const isActive = tokenIdx === activeTokenIdx;
              return rects.map((r, rectIdx) => (React__default["default"].createElement("div", { key: `${tokenIdx}-${rectIdx}`, style: {
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
                  } })));
          }),
          isTokenizing && (React__default["default"].createElement("div", { style: {
                  position: "absolute", bottom: 32, left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(15, 15, 27, 0.85)",
                  backdropFilter: "blur(10px)",
                  padding: "10px 18px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  zIndex: 999
              } },
              React__default["default"].createElement("div", { style: {
                      width: 16, height: 16,
                      border: "2px solid rgba(255,255,255,0.2)",
                      borderTop: "2px solid #facc15",
                      borderRadius: "50%", animation: "spin 0.8s linear infinite"
                  } }),
              React__default["default"].createElement("span", { style: { fontSize: 13, color: "#fff" } }, "Tokenizing\u2026"))),
          !isScanLoading && !errorMessage && !showDef && tokens.length > 0 && (React__default["default"].createElement("div", { style: {
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
              } },
              React__default["default"].createElement("span", null, "D-pad \u25C0 \u25B6 to navigate"),
              React__default["default"].createElement("span", { style: { opacity: 0.3 } }, "|"),
              React__default["default"].createElement("span", null, "A to define"))),
          showDef && activeTok && (React__default["default"].createElement("div", { style: {
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
              } },
              React__default["default"].createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" } },
                  React__default["default"].createElement("span", { style: { fontSize: 28, fontWeight: 700, color: "#fff" } }, activeTok.base),
                  activeTok.reading && activeTok.reading !== "*" && (React__default["default"].createElement("span", { style: { fontSize: 16, color: "#fde68a", fontWeight: 600 } },
                      "[",
                      activeTok.reading,
                      "]")),
                  activeTok.pos && (React__default["default"].createElement("span", { style: {
                          fontSize: 11,
                          color: "rgba(255,255,255,0.7)",
                          background: "rgba(255,255,255,0.12)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontWeight: 500
                      } }, String(activeTok.pos).split(",")[0]))),
              activeTok.definitions.length === 0 ? (React__default["default"].createElement("div", { style: { opacity: 0.5, fontStyle: "italic", fontSize: 13, color: "#cbd5e1", margin: "8px 0" } }, "No dictionary entries found.")) : activeTok.definitions.slice(0, 3).map((def, i) => {
                  let defs = [];
                  try {
                      const p = JSON.parse(def.definition);
                      defs = Array.isArray(p)
                          ? p.map((d) => typeof d === "string" ? d : JSON.stringify(d))
                          : [String(p)];
                  }
                  catch {
                      defs = [String(def.definition)];
                  }
                  return (React__default["default"].createElement("div", { key: i, style: {
                          marginTop: i > 0 ? 10 : 0,
                          paddingTop: i > 0 ? 10 : 0,
                          borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none"
                      } },
                      React__default["default"].createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } },
                          React__default["default"].createElement("span", { style: { fontSize: 12, color: "#fde68a", fontWeight: 600 } },
                              def.expression,
                              " \u00B7 ",
                              def.reading),
                          React__default["default"].createElement("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.4)" } }, def.dictionary)),
                      React__default["default"].createElement("ol", { style: { margin: 0, paddingLeft: 18, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 } }, defs.map((d, j) => React__default["default"].createElement("li", { key: j }, String(d))))));
              }),
              React__default["default"].createElement("div", { style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 14,
                      paddingTop: 10,
                      borderTop: "1px solid rgba(255,255,255,0.08)"
                  } },
                  React__default["default"].createElement("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.4)" } }, "X \u2014 close \u00B7 A \u2014 save"),
                  React__default["default"].createElement("button", { onClick: () => handleSaveWordRef.current(), disabled: saveStatus === "saving" || saveStatus === "saved", style: {
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
                      } }, saveStatus === "saving" ? "Saving…" :
                      saveStatus === "saved" ? "✓ Saved" :
                          saveStatus === "error" ? "Error" : "Save")))),
          React__default["default"].createElement("style", { dangerouslySetInnerHTML: { __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      ` } })));
  };

  const Settings = ({ serverApi }) => {
      const [installStatus, setInstallStatus] = React.useState("idle");
      const [installLog, setInstallLog] = React.useState("");
      const [dictPath, setDictPath] = React.useState("/home/deck/Downloads/JMdict_english.zip");
      const [dictList, setDictList] = React.useState([]);
      const [vocabCount, setVocabCount] = React.useState(0);
      const [activeView, setActiveView] = React.useState("dashboard");
      const [vocabList, setVocabList] = React.useState([]);
      const [importProgress, setImportProgress] = React.useState({
          status: "idle",
          progress: 0,
          message: ""
      });
      const [importLog, setImportLog] = React.useState("");
      const [ocrLog, setOcrLog] = React.useState("");
      const [ocrDebugMode, setOcrDebugMode] = React.useState(false);
      // Hotkey state
      const [hotkeyDevice, setHotkeyDevice] = React.useState("");
      const [hotkeyKeycode, setHotkeyKeycode] = React.useState(-1);
      const [hotkeyLearning, setHotkeyLearning] = React.useState(false);
      const [hotkeyStatus, setHotkeyStatus] = React.useState("");
      const [hotkeyDiagLog, setHotkeyDiagLog] = React.useState("");
      const [needsInputSetup, setNeedsInputSetup] = React.useState(false);
      // Portal target ref and state to render the overlay in the QuickAccess window
      const settingsRef = React.useRef(null);
      const dummyFocusRef = React.useRef(null);
      const [portalTarget, setPortalTarget] = React.useState(null);
      const [isOverlayActive, setIsOverlayActive] = React.useState(false);
      React.useEffect(() => {
          if (settingsRef.current) {
              try {
                  const sp = deckyFrontendLib.findSP();
                  if (sp && sp.document) {
                      setPortalTarget(sp.document.body);
                  }
                  else {
                      setPortalTarget(settingsRef.current.ownerDocument.body);
                  }
              }
              catch (e) {
                  console.error("[Settings] findSP failed, falling back to QAM body:", e);
                  setPortalTarget(settingsRef.current.ownerDocument.body);
              }
          }
      }, []);
      // Keep focus locked inside settings/overlay and block navigation keys when overlay is active to prevent moving to QAM tabs
      React.useEffect(() => {
          if (!isOverlayActive)
              return;
          let parentDoc = null;
          try {
              const sp = deckyFrontendLib.findSP();
              if (sp && sp.document) {
                  parentDoc = sp.document;
              }
          }
          catch (e) {
              console.error("[Settings] findSP failed in focus hook:", e);
          }
          if (!parentDoc && portalTarget && portalTarget.ownerDocument) {
              parentDoc = portalTarget.ownerDocument;
          }
          if (!parentDoc) {
              parentDoc = settingsRef.current?.ownerDocument || document;
          }
          const localDoc = settingsRef.current?.ownerDocument || document;
          const handleFocusCheck = (e) => {
              if (!isOverlayActive)
                  return;
              const overlayContainer = parentDoc?.getElementById("decky-ocr-overlay-container");
              // 1. If focus is going to an element inside the overlay, let it happen!
              if (e && e.target && overlayContainer && (e.target === overlayContainer || overlayContainer.contains(e.target))) {
                  return;
              }
              // 2. If the current active element in the parent document is inside the overlay, let it be!
              if (parentDoc) {
                  const activeEl = parentDoc.activeElement;
                  if (overlayContainer && (activeEl === overlayContainer || overlayContainer.contains(activeEl))) {
                      return;
                  }
              }
              // 3. Otherwise, focus has escaped! Redirect it back to the overlay container (or the dummy element)
              if (overlayContainer) {
                  overlayContainer.focus();
              }
              else if (dummyFocusRef.current) {
                  dummyFocusRef.current.focus();
              }
          };
          // Block keyboard/gamepad navigation and select events in the capture phase
          const handleKeyCapture = (e) => {
              const keysToBlock = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Enter", " "];
              if (keysToBlock.includes(e.key)) {
                  e.preventDefault();
                  e.stopPropagation();
              }
          };
          // Set initial focus
          const initialOverlay = parentDoc?.getElementById("decky-ocr-overlay-container");
          if (initialOverlay) {
              initialOverlay.focus();
          }
          else if (dummyFocusRef.current) {
              dummyFocusRef.current.focus();
          }
          // Register capture-phase focus listeners on both local and parent documents!
          const docs = Array.from(new Set([parentDoc, localDoc].filter(Boolean)));
          docs.forEach(d => {
              d.addEventListener("focusin", handleFocusCheck, true);
          });
          const interval = setInterval(() => handleFocusCheck(), 100);
          // Register key capture on all relevant windows (parent SP window, portal target window, and local iframe window)
          const windows = [];
          try {
              const sp = deckyFrontendLib.findSP();
              if (sp && sp.document && sp.document.defaultView) {
                  windows.push(sp.document.defaultView);
              }
          }
          catch (err) {
              console.error("[Settings] Failed to find SP window:", err);
          }
          if (portalTarget && portalTarget.ownerDocument && portalTarget.ownerDocument.defaultView) {
              const pWin = portalTarget.ownerDocument.defaultView;
              if (!windows.includes(pWin))
                  windows.push(pWin);
          }
          if (localDoc && localDoc.defaultView) {
              const lWin = localDoc.defaultView;
              if (!windows.includes(lWin))
                  windows.push(lWin);
          }
          windows.forEach(win => {
              win.addEventListener("keydown", handleKeyCapture, true);
              win.addEventListener("keyup", handleKeyCapture, true);
              win.addEventListener("keypress", handleKeyCapture, true);
          });
          return () => {
              docs.forEach(d => {
                  d.removeEventListener("focusin", handleFocusCheck, true);
              });
              clearInterval(interval);
              windows.forEach(win => {
                  win.removeEventListener("keydown", handleKeyCapture, true);
                  win.removeEventListener("keyup", handleKeyCapture, true);
                  win.removeEventListener("keypress", handleKeyCapture, true);
              });
          };
      }, [isOverlayActive, portalTarget]);
      // Poll installation status on load
      React.useEffect(() => {
          let timer;
          const checkStatus = async () => {
              try {
                  const response = await serverApi.callPluginMethod("get_install_status", {});
                  if (response.success && response.result) {
                      const result = response.result;
                      setInstallStatus(result.status);
                      setInstallLog(result.log);
                      if (result.status === "installing") {
                          timer = setTimeout(checkStatus, 1500);
                      }
                  }
              }
              catch (err) {
                  console.error(err);
              }
          };
          checkStatus();
          fetchDictionaries();
          fetchVocabList();
          fetchHotkeyConfig();
          return () => {
              if (timer)
                  clearTimeout(timer);
          };
      }, []);
      // Effect to hide/disable/defuse the QAM back button and other outside elements (like tabs) when overlay is active
      React.useEffect(() => {
          if (!isOverlayActive)
              return;
          let parentDoc = null;
          try {
              const sp = deckyFrontendLib.findSP();
              if (sp && sp.document) {
                  parentDoc = sp.document;
              }
          }
          catch (e) {
              console.error("[Settings] findSP failed in hook:", e);
          }
          if (!parentDoc && portalTarget && portalTarget.ownerDocument) {
              parentDoc = portalTarget.ownerDocument;
          }
          if (!parentDoc) {
              parentDoc = settingsRef.current?.ownerDocument || document;
          }
          const localDoc = settingsRef.current?.ownerDocument || document;
          const docsToProcess = Array.from(new Set([parentDoc, localDoc].filter(Boolean)));
          const originalAttrs = new Map();
          const defuseOutsideElements = () => {
              try {
                  const settingsEl = settingsRef.current;
                  if (!settingsEl)
                      return;
                  docsToProcess.forEach(doc => {
                      const myIframe = (localDoc.defaultView || window).frameElement;
                      const overlayContainer = doc.getElementById("decky-ocr-overlay-container");
                      // Query focusable elements, inputs, tab items, sidebar items
                      const focusables = doc.querySelectorAll(".Focusable, button, input, select, textarea, a, [tabindex='0'], [class*=\"tab\"], [class*=\"Tab\"], [class*=\"TabBar\"], [class*=\"tabbar\"], [class*=\"Sidebar\"], [class*=\"sidebar\"]");
                      for (const el of Array.from(focusables)) {
                          // Check tag name to avoid disabling body, html, or iframes
                          const tagName = el.tagName.toUpperCase();
                          if (tagName === "BODY" || tagName === "HTML" || tagName === "IFRAME") {
                              continue;
                          }
                          // If it's the iframe container element itself, don't disable it
                          if (myIframe && el === myIframe) {
                              continue;
                          }
                          // If it is our void focus dummy, don't disable it
                          if (el.id === "decky-ocr-void-focus") {
                              continue;
                          }
                          // If it is inside our settings menu, don't disable it
                          if (doc === localDoc && settingsEl.contains(el)) {
                              continue;
                          }
                          // If it is the overlay or inside the overlay, do NOT defuse it
                          if (overlayContainer && (el === overlayContainer || overlayContainer.contains(el))) {
                              continue;
                          }
                          // Backup original attributes if not already saved
                          if (!originalAttrs.has(el)) {
                              const classNameStr = typeof el.className === "string" ? el.className : el.getAttribute("class") || "";
                              originalAttrs.set(el, {
                                  disabled: el.getAttribute("disabled"),
                                  tabIndex: el.getAttribute("tabindex"),
                                  className: classNameStr,
                                  style: el.getAttribute("style") || "",
                                  doc
                              });
                          }
                          // Apply defusing modifications
                          if (el.getAttribute("tabindex") !== "-1") {
                              el.setAttribute("tabindex", "-1");
                          }
                          if (el.classList.contains("Focusable")) {
                              el.classList.remove("Focusable");
                          }
                          if (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
                              if (el.getAttribute("disabled") !== "true") {
                                  el.setAttribute("disabled", "true");
                              }
                          }
                          // Disable all pointer & touch events
                          const htmlEl = el;
                          if (htmlEl.style) {
                              htmlEl.style.pointerEvents = "none";
                          }
                          if (doc.activeElement === el) {
                              htmlEl.blur();
                          }
                      }
                  });
              }
              catch (e) {
                  console.error("[Settings] Error defusing outside elements:", e);
              }
          };
          // Run immediately
          defuseOutsideElements();
          // Poll periodically in case of Steam UI re-renders
          const interval = setInterval(defuseOutsideElements, 200);
          return () => {
              clearInterval(interval);
              // Restore original state of any elements we modified
              try {
                  originalAttrs.forEach((attrs, el) => {
                      if (el && attrs.doc.contains(el)) {
                          if (attrs.disabled !== null) {
                              el.setAttribute("disabled", attrs.disabled);
                          }
                          else {
                              el.removeAttribute("disabled");
                          }
                          if (attrs.tabIndex !== null) {
                              el.setAttribute("tabindex", attrs.tabIndex);
                          }
                          else {
                              el.removeAttribute("tabindex");
                          }
                          if (typeof el.className === "string") {
                              el.className = attrs.className;
                          }
                          else {
                              el.setAttribute("class", attrs.className);
                          }
                          el.setAttribute("style", attrs.style);
                      }
                  });
              }
              catch (e) {
                  console.error("[Settings] Error restoring outside elements:", e);
              }
          };
      }, [isOverlayActive, portalTarget]);
      const fetchDictionaries = async () => {
          try {
              const response = await serverApi.callPluginMethod("list_dictionaries", {});
              const result = response.result;
              if (response.success && result && result.status === "success") {
                  setDictList(result.dictionaries);
              }
          }
          catch (err) {
              console.error(err);
          }
      };
      const fetchVocabList = async () => {
          try {
              const response = await serverApi.callPluginMethod("get_vocab_list", {});
              const result = response.result;
              if (response.success && result && result.status === "success") {
                  setVocabList(result.vocab);
                  setVocabCount(result.vocab.length);
              }
          }
          catch (err) {
              console.error(err);
          }
      };
      const fetchHotkeyConfig = async () => {
          try {
              const res = await serverApi.callPluginMethod("get_hotkey_config", {});
              if (res.success && res.result) {
                  const r = res.result;
                  setHotkeyDevice(r.device || "");
                  setHotkeyKeycode(r.keycode ?? -1);
              }
          }
          catch (err) {
              console.error(err);
          }
      };
      const handleLearnHotkey = async () => {
          setHotkeyStatus("Waiting for button press... (15s)");
          setHotkeyLearning(true);
          try {
              await serverApi.callPluginMethod("start_hotkey_learn", {});
          }
          catch (e) {
              setHotkeyStatus("Failed to start learn mode.");
              setHotkeyLearning(false);
              return;
          }
          // Poll until result arrives or timeout
          const poll = async () => {
              try {
                  const res = await serverApi.callPluginMethod("get_hotkey_learn_result", {});
                  const r = res.result;
                  if (r.result) {
                      // Got a result — save it
                      await serverApi.callPluginMethod("save_hotkey", { device: r.result.device, keycode: r.result.keycode });
                      setHotkeyDevice(r.result.device);
                      setHotkeyKeycode(r.result.keycode);
                      setHotkeyStatus("Hotkey saved! ✓");
                      setHotkeyLearning(false);
                      // Show learn log for transparency
                      if (r.log && r.log.length > 0)
                          setHotkeyDiagLog(r.log.join("\n"));
                      setTimeout(() => setHotkeyStatus(""), 3000);
                  }
                  else if (r.active) {
                      setTimeout(poll, 500);
                  }
                  else {
                      // Timed out — show the session log so user can see what happened
                      const logText = r.log && r.log.length > 0 ? r.log.join("\n") : "(no log)";
                      setHotkeyDiagLog(logText);
                      setHotkeyStatus("Timed out — no button detected. See log below.");
                      setHotkeyLearning(false);
                  }
              }
              catch (e) {
                  setHotkeyStatus("Poll error.");
                  setHotkeyLearning(false);
              }
          };
          setTimeout(poll, 500);
      };
      const handleClearHotkey = async () => {
          try {
              await serverApi.callPluginMethod("clear_hotkey", {});
              setHotkeyDevice("");
              setHotkeyKeycode(-1);
              setHotkeyStatus("Hotkey cleared.");
              setTimeout(() => setHotkeyStatus(""), 2000);
          }
          catch (e) {
              console.error(e);
          }
      };
      const handleDiagnose = async () => {
          setHotkeyDiagLog("Running diagnosis...");
          try {
              const res = await serverApi.callPluginMethod("diagnose_hotkey", {});
              if (res.success && res.result) {
                  const r = res.result;
                  setHotkeyDiagLog(r.log || "(empty)");
                  // Detect permission issue: UID != 0 and key devices blocked
                  const accessible = r.accessible || [];
                  const hasEvent5 = accessible.some((d) => d.includes("event5"));
                  const hasEvent8 = accessible.some((d) => d.includes("event8"));
                  if (r.uid !== 0 && (!hasEvent5 || !hasEvent8)) {
                      setNeedsInputSetup(true);
                  }
                  else {
                      setNeedsInputSetup(false);
                  }
              }
              else {
                  setHotkeyDiagLog("RPC failed.");
              }
          }
          catch (e) {
              setHotkeyDiagLog("Error: " + String(e));
          }
      };
      const fetchOcrLog = async () => {
          try {
              const res = await serverApi.callPluginMethod("get_ocr_log", {});
              if (res.success && res.result) {
                  setOcrLog(res.result.log || "(empty)");
              }
              else {
                  setOcrLog("Could not fetch OCR log.");
              }
          }
          catch (e) {
              setOcrLog("Error: " + String(e));
          }
      };
      const handleTriggerOCR = () => {
          deckyFrontendLib.Navigation.CloseSideMenus();
          setOcrLog("Sidebar closing (600ms)...");
          setTimeout(async () => {
              setOcrLog(prev => prev + "\nTriggering OCR request on backend...");
              try {
                  await serverApi.callPluginMethod("trigger_ocr_request", {});
              }
              catch (e) {
                  setOcrLog(prev => prev + "\nRPC Trigger failed: " + String(e));
              }
              // Fetch the backend log 2.5s later so capture_screen has time to finish
              setTimeout(fetchOcrLog, 2500);
          }, 600);
      };
      // Debug: call capture_screen directly without closing the sidebar,
      // so we can see the full error from the backend even in Settings view.
      const handleDebugCapture = async () => {
          setOcrLog("Calling capture_screen directly...");
          try {
              const spKeys = Object.keys(window.SP_REACTDOM || {});
              const rdKeys = Object.keys(window.ReactDOM || {});
              const globalKeys = Object.keys(window);
              setOcrLog(prev => prev + `\nSP_REACTDOM keys: ${JSON.stringify(spKeys)}\nReactDOM keys: ${JSON.stringify(rdKeys)}\nHas SP_REACTDOM: ${typeof window.SP_REACTDOM}\nHas ReactDOM: ${typeof window.ReactDOM}`);
          }
          catch (e) {
              setOcrLog(prev => prev + "\nError inspecting React DOM: " + String(e));
          }
          try {
              const res = await serverApi.callPluginMethod("capture_screen", {});
              const result = res.result;
              setOcrLog(prev => prev + "\nRPC result: " + JSON.stringify(result, null, 2));
          }
          catch (e) {
              setOcrLog(prev => prev + "\nRPC error: " + String(e));
          }
          await fetchOcrLog();
      };
      const handleImportDictionary = async () => {
          if (!dictPath) {
              setImportProgress({
                  status: "error",
                  progress: 0,
                  message: "Please enter a valid path to a Yomichan ZIP dictionary."
              });
              return;
          }
          setImportProgress({
              status: "importing",
              progress: 0,
              message: "Starting import..."
          });
          try {
              const response = await serverApi.callPluginMethod("import_dictionary", { zip_path: dictPath });
              const result = response.result;
              if (response.success && result && result.status === "success") {
                  const interval = setInterval(async () => {
                      try {
                          const progResponse = await serverApi.callPluginMethod("get_import_progress", {});
                          if (progResponse.success && progResponse.result) {
                              const progressResult = progResponse.result;
                              setImportProgress(progressResult);
                              if (progressResult.status === "success" || progressResult.status === "error") {
                                  clearInterval(interval);
                                  fetchDictionaries();
                                  setTimeout(() => {
                                      setImportProgress(p => p.status === progressResult.status ? { ...p, status: "idle" } : p);
                                  }, 5000);
                              }
                          }
                      }
                      catch (pollErr) {
                          console.error(pollErr);
                          clearInterval(interval);
                      }
                  }, 500);
              }
              else {
                  setImportProgress({
                      status: "error",
                      progress: 0,
                      message: "Import failed: " + (result?.message || "Verify file path.")
                  });
              }
          }
          catch (err) {
              setImportProgress({
                  status: "error",
                  progress: 0,
                  message: "Failed to initiate import."
              });
              console.error(err);
          }
      };
      const handleViewLog = async () => {
          try {
              const response = await serverApi.callPluginMethod("get_import_log", {});
              if (response.success && response.result) {
                  const result = response.result;
                  setImportLog(result.log || "(empty log)");
              }
              else {
                  setImportLog("Could not fetch log.");
              }
          }
          catch (err) {
              setImportLog("Error fetching log: " + String(err));
          }
      };
      const handleDeleteDict = async (name) => {
          try {
              const response = await serverApi.callPluginMethod("delete_dictionary", { name });
              const result = response.result;
              if (response.success && result?.status === "success") {
                  fetchDictionaries();
              }
          }
          catch (err) {
              console.error(err);
          }
      };
      const handleOpenVocabView = () => {
          fetchVocabList();
          setActiveView("vocab");
      };
      const handleDeleteVocabItem = async (id) => {
          try {
              const response = await serverApi.callPluginMethod("delete_vocab_item", { item_id: id });
              const result = response.result;
              if (response.success && result?.status === "success") {
                  fetchVocabList();
              }
          }
          catch (err) {
              console.error(err);
          }
      };
      const handleForceReinstall = async () => {
          setInstallStatus("installing");
          setInstallLog("Forcing reinstallation...\n");
          try {
              // Trigger clean installation in Python backend
              await serverApi.callPluginMethod("force_reinstall", {});
              // Start polling
              setTimeout(async function poll() {
                  const response = await serverApi.callPluginMethod("get_install_status", {});
                  if (response.success && response.result) {
                      const result = response.result;
                      setInstallStatus(result.status);
                      setInstallLog(result.log);
                      if (result.status === "installing") {
                          setTimeout(poll, 1500);
                      }
                  }
              }, 1000);
          }
          catch (err) {
              console.error(err);
          }
      };
      // 1. Loading / Installer Screen
      if (installStatus === "installing") {
          return (React__default["default"].createElement(deckyFrontendLib.PanelSection, { title: "Dependencies" },
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: "12px" } },
                      React__default["default"].createElement("div", { className: "spinner", style: { width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" } }),
                      React__default["default"].createElement("div", { style: { fontSize: "14px", fontWeight: "bold", textAlign: "center" } }, "Installing OCR & NLP Engines..."),
                      React__default["default"].createElement("div", { style: { fontSize: "11px", opacity: 0.6, textAlign: "center" } }, "This runs offline once in background. Keep Steam Deck awake."))),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { background: "#111", padding: "8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "10px", maxHeight: "150px", overflowY: "auto", whiteSpace: "pre-wrap", color: "#65a30d" } }, installLog)),
              React__default["default"].createElement("style", { dangerouslySetInnerHTML: { __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` } })));
      }
      // 2. Error Screen
      if (installStatus === "error") {
          return (React__default["default"].createElement(deckyFrontendLib.PanelSection, { title: "Dependencies Error" },
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { padding: "8px 0", color: "#f87171", fontSize: "13px" } }, "Failed to download Python dependencies. Make sure you are connected to the internet and click Retry.")),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement(deckyFrontendLib.ButtonItem, { onClick: handleForceReinstall }, "Retry Installation")),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { background: "#111", padding: "8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "9px", maxHeight: "150px", overflowY: "auto", whiteSpace: "pre-wrap", color: "#ef4444" } }, installLog))));
      }
      // 2.5. Void Screen when Overlay is active (handled inside main return block to prevent unmounting Portal)
      // 3. Ready Dashboard Screen
      return (React__default["default"].createElement("div", { ref: settingsRef, style: { display: "contents" } },
          isOverlayActive ? (React__default["default"].createElement(React__default["default"].Fragment, null,
              React__default["default"].createElement("style", { dangerouslySetInnerHTML: { __html: `
            /* Hide the Decky QAM header with the back button when active */
            div:has(> button:has(svg > path[d^="M257.5 445.1"])) {
              display: none !important;
            }
          ` } }),
              React__default["default"].createElement(deckyFrontendLib.PanelSection, { title: "OCR Active" },
                  React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                      React__default["default"].createElement("div", { ref: dummyFocusRef, id: "decky-ocr-void-focus", className: "Focusable", tabIndex: 0, "data-nav-up": "decky-ocr-void-focus", "data-nav-down": "decky-ocr-void-focus", "data-nav-left": "decky-ocr-void-focus", "data-nav-right": "decky-ocr-void-focus", "nav-up": "decky-ocr-void-focus", "nav-down": "decky-ocr-void-focus", "nav-left": "decky-ocr-void-focus", "nav-right": "decky-ocr-void-focus", style: {
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "40px 10px",
                              textAlign: "center",
                              opacity: 0.6,
                              fontSize: "13px",
                              outline: "none"
                          } },
                          React__default["default"].createElement("div", { style: { fontWeight: 700, marginBottom: "8px" } }, "OCR Overlay is active."),
                          React__default["default"].createElement("div", { style: { fontSize: "11px", lineHeight: 1.4 } }, "Controls are temporarily mapped to the text highlights on the screenshot.")))))) : activeView === "vocab" ? (React__default["default"].createElement(deckyFrontendLib.PanelSection, { title: `Vocabulary List (${vocabList.length})` },
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement(deckyFrontendLib.ButtonItem, { onClick: () => setActiveView("dashboard") }, "Back to Dashboard")),
              vocabList.length === 0 ? (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { textAlign: "center", opacity: 0.5, padding: "20px 0", fontStyle: "italic", fontSize: "13px", width: "100%" } }, "No saved words yet. Capture a screen, select a word, and save it!"))) : (vocabList.map((item, idx) => {
                  let definitionsList = [];
                  try {
                      definitionsList = JSON.parse(item.definition);
                  }
                  catch {
                      definitionsList = [item.definition];
                  }
                  return (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, { key: idx },
                      React__default["default"].createElement("div", { style: {
                              background: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid rgba(255, 255, 255, 0.06)",
                              borderRadius: "8px",
                              padding: "10px",
                              position: "relative",
                              width: "100%",
                              boxSizing: "border-box"
                          } },
                          React__default["default"].createElement("button", { onClick: () => handleDeleteVocabItem(item.id), style: {
                                  position: "absolute",
                                  top: "10px",
                                  right: "10px",
                                  background: "transparent",
                                  border: "none",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  padding: "4px"
                              } },
                              React__default["default"].createElement(FaTrash, { size: 12 })),
                          React__default["default"].createElement("div", { style: { display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" } },
                              React__default["default"].createElement("span", { style: { fontSize: "15px", fontWeight: "bold" } }, item.expression),
                              item.reading && item.reading !== "*" && (React__default["default"].createElement("span", { style: { fontSize: "11px", color: "#a5b4fc" } },
                                  "[",
                                  item.reading,
                                  "]"))),
                          React__default["default"].createElement("div", { style: { fontSize: "11px", color: "#e2e8f0", paddingLeft: "8px", borderLeft: "2px solid #6366f1", marginBottom: "6px" } },
                              definitionsList.slice(0, 3).map((dText, dIdx) => (React__default["default"].createElement("div", { key: dIdx, style: { marginBottom: "2px" } },
                                  "\u2022 ",
                                  dText))),
                              definitionsList.length > 3 && React__default["default"].createElement("div", { style: { opacity: 0.5 } },
                                  "and ",
                                  definitionsList.length - 3,
                                  " more...")),
                          item.sentence && (React__default["default"].createElement("div", { style: { background: "rgba(0, 0, 0, 0.15)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", color: "#94a3b8", fontStyle: "italic", wordBreak: "break-all" } },
                              "Context: ",
                              item.sentence)))));
              })))) : (React__default["default"].createElement(deckyFrontendLib.PanelSection, { title: "OCR Learner Dashboard" },
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement(deckyFrontendLib.ButtonItem, { onClick: handleTriggerOCR },
                      React__default["default"].createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" } },
                          React__default["default"].createElement(FaPlay, { size: 12 }),
                          React__default["default"].createElement("span", null, "Capture Game Screen")))),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { display: "flex", flexDirection: "column", gap: "6px", width: "100%" } },
                      React__default["default"].createElement("div", { style: { fontSize: "11px", fontWeight: "bold", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px" } }, "Hardware Hotkey"),
                      needsInputSetup && (React__default["default"].createElement("div", { style: {
                              background: "rgba(245,158,11,0.12)",
                              border: "1px solid rgba(245,158,11,0.4)",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              fontSize: "10px",
                              color: "#fbbf24"
                          } },
                          React__default["default"].createElement("div", { style: { fontWeight: "bold", marginBottom: "4px" } }, "\u26A0 Setup Required"),
                          React__default["default"].createElement("div", { style: { opacity: 0.85, marginBottom: "6px" } }, "Plugin runs as deck user \u2014 gamepad devices are permission-denied. Run this once in SSH terminal, then re-open settings:"),
                          React__default["default"].createElement("div", { style: {
                                  background: "rgba(0,0,0,0.4)",
                                  borderRadius: "4px",
                                  padding: "4px 6px",
                                  fontFamily: "monospace",
                                  fontSize: "9px",
                                  color: "#e2e8f0",
                                  wordBreak: "break-all",
                                  userSelect: "text"
                              } }, "sudo bash /tmp/setup_hotkey_permissions.sh"),
                          React__default["default"].createElement("div", { style: { marginTop: "4px", opacity: 0.7, fontSize: "9px" } }, "(File already uploaded to your Steam Deck at /tmp/setup_hotkey_permissions.sh)"))),
                      React__default["default"].createElement("div", { style: {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              fontSize: "11px",
                              color: hotkeyDevice ? "#10b981" : "rgba(255,255,255,0.35)",
                              fontFamily: "monospace"
                          } }, hotkeyDevice
                          ? `${hotkeyDevice.replace("/dev/input/", "")}  key:${hotkeyKeycode}`
                          : "Not configured — press a hardware button below"),
                      React__default["default"].createElement("div", { style: { display: "flex", gap: "6px" } },
                          React__default["default"].createElement("button", { onClick: handleLearnHotkey, disabled: hotkeyLearning, style: {
                                  flex: 2,
                                  background: hotkeyLearning
                                      ? "rgba(99,102,241,0.35)"
                                      : "rgba(99,102,241,0.2)",
                                  border: `1px solid ${hotkeyLearning ? "#818cf8" : "rgba(99,102,241,0.4)"}`,
                                  color: hotkeyLearning ? "#e0e7ff" : "#a5b4fc",
                                  borderRadius: "6px",
                                  padding: "5px 10px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  cursor: hotkeyLearning ? "not-allowed" : "pointer",
                                  animation: hotkeyLearning ? "pulse 1s ease-in-out infinite" : "none"
                              } }, hotkeyLearning ? "⏳ Waiting..." : "⌨ Learn Hotkey"),
                          hotkeyDevice && (React__default["default"].createElement("button", { onClick: handleClearHotkey, style: {
                                  flex: 1,
                                  background: "rgba(239,68,68,0.1)",
                                  border: "1px solid rgba(239,68,68,0.3)",
                                  color: "#f87171",
                                  borderRadius: "6px",
                                  padding: "5px 8px",
                                  fontSize: "11px",
                                  cursor: "pointer"
                              } }, "Clear"))),
                      hotkeyStatus && (React__default["default"].createElement("div", { style: { fontSize: "10px", color: hotkeyStatus.includes("✓") ? "#10b981" : "#f59e0b", textAlign: "center" } }, hotkeyStatus)),
                      React__default["default"].createElement("button", { onClick: handleDiagnose, style: {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.4)",
                              borderRadius: "6px",
                              padding: "3px 8px",
                              fontSize: "10px",
                              cursor: "pointer",
                              width: "100%"
                          } }, "\uD83D\uDD0D Diagnose Input Access"),
                      hotkeyDiagLog && (React__default["default"].createElement("div", { style: {
                              background: "rgba(0,0,0,0.5)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "6px",
                              padding: "6px 8px",
                              fontSize: "9px",
                              fontFamily: "monospace",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-all",
                              color: "#94a3b8",
                              maxHeight: "120px",
                              overflowY: "auto"
                          } }, hotkeyDiagLog)))),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { display: "flex", gap: "6px", width: "100%" } },
                      React__default["default"].createElement("button", { onClick: () => setOcrDebugMode(m => !m), style: {
                              flex: 1,
                              background: ocrDebugMode ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              color: "#e2e8f0",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              fontSize: "11px",
                              cursor: "pointer"
                          } }, ocrDebugMode ? "▼ Debug ON" : "▶ Debug"),
                      ocrDebugMode && (React__default["default"].createElement("button", { onClick: handleDebugCapture, style: {
                              flex: 2,
                              background: "rgba(99,102,241,0.2)",
                              border: "1px solid rgba(99,102,241,0.4)",
                              color: "#a5b4fc",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer"
                          } }, "Test capture_screen directly")))),
              ocrDebugMode && ocrLog && (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: {
                          fontSize: "10px",
                          fontFamily: "monospace",
                          background: "rgba(0,0,0,0.5)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          padding: "8px",
                          maxHeight: "160px",
                          overflowY: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                          color: "#e2e8f0",
                          lineHeight: 1.4,
                          width: "100%"
                      } }, ocrLog),
                  React__default["default"].createElement(deckyFrontendLib.ButtonItem, { onClick: () => setOcrLog(""), layout: "below" }, "Clear"))),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" } },
                      React__default["default"].createElement("span", { style: { fontSize: "14px", opacity: 0.8 } }, "Saved Words"),
                      React__default["default"].createElement("button", { onClick: handleOpenVocabView, style: {
                              background: "rgba(99, 102, 241, 0.15)",
                              border: "1px solid rgba(99, 102, 241, 0.3)",
                              color: "#a5b4fc",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                          } },
                          React__default["default"].createElement(FaBookOpen, { size: 11 }),
                          React__default["default"].createElement("span", null,
                              "List (",
                              vocabCount,
                              ")")))),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { fontSize: "12px", fontWeight: "bold", opacity: 0.6, marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.5px" } }, "Import Yomichan Dictionary")),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement(deckyFrontendLib.TextField, { label: "Local Dictionary ZIP Path", value: dictPath, onChange: (e) => setDictPath(e.target.value), placeholder: "/home/deck/Downloads/JMdict.zip" })),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement(deckyFrontendLib.ButtonItem, { onClick: handleImportDictionary },
                      React__default["default"].createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" } },
                          React__default["default"].createElement(FaPlus, { size: 10 }),
                          React__default["default"].createElement("span", null, "Import Dictionary")))),
              importProgress.status === "importing" && (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { display: "flex", flexDirection: "column", gap: "8px", width: "100%", padding: "4px 0" } },
                      React__default["default"].createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px", opacity: 0.8 } },
                          React__default["default"].createElement("span", { style: { fontWeight: "bold" } }, importProgress.message),
                          React__default["default"].createElement("span", null,
                              importProgress.progress,
                              "%")),
                      React__default["default"].createElement("div", { style: { width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" } },
                          React__default["default"].createElement("div", { style: {
                                  width: `${importProgress.progress}%`,
                                  height: "100%",
                                  background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)",
                                  borderRadius: "4px",
                                  transition: "width 0.2s ease-out"
                              } }))))),
              importProgress.status === "success" && (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { fontSize: "12px", color: "#10b981", fontWeight: "bold", padding: "4px 0" } }, importProgress.message))),
              (importProgress.status === "error" || importProgress.status === "importing") && importProgress.progress <= 1 && (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement(deckyFrontendLib.ButtonItem, { onClick: handleViewLog, layout: "below" }, "View Import Log"))),
              importProgress.status === "error" && (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { fontSize: "12px", color: "#ef4444", fontWeight: "bold", padding: "4px 0" } }, importProgress.message))),
              importLog && (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: {
                          fontSize: "10px",
                          fontFamily: "monospace",
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          padding: "8px",
                          maxHeight: "120px",
                          overflowY: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                          color: "#e2e8f0",
                          lineHeight: 1.4
                      } }, importLog),
                  React__default["default"].createElement(deckyFrontendLib.ButtonItem, { onClick: () => setImportLog(""), layout: "below" }, "Clear Log"))),
              React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { fontSize: "12px", fontWeight: "bold", opacity: 0.6, marginTop: "12px", textTransform: "uppercase", letterSpacing: "0.5px" } },
                      "Active Dictionaries (",
                      dictList.length,
                      ")")),
              dictList.length === 0 ? (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, null,
                  React__default["default"].createElement("div", { style: { fontSize: "13px", opacity: 0.5, fontStyle: "italic" } }, "No dictionaries active. Import a Yomichan ZIP file above to enable word definitions."))) : (dictList.map((dict, idx) => (React__default["default"].createElement(deckyFrontendLib.PanelSectionRow, { key: idx },
                  React__default["default"].createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "4px 0" } },
                      React__default["default"].createElement("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px", fontSize: "13px" } }, dict.name),
                      React__default["default"].createElement("button", { onClick: () => handleDeleteDict(dict.name), style: {
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "4px 8px",
                              display: "flex",
                              alignItems: "center"
                          } },
                          React__default["default"].createElement(FaTrash, { size: 12 }))))))))),
          portalTarget && ReactDOM__default["default"].createPortal(React__default["default"].createElement(Overlay, { serverApi: serverApi, focusWindow: settingsRef.current?.ownerDocument.defaultView || undefined, renderWindow: portalTarget.ownerDocument.defaultView || undefined, onActivationChange: setIsOverlayActive }), portalTarget)));
  };

  var index = deckyFrontendLib.definePlugin((serverApi) => {
      return {
          title: React__default["default"].createElement("div", { className: "title-class" }, "OCR Learner"),
          name: "OCR Learner",
          icon: React__default["default"].createElement(FaBook, null),
          content: React__default["default"].createElement(Settings, { serverApi: serverApi }),
      };
  });

  return index;

})(window.DFL, window.SP_REACT, window.SP_REACTDOM);
//# sourceMappingURL=index.js.map
