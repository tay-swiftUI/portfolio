"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import LiquidGlass from "liquid-glass-react";

// ─── Typewriter Hook ───
function useRotatingTypewriter(
  prefix: string,
  suffixes: string[],
  typeSpeed = 60,
  deleteSpeed = 30,
  holdTime = 3000,
  initialDelay = 500
) {
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function run() {
      await sleep(initialDelay);
      if (cancelled) return;

      // Type the full first string
      const first = prefix + suffixes[0];
      setTyping(true);
      for (let i = 1; i <= first.length; i++) {
        if (cancelled) return;
        setDisplayed(first.slice(0, i));
        await sleep(typeSpeed);
      }
      setTyping(false);
      await sleep(holdTime);

      // Loop through suffixes
      let idx = 0;
      while (!cancelled) {
        const current = prefix + suffixes[idx];
        const nextIdx = (idx + 1) % suffixes.length;
        const nextSuffix = suffixes[nextIdx];

        // Delete suffix (keep prefix)
        setTyping(true);
        for (let i = current.length - 1; i >= prefix.length; i--) {
          if (cancelled) return;
          setDisplayed(current.slice(0, i));
          await sleep(deleteSpeed);
        }
        setDisplayed(prefix);
        setTyping(false);
        await sleep(400);
        if (cancelled) return;

        // Type next suffix
        setTyping(true);
        for (let i = 1; i <= nextSuffix.length; i++) {
          if (cancelled) return;
          setDisplayed(prefix + nextSuffix.slice(0, i));
          await sleep(typeSpeed);
        }
        setTyping(false);
        await sleep(holdTime);

        idx = nextIdx;
      }
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { displayed, typing };
}

// ─── Typewriter Headline ───
function TypewriterHeadline() {
  const { displayed, typing } = useRotatingTypewriter(
    "Hello, I'm ",
    ["Taylor!", "a designer.", "an engineer.", "a design engineer."],
    70,
    30,
    3000,
    600
  );

  return (
    <div className="h-[80px] flex items-center justify-center">
      <h1
        className="text-5xl font-normal tracking-tight text-gray-900 whitespace-nowrap md:text-6xl"
        style={{ fontFamily: "var(--font-radley), Georgia, serif" }}
      >
        {displayed}
        <motion.span
          animate={{ opacity: typing ? [1, 0] : 0 }}
          transition={typing ? { duration: 0.5, repeat: Infinity } : { duration: 0.2 }}
          className="inline-block w-[2px] h-[0.8em] bg-gray-900 ml-0.5 align-text-bottom"
        />
      </h1>
    </div>
  );
}

// ─── Dynamic Type Character ───
function DynamicChar({
  char,
  delay,
  fontSize,
}: {
  char: string;
  delay: number;
  fontSize: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setProgress(1);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [delay]);

  // Interpolate: weight 900→400, letter-spacing -3→0
  const weight = 900 - progress * 500;
  const spacing = -3 * (1 - progress);

  return (
    <motion.span
      animate={{ fontVariationSettings: `"wght" ${weight}`, letterSpacing: spacing, opacity: progress === 0 ? 0 : 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
      style={{
        display: "inline-block",
        fontVariationSettings: `"wght" ${weight}`,
        letterSpacing: spacing,
      }}
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}

// ─── Dynamic Type Headline ───
function DynamicTypeHeadline() {
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const suffixes = ["Taylor!", "a designer.", "an engineer.", "a design engineer."];
  const prefix = "Hello, I'm ";
  const full = prefix + suffixes[suffixIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setSuffixIndex((i) => (i + 1) % suffixes.length);
      setAnimKey((k) => k + 1);
    }, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const perCharDelay = 0.03;

  return (
    <div className="h-[80px] flex items-center justify-center">
      <h1
        className="text-5xl text-gray-900 whitespace-nowrap md:text-6xl"
        style={{ fontFamily: "'Inter', var(--font-nouvelle), sans-serif", fontWeight: 400 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={animKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {Array.from(full).map((char, i) => (
              <DynamicChar
                key={`${animKey}-${i}`}
                char={char}
                delay={i * perCharDelay}
                fontSize={60}
              />
            ))}
          </motion.span>
        </AnimatePresence>
      </h1>
    </div>
  );
}

// ─── Figma-style Cursor ───
// Arrow cursor on top, name pill directly below — like real Figma multiplayer cursors
function CursorLabel({
  label,
  color,
  initialX,
  initialY,
  enterDelay,
  driftDurationX,
  driftDurationY,
  driftRangeX,
  driftRangeY,
  flip,
}: {
  label: string;
  color: string;
  initialX: number;
  initialY: number;
  enterDelay: number;
  driftDurationX: number;
  driftDurationY: number;
  driftRangeX: number[];
  driftRangeY: number[];
  flip?: boolean;
}) {
  return (
    <motion.div
      className={`absolute flex flex-col pointer-events-none ${flip ? "items-end" : "items-start"}`}
      initial={{ x: initialX, y: initialY, opacity: 0, scale: 0.6 }}
      animate={{
        x: driftRangeX.map((d) => initialX + d),
        y: driftRangeY.map((d) => initialY + d),
        opacity: 1,
        scale: 1,
      }}
      transition={{
        x: { duration: driftDurationX, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" },
        y: { duration: driftDurationY, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" },
        opacity: { duration: 0.5, delay: enterDelay },
        scale: { duration: 0.3, delay: enterDelay, type: "spring", stiffness: 400, damping: 15 },
      }}
    >
      {/* Arrow on top for non-flipped cursors */}
      {!flip && (
        <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
          <path d="M1 1L1 15L11 8L1 1Z" fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
      {/* Name pill */}
      <div
        className={`rounded-full px-3 py-1 text-xs font-medium text-white shadow-lg ${flip ? "" : "-mt-1 ml-2"}`}
        style={{ background: color }}
      >
        {label}
      </div>
      {/* Arrow on bottom-right for flipped cursors, mirrored horizontally */}
      {flip && (
        <svg
          width="12"
          height="16"
          viewBox="0 0 12 16"
          fill="none"
          className="self-end mr-[-4px] mt-0"
          style={{ transform: "rotate(55deg)" }}
        >
          <path d="M1 1L1 15L11 8L1 1Z" fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </motion.div>
  );
}

// ─── Nav Pill ───
function NavPill({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        className="fixed top-6 left-1/2 z-50 -translate-x-1/2 hidden md:block"
      >
        <div className="flex items-center gap-1 rounded-full px-2 py-1.5"
          style={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className="relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            >
              {active === tab && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-black"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span
                className={`relative z-10 ${
                  active === tab ? "text-white" : "text-gray-500 hover:text-black"
                }`}
              >
                {tab}
              </span>
            </button>
          ))}
        </div>
      </motion.nav>

      {/* Mobile nav — hamburger */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        className="fixed top-4 right-4 z-50 md:hidden"
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex flex-col gap-[4px]">
            <motion.div animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6 : 0 }} className="w-4 h-[1.5px] bg-gray-800 rounded-full" />
            <motion.div animate={{ opacity: menuOpen ? 0 : 1 }} className="w-4 h-[1.5px] bg-gray-800 rounded-full" />
            <motion.div animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6 : 0 }} className="w-4 h-[1.5px] bg-gray-800 rounded-full" />
          </div>
        </button>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-14 right-0 rounded-2xl py-2 min-w-[160px]"
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.12)",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { onChange(tab); setMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                    active === tab ? "text-black" : "text-gray-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}

// ─── Experience Card ───
function ExpCard({
  company,
  logo,
  role,
  period,
  description,
  highlights,
  color,
  index,
}: {
  company: string;
  logo: string;
  role: string;
  period: string;
  description: string;
  highlights: string[];
  color: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      layout
      onClick={() => setOpen(!open)}
      className="cursor-pointer rounded-3xl p-6"
      style={{
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo} alt={company} className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-sm font-bold"
              style={{ background: color }}
            >
              {company[0]}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{company}</h3>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>
        <span className="text-sm text-gray-400">{period}</span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
              {description}
            </p>
            <ul className="mt-4 space-y-2">
              {highlights.map((h, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  {h}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="mt-3 opacity-30"
        animate={{ rotate: open ? 180 : 0 }}
      >
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </motion.svg>
    </motion.div>
  );
}

// ─── Prototype Card ───
function ProtoCard({
  title,
  description,
  tag,
  index,
}: {
  title: string;
  description: string;
  tag: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer glass-card rounded-2xl p-5"
    >
      <div className="mb-3 flex aspect-[4/3] items-center justify-center rounded-xl bg-white/40">
        <span className="text-3xl opacity-20">✦</span>
      </div>
      <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <span className="mt-3 inline-block rounded-full bg-white/60 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-gray-500 border border-white/50">
        {tag}
      </span>
    </motion.div>
  );
}

// ─── Bento Card ───
function BentoCard({
  label,
  span,
  index,
}: {
  label: string;
  span?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ scale: 1.02 }}
      className={`glass-card rounded-2xl flex items-end p-5 cursor-pointer ${
        span || ""
      }`}
      style={{ minHeight: 160 }}
    >
      <span className="text-sm font-medium text-gray-500">{label}</span>
    </motion.div>
  );
}

// ─── iPhone Mockup ───
function IPhoneMockup({
  title,
  description,
  tag,
  index,
  gifSrc,
  videoSrc,
  contain,
  lighten,
  padded,
}: {
  title: string;
  description: string;
  tag: string;
  index: number;
  gifSrc?: string;
  videoSrc?: string;
  contain?: boolean;
  lighten?: boolean;
  padded?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-[180px] h-[380px] rounded-[32px] border-[6px] border-gray-900 bg-black shadow-xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-[24px] bg-black rounded-b-2xl z-10" />
        <div className={`w-full h-full rounded-[26px] overflow-hidden ${contain ? "bg-white flex items-center" : padded ? "bg-white flex items-center justify-center p-3" : "bg-gray-100"}`}>
          {videoSrc ? (
            <video src={videoSrc} autoPlay loop muted playsInline className={`${padded ? "w-full h-full object-cover" : contain ? "w-full object-contain" : "w-full h-full object-cover"}`} style={padded ? { transform: "scale(0.93)" } : lighten ? { filter: "brightness(1.04)" } : undefined} />
          ) : gifSrc ? (
            <img src={gifSrc} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
              <span className="text-xs text-gray-400 font-medium px-4 text-center">Add media</span>
            </div>
          )}
        </div>
        {/* White overlay to cover status bar when contain mode */}
        {contain && <div className="absolute top-0 left-0 right-0 h-[70px] bg-white z-[5] rounded-t-[26px]" />}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[40%] h-[4px] bg-gray-600 rounded-full" />
      </div>
    </motion.div>
  );
}

// ─── Scrolling iPhone ───
function ScrollingPhone({
  src,
  label,
  index,
  duration = 12,
}: {
  src: string;
  label: string;
  index: number;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-[200px] h-[420px] rounded-[36px] border-[6px] border-gray-900 bg-black shadow-xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-black rounded-b-xl z-20" />
        <div className="w-full h-full rounded-[30px] overflow-hidden bg-gray-100 relative">
          <motion.div
            className="absolute top-0 left-0 w-full"
            animate={{ y: ["0%", "-70%", "0%"] }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 0.5,
            }}
          >
            <img src={src} alt={label} className="w-full" />
          </motion.div>
        </div>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[35%] h-[3px] bg-gray-600 rounded-full z-20" />
      </div>
      <span className="mt-3 text-xs font-medium text-gray-500">{label}</span>
    </motion.div>
  );
}

// ─── CoverFlow ───
function CoverFlow() {
  const [active, setActive] = useState(Math.floor(albums.length / 2));
  const [dragging, setDragging] = useState(false);

  const handleDrag = (_: any, info: { offset: { x: number } }) => {
    const threshold = 60;
    if (info.offset.x > threshold) {
      setActive((a) => Math.max(0, a - 1));
    } else if (info.offset.x < -threshold) {
      setActive((a) => Math.min(albums.length - 1, a + 1));
    }
  };

  return (
    <div className="relative py-4">
      <motion.div
        className="flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: 1000, height: 280 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setDragging(true)}
        onDragEnd={(_, info) => { setDragging(false); handleDrag(_, info); }}
      >
        {albums.map((album, i) => {
          const offset = i - active;
          const absOffset = Math.abs(offset);
          const isActive = offset === 0;

          // Side albums are spaced tighter and overlap
          const xPos = isActive ? 0 : offset * 80 + (offset > 0 ? 60 : -60);

          return (
            <motion.div
              key={album.title + i}
              onClick={() => !dragging && setActive(i)}
              className="absolute cursor-pointer"
              animate={{
                x: xPos,
                rotateY: isActive ? 0 : offset > 0 ? -55 : 55,
                scale: isActive ? 1 : 0.7,
                opacity: absOffset > 3 ? 0 : 1 - absOffset * 0.2,
              }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 22,
                mass: 0.8,
              }}
              style={{
                zIndex: 100 - absOffset,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Album cover */}
              <motion.div
                className="w-[200px] h-[200px] rounded-md overflow-hidden"
                style={{
                  background: album.gradient,
                  boxShadow: isActive
                    ? "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)"
                    : "0 8px 30px rgba(0,0,0,0.2)",
                }}
                whileHover={isActive ? { scale: 1.05, y: -5 } : {}}
                transition={{ duration: 0.2 }}
              >
                <div className="w-full h-full flex flex-col justify-end p-4">
                  <p className={`text-sm font-bold leading-tight ${
                    ["#E8E0D0", "#C0C0C0", "#FFB6C1", "#D4C5A9"].includes(album.color) ? "text-gray-900" : "text-white"
                  }`}>
                    {album.title}
                  </p>
                  <p className={`text-xs mt-1 ${
                    ["#E8E0D0", "#C0C0C0", "#FFB6C1", "#D4C5A9"].includes(album.color) ? "text-gray-600" : "text-white/60"
                  }`}>
                    {album.artist}
                  </p>
                </div>
              </motion.div>

              {/* Reflection */}
              {isActive && (
                <div
                  className="w-[200px] h-[80px] rounded-md mt-[2px] overflow-hidden"
                  style={{
                    background: album.gradient,
                    transform: "scaleY(-1)",
                    opacity: 0.15,
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Active album info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="text-center mt-2"
        >
          <p className="text-sm font-semibold text-gray-900">{albums[active].title}</p>
          <p className="text-xs text-gray-400">{albums[active].artist}</p>
        </motion.div>
      </AnimatePresence>

      {/* Subtle nav dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        {albums.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setActive(i)}
            className="h-1.5 rounded-full"
            animate={{
              width: i === active ? 20 : 6,
              backgroundColor: i === active ? "#1D1D1F" : "#D1D1D6",
            }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── iPod Nano ───
function IPodNano() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [screen, setScreen] = useState<"menu" | "coverflow" | "playing">("coverflow");
  const [coverIndex, setCoverIndex] = useState(Math.floor(albums.length / 2));

  const menuItems = ["Music", "Videos", "Photos", "Podcasts", "Extras", "Settings", "Shuffle Songs", "Now Playing"];

  const handleScroll = (direction: "up" | "down") => {
    if (screen === "menu") {
      setSelectedIndex((prev) =>
        direction === "down" ? Math.min(menuItems.length - 1, prev + 1) : Math.max(0, prev - 1)
      );
    } else if (screen === "coverflow") {
      setCoverIndex((prev) =>
        direction === "down" ? Math.min(albums.length - 1, prev + 1) : Math.max(0, prev - 1)
      );
    }
  };

  const handleSelect = () => {
    if (screen === "playing") {
      setScreen("coverflow");
      return;
    }
    if (screen === "coverflow") {
      setScreen("playing");
      return;
    }
    if (menuItems[selectedIndex] === "Music") {
      setScreen("coverflow");
    } else if (menuItems[selectedIndex] === "Now Playing") {
      setScreen("playing");
    }
  };

  const handleMenu = () => {
    if (screen === "playing") setScreen("coverflow");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center"
    >
      {/* iPod body */}
      <div
        className="relative w-[220px] h-[360px] rounded-[20px] shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(180deg, #FE00AB, #D63B6E)" }}
      >
        {/* Screen */}
        <div className="mx-4 mt-4 w-[188px] h-[170px] rounded-[4px] overflow-hidden bg-white">
          <AnimatePresence mode="wait">
            {screen === "menu" && (
              <motion.div
                key="menu"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full flex"
              >
                <div className="w-[110px] h-full bg-white">
                  <div className="bg-gray-800 text-white text-[8px] font-bold px-2 py-0.5">
                    <span>iPod</span>
                  </div>
                  <div className="py-0.5">
                    {menuItems.map((item, i) => (
                      <div
                        key={item}
                        className={`text-[9px] px-2 py-[2px] flex justify-between items-center ${
                          i === selectedIndex ? "bg-blue-500 text-white" : "text-gray-900"
                        }`}
                      >
                        <span className={i === selectedIndex ? "font-bold" : ""}>{item}</span>
                        <span className="text-[8px]">›</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 h-full flex items-center justify-center p-2" style={{ background: albums[0].gradient }}>
                  <div className="text-center">
                    <p className="text-[7px] text-white/80 font-bold">{albums[0].artist}</p>
                    <p className="text-[6px] text-white/60">{albums[0].title}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {screen === "coverflow" && (
              <motion.div
                key="coverflow"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full bg-black flex flex-col"
              >
                <div className="bg-gray-800/80 text-white text-[7px] font-bold px-2 py-0.5 text-center">
                  Cover Flow
                </div>
                {/* Coverflow */}
                <div className="flex-1 flex items-end justify-center relative overflow-hidden pb-1" style={{ perspective: 300 }}>
                  {albums.map((album, i) => {
                    const offset = i - coverIndex;
                    const absOffset = Math.abs(offset);
                    const isActive = offset === 0;
                    return (
                      <motion.div
                        key={album.title + i}
                        className="absolute cursor-pointer"
                        onClick={() => { setCoverIndex(i); if (isActive) setScreen("playing"); }}
                        animate={{
                          x: isActive ? 0 : offset * 36 + (offset > 0 ? 22 : -22),
                          rotateY: isActive ? 0 : offset > 0 ? -55 : 55,
                          scale: isActive ? 1 : 0.65,
                          opacity: absOffset > 2 ? 0 : 1 - absOffset * 0.25,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{ zIndex: 50 - absOffset, transformStyle: "preserve-3d" }}
                      >
                        <div
                          className="w-[82px] h-[82px] rounded-[3px] overflow-hidden"
                          style={{
                            boxShadow: isActive ? "0 4px 16px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)",
                          }}
                        >
                          <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
                        </div>
                        {isActive && (
                          <div className="w-[82px] h-[20px] mt-[1px] opacity-20 overflow-hidden rounded-b-[3px]">
                            <img src={album.cover} alt="" className="w-full h-[82px] object-cover" style={{ transform: "scaleY(-1)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)" }} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                {/* Info bar */}
                <div className="bg-gray-900/80 px-2 py-1.5 text-center">
                  <p className="text-[8px] text-white font-bold">{albums[coverIndex].title}</p>
                  <p className="text-[6px] text-white/60">{albums[coverIndex].artist}</p>
                </div>
              </motion.div>
            )}

            {screen === "playing" && (
              <motion.div
                key="playing"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full flex flex-col items-center justify-center"
                style={{ background: albums[coverIndex].gradient }}
              >
                <p className="text-[10px] text-white font-bold">{albums[coverIndex].title}</p>
                <p className="text-[8px] text-white/70 mt-0.5">{albums[coverIndex].artist}</p>
                <div className="mt-3 w-[120px] h-[3px] bg-white/20 rounded-full">
                  <motion.div className="h-full bg-white/60 rounded-full" animate={{ width: ["0%", "100%"] }} transition={{ duration: 8, repeat: Infinity }} />
                </div>
                <p className="text-[7px] text-white/50 mt-1">0:00 / 3:45</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Click wheel */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="w-[140px] h-[140px] rounded-full bg-white/20 flex items-center justify-center relative">
            {/* Center button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSelect}
              className="w-[50px] h-[50px] rounded-full bg-white/90 shadow-inner z-10"
            />
            {/* MENU */}
            <button
              onClick={handleMenu}
              className="absolute top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white/80"
            >
              MENU
            </button>
            {/* Prev */}
            <button
              onClick={() => handleScroll("up")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 text-xs"
            >
              ⏮
            </button>
            {/* Next */}
            <button
              onClick={() => handleScroll("down")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 text-xs"
            >
              ⏭
            </button>
            {/* Play */}
            <button
              onClick={handleSelect}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/80 text-xs"
            >
              ▶︎‖
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ID Badge ───
const badgeData = [
  { company: "Nike", role: "iOS Engineer", period: "2021-2022", color: "#111111", accent: "#FF6B00", logo: "/logos/nike.svg" },
  { company: "Spotify", role: "iOS Engineer", period: "2022-2024", color: "#1A6B4A", accent: "#1DB954", logo: "/logos/spotify.png" },
  { company: "Sidework", role: "Design Engineer", period: "2024-2025", color: "#FFFFFF", accent: "#3DC1B8", logo: "/logos/sidework.png", strapLogo: "/logos/sidework-white.png", darkText: true },
  { company: "Electronic Arts", role: "Design Engineer", period: "2025", color: "#2D5BE3", accent: "#1A3FC7", logo: "/logos/ea.jpg", strapLogo: "/logos/ea-white.png" },
];

function IDBadgeCoverflow() {
  const [active, setActive] = useState(0);

  return (
    <div className="relative mb-12 -mt-[7.5rem]" style={{ clipPath: "inset(0px 0px 0px 0px)" }}>
      {/* TODO: Make height responsive on mobile (currently 460px fixed) */}
      <div className="flex items-center justify-center" style={{ perspective: 1000, height: 460 }}>
        {badgeData.map((badge, i) => {
          const offset = i - active;
          const absOffset = Math.abs(offset);
          const isActive = offset === 0;

          return (
            <motion.div
              key={badge.company}
              onClick={() => setActive(i)}
              className="absolute cursor-pointer"
              initial={{ y: -200, opacity: 0 }}
              animate={{
                y: 0,
                x: isActive ? 0 : offset * 90 + (offset > 0 ? 50 : -50),
                rotateY: isActive ? 0 : offset > 0 ? -40 : 40,
                scale: isActive ? 1 : 0.7,
                opacity: absOffset > 2 ? 0 : 1 - absOffset * 0.25,
              }}
              transition={{
                y: { type: "spring", stiffness: 120, damping: 14, delay: i * 0.15 },
                x: { type: "spring", stiffness: 250, damping: 22 },
                rotateY: { type: "spring", stiffness: 250, damping: 22 },
                scale: { type: "spring", stiffness: 250, damping: 22 },
                opacity: { type: "spring", stiffness: 250, damping: 22 },
              }}
              style={{ zIndex: 100 - absOffset, transformStyle: "preserve-3d" }}
            >
              {/* Lanyard */}
              <div className="flex flex-col items-center">
                {/* Strap */}
                <div className="w-[26px] relative overflow-hidden rounded-[2px]" style={{ height: 140, background: "#1A1A1A" }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px)" }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
                    {badge.logo && (
                      <>
                        <img src={(badge as any).strapLogo || badge.logo} alt="" className={`w-[18px] h-[18px] object-contain opacity-50 ${(badge as any).strapLogo ? "" : "brightness-0 invert"}`} />
                        <img src={(badge as any).strapLogo || badge.logo} alt="" className={`w-[18px] h-[18px] object-contain opacity-50 ${(badge as any).strapLogo ? "" : "brightness-0 invert"}`} />
                      </>
                    )}
                  </div>
                </div>
                {/* Metal clasp */}
                <div className="relative w-[24px] h-[20px] mb-[2px]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[20px] h-[14px] rounded-b-[4px]" style={{ background: "linear-gradient(180deg, #3A3A3A, #2A2A2A)", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full border-[2px]" style={{ borderColor: "#3A3A3A", background: "#2A2A2A" }} />
                </div>

                {/* Badge */}
                <div
                  className="relative w-[180px] h-[260px] rounded-[12px] overflow-hidden"
                  style={{
                    background: `linear-gradient(160deg, ${badge.color}, ${badge.color}ee)`,
                    border: (badge as any).darkText ? "1px solid rgba(0,0,0,0.08)" : "none",
                    boxShadow: isActive
                      ? "0 20px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                      : "0 8px 24px rgba(0,0,0,0.15)",
                  }}
                >
                  {/* Holographic shine */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={isActive ? {
                      background: [
                        "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)",
                        "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 20%, transparent 40%)",
                        "linear-gradient(120deg, transparent 60%, rgba(255,255,255,0.03) 80%, transparent 100%)",
                        "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)",
                      ],
                    } : {}}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Clip cutout at top */}
                  <div className="flex justify-center pt-3">
                    <div className="w-[30px] h-[10px] rounded-full bg-gray-600/50" />
                  </div>

                  {/* Photo */}
                  <div className="flex justify-center mt-4">
                    <div className="w-[70px] h-[70px] rounded-[8px] overflow-hidden border-2" style={{ borderColor: (badge as any).darkText ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)" }}>
                      <img src="/taylor.jpeg" alt="Taylor" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center mt-3 px-4">
                    <p className={`text-[13px] font-bold ${(badge as any).darkText ? "text-gray-900" : "text-white"}`}>Taylor Breitzman</p>
                    <p className={`text-[10px] mt-1 ${(badge as any).darkText ? "text-gray-500" : "text-white/60"}`}>{badge.role}</p>
                    <p className={`text-[9px] mt-0.5 ${(badge as any).darkText ? "text-gray-400" : "text-white/40"}`}>{badge.period}</p>
                  </div>

                  {/* Company logo */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <div className={`overflow-hidden flex items-center justify-center ${badge.company === "Electronic Arts" ? "w-[50px] h-[50px] rounded-[12px]" : "w-[40px] h-[40px] rounded-lg"}`}>
                      <img src={badge.logo} alt={badge.company} className={`w-full h-full object-cover ${(badge as any).darkText || badge.company === "Electronic Arts" ? "" : "brightness-0 invert"}`} />
                    </div>
                  </div>

                  {/* Accent stripe */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[4px]"
                    style={{ background: badge.accent }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active badge description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="mt-4 max-w-lg mx-auto"
        >
          <p className="text-sm font-semibold text-gray-900 text-center">{badgeData[active].company}</p>
          <p className="text-xs text-gray-400 text-center mb-3">{badgeData[active].role} · {badgeData[active].period}</p>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {badgeData.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setActive(i)}
            className="h-1.5 rounded-full"
            animate={{
              width: i === active ? 20 : 6,
              backgroundColor: i === active ? "#1D1D1F" : "#D1D1D6",
            }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Journey Timeline ───
const journeyStops = [
  { year: "2021", city: "College Park, MD", role: "Graduated", company: "University of Maryland", logo: "", color: "#E21833", tag: "BS Computer Science" },
  { year: "2021", city: "Portland, OR", role: "iOS Engineer", company: "Nike", logo: "/logos/nike.svg", color: "#111111", tag: "First job → coast to coast" },
  { year: "2022", city: "New Jersey", role: "iOS Engineer", company: "Spotify", logo: "/logos/spotify.png", color: "#1DB954", tag: "61% CTR increase on ads" },
  { year: "2024", city: "San Diego, CA", role: "Design Engineer", company: "Sidework", logo: "/logos/sidework.png", color: "#3DC1B8", tag: "Engineer → Design pivot" },
  { year: "2025", city: "San Francisco, CA", role: "Design Engineer", company: "Electronic Arts", logo: "/logos/ea.jpg", color: "#2D5BE3", tag: "92+ component design system" },
];

function JourneyTimeline() {
  const [active, setActive] = useState(0);
  const progress = active / (journeyStops.length - 1);

  // Scattered elements that bloom in at each stop — positioned randomly
  const blooms: Record<number, { x: number; y: number; rotate: number; type: "pin" | "tag" | "photo" | "logo"; content: string }[]> = {
    0: [
      { x: 20, y: 15, rotate: -5, type: "tag", content: "Go Terps! 🐢" },
      { x: 65, y: 60, rotate: 3, type: "pin", content: "College Park, MD" },
      { x: 40, y: 35, rotate: -2, type: "tag", content: "BS Computer Science" },
    ],
    1: [
      { x: 15, y: 55, rotate: -8, type: "pin", content: "Portland, OR" },
      { x: 55, y: 20, rotate: 5, type: "logo", content: "/logos/nike.svg" },
      { x: 70, y: 65, rotate: -3, type: "tag", content: "First real job" },
      { x: 35, y: 40, rotate: 2, type: "tag", content: "iOS Engineer" },
    ],
    2: [
      { x: 60, y: 15, rotate: 4, type: "logo", content: "/logos/spotify.png" },
      { x: 20, y: 50, rotate: -6, type: "pin", content: "New Jersey" },
      { x: 45, y: 70, rotate: 2, type: "tag", content: "61% CTR increase" },
      { x: 75, y: 45, rotate: -4, type: "tag", content: "Ads UI" },
    ],
    3: [
      { x: 25, y: 25, rotate: 6, type: "logo", content: "/logos/sidework.png" },
      { x: 65, y: 55, rotate: -3, type: "pin", content: "San Diego, CA" },
      { x: 45, y: 15, rotate: -5, type: "tag", content: "Eng → Design pivot" },
      { x: 15, y: 65, rotate: 4, type: "tag", content: "Flutter + Figma" },
    ],
    4: [
      { x: 55, y: 25, rotate: -4, type: "logo", content: "/logos/ea.jpg" },
      { x: 20, y: 45, rotate: 3, type: "pin", content: "San Francisco, CA" },
      { x: 70, y: 60, rotate: -6, type: "tag", content: "92+ components" },
      { x: 35, y: 70, rotate: 5, type: "tag", content: "Design System" },
      { x: 75, y: 15, rotate: -2, type: "tag", content: "SwiftUI + Figma" },
    ],
  };

  return (
    <div className="mt-16 mb-8 -mx-6">
      <div className="px-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">The Journey</h3>
        <p className="text-sm text-gray-400 mb-8">From engineering to design, coast to coast</p>
      </div>

      {/* Bloom canvas */}
      <div className="relative overflow-hidden rounded-2xl mx-6 bg-gray-50/50" style={{ height: 320 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {(blooms[active] || []).map((item, bi) => (
              <motion.div
                key={bi}
                className="absolute"
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                initial={{ scale: 0, opacity: 0, rotate: item.rotate * 2 }}
                animate={{ scale: 1, opacity: 1, rotate: item.rotate }}
                transition={{ delay: bi * 0.08, type: "spring", stiffness: 300, damping: 18 }}
              >
                {item.type === "tag" && (
                  <div className="bg-white rounded-full px-3 py-1.5 shadow-md border border-gray-100 whitespace-nowrap">
                    <span className="text-[11px] font-medium text-gray-700">{item.content}</span>
                  </div>
                )}
                {item.type === "pin" && (
                  <div className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-md border border-gray-100">
                    <span className="text-[10px]">📍</span>
                    <span className="text-[10px] font-medium text-gray-600 whitespace-nowrap">{item.content}</span>
                  </div>
                )}
                {item.type === "logo" && (
                  <div className="w-12 h-12 rounded-xl bg-white shadow-lg border border-gray-100 flex items-center justify-center p-2">
                    <img src={item.content} alt="" className="w-full h-full object-contain" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Center info */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-gray-900">{journeyStops[active].company}</p>
              <p className="text-sm text-gray-400 mt-1">{journeyStops[active].role} · {journeyStops[active].city}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Timeline with logo circles */}
      <div className="px-6 mt-10">
        <div className="relative">
          {/* Segmented track — each leg its own color */}
          <div className="absolute top-[19px] left-[20px] right-[20px] h-[3px] flex">
            {journeyStops.slice(0, -1).map((stop, i) => (
              <motion.div
                key={i}
                className="flex-1 first:rounded-l-full last:rounded-r-full"
                animate={{
                  backgroundColor: i < active ? journeyStops[i + 1].color : "rgba(0,0,0,0.06)",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Logo circles */}
          <div className="relative flex justify-between">
            {journeyStops.map((stop, i) => (
              <motion.button
                key={i}
                onClick={() => setActive(i)}
                whileTap={{ scale: 0.85 }}
                className="relative flex flex-col items-center z-10"
              >

                {/* Circle */}
                <motion.div
                  className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden relative"
                  animate={{
                    scale: i === active ? 1.15 : i <= active ? 1 : 0.85,
                    opacity: i <= active ? 1 : 0.4,
                  }}
                  whileHover={{ scale: i === active ? 1.2 : 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{
                    background: i <= active ? stop.color : "#E5E5E5",
                  }}
                >
                  {stop.logo ? (
                    <img
                      src={stop.logo}
                      alt={stop.company}
                      className={`w-5 h-5 object-contain ${i <= active ? "brightness-0 invert" : "opacity-40"}`}
                    />
                  ) : (
                    <span className="text-sm">{i <= active ? "🎓" : "🎓"}</span>
                  )}
                </motion.div>

                {/* Year label */}
                <motion.span
                  className="text-[10px] mt-2 whitespace-nowrap"
                  animate={{
                    color: i === active ? "#1D1D1F" : "#B0B0B0",
                    fontWeight: i === active ? 700 : 400,
                  }}
                >
                  {stop.year}
                </motion.span>

                {/* City — only on active */}
                <AnimatePresence>
                  {i === active && (
                    <motion.span
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      className="text-[8px] text-gray-400 whitespace-nowrap"
                    >
                      {stop.city.split(",")[0]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// ─── MS Paint — functional drawing app ───
function MSPaint() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState<"pencil" | "brush" | "eraser" | "line" | "rect" | "ellipse" | "fill">("pencil");
  const [lineWidth, setLineWidth] = useState(2);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const snapshot = useRef<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Pre-draw "UX is my passion"
    ctx.save();
    ctx.font = "italic bold 42px Comic Sans MS, cursive";
    ctx.fillStyle = "#0000FF";
    ctx.fillText("UX is", 60, 100);
    ctx.font = "italic bold 52px Comic Sans MS, cursive";
    ctx.fillStyle = "#FF00FF";
    ctx.fillText("my", 120, 170);
    ctx.font = "italic bold 38px Comic Sans MS, cursive";
    ctx.fillStyle = "#FF0000";
    ctx.fillText("passion", 80, 240);
    // Add some wonky stars
    ctx.font = "24px serif";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("★", 30, 60);
    ctx.fillText("★", 320, 90);
    ctx.fillText("★", 280, 260);
    ctx.fillStyle = "#00CC00";
    ctx.fillText("♥", 350, 180);
    ctx.restore();
  }, []);

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const sx = Math.floor(startX);
    const sy = Math.floor(startY);
    const idx = (sy * canvas.width + sx) * 4;
    const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2];
    const temp = document.createElement("canvas").getContext("2d")!;
    temp.fillStyle = fillColor;
    temp.fillRect(0, 0, 1, 1);
    const fc = temp.getImageData(0, 0, 1, 1).data;
    if (targetR === fc[0] && targetG === fc[1] && targetB === fc[2]) return;
    const stack = [[sx, sy]];
    const visited = new Set<number>();
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const i = (y * canvas.width + x) * 4;
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      if (visited.has(i)) continue;
      if (Math.abs(data[i] - targetR) > 10 || Math.abs(data[i + 1] - targetG) > 10 || Math.abs(data[i + 2] - targetB) > 10) continue;
      visited.add(i);
      data[i] = fc[0]; data[i + 1] = fc[1]; data[i + 2] = fc[2]; data[i + 3] = 255;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  const handleDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setIsDrawing(true);
    lastPos.current = pos;
    startPos.current = pos;
    if (tool === "fill") {
      floodFill(pos.x, pos.y, color);
      return;
    }
    if (tool === "line" || tool === "rect" || tool === "ellipse") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    }
    if (tool === "pencil" || tool === "brush" || tool === "eraser") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (tool === "brush" ? lineWidth * 2 : tool === "eraser" ? 8 : lineWidth) / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === "eraser" ? "#FFFFFF" : color;
      ctx.fill();
    }
  }, [getPos, tool, color, lineWidth, floodFill]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);

    if (tool === "pencil" || tool === "brush" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
      ctx.lineWidth = tool === "brush" ? lineWidth * 3 : tool === "eraser" ? 16 : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = pos;
    } else if (tool === "line" || tool === "rect" || tool === "ellipse") {
      if (snapshot.current) ctx.putImageData(snapshot.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      const sp = startPos.current!;
      if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === "rect") {
        ctx.strokeRect(sp.x, sp.y, pos.x - sp.x, pos.y - sp.y);
      } else {
        const cx = (sp.x + pos.x) / 2, cy = (sp.y + pos.y) / 2;
        const rx = Math.abs(pos.x - sp.x) / 2, ry = Math.abs(pos.y - sp.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [isDrawing, getPos, tool, color, lineWidth]);

  const handleUp = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
    startPos.current = null;
    snapshot.current = null;
  }, []);

  const colors = [
    "#000000", "#808080", "#800000", "#808000", "#008000", "#008080", "#000080", "#800080",
    "#808040", "#004040", "#0080FF", "#004080", "#8000FF", "#804000",
    "#FFFFFF", "#C0C0C0", "#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF",
    "#FFFF80", "#00FF80", "#80FFFF", "#4080FF", "#FF0080", "#FF8000",
  ];

  const tools: { id: typeof tool; label: string }[] = [
    { id: "pencil", label: "✏️" },
    { id: "brush", label: "🖌️" },
    { id: "eraser", label: "🧹" },
    { id: "fill", label: "🪣" },
    { id: "line", label: "📏" },
    { id: "rect", label: "⬜" },
    { id: "ellipse", label: "⭕" },
  ];

  return (
    <div className="select-none" style={{ width: 340 }}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-1 py-0.5" style={{ background: "linear-gradient(90deg, #0A246A, #3A6EA5)", borderTopLeftRadius: 3, borderTopRightRadius: 3 }}>
        <div className="flex items-center gap-1">
          <span className="text-[10px]">🎨</span>
          <span className="text-[11px] font-bold text-white">ux_passion.bmp - Paint</span>
        </div>
        <div className="flex gap-[2px]">
          <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>_</div>
          <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>□</div>
          <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-white" style={{ background: "linear-gradient(180deg, #E8524A, #C62B22)" }}>✕</div>
        </div>
      </div>

      {/* Menu bar */}
      <div className="flex gap-3 px-2 py-0.5 bg-[#ECE9D8] border-b border-gray-400">
        {["File", "Edit", "View", "Image", "Colors", "Help"].map((m) => (
          <span key={m} className="text-[11px] text-gray-800">{m}</span>
        ))}
      </div>

      {/* Main area */}
      <div className="flex bg-[#C0C0C0]">
        {/* Tool palette */}
        <div className="flex flex-col gap-[2px] p-1 bg-[#ECE9D8] border-r border-gray-400" style={{ width: 42 }}>
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className="w-[32px] h-[26px] flex items-center justify-center text-[12px] rounded-sm"
              style={{
                background: tool === t.id ? "#B0C4DE" : "#ECE9D8",
                border: tool === t.id ? "1px solid #6688AA" : "1px solid transparent",
                boxShadow: tool === t.id ? "inset 1px 1px 2px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
          {/* Size selector */}
          <div className="mt-1 flex flex-col gap-[1px]">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setLineWidth(s)}
                className="w-[32px] h-[10px] flex items-center justify-center"
                style={{ background: lineWidth === s ? "#B0C4DE" : "#ECE9D8", border: lineWidth === s ? "1px solid #6688AA" : "1px solid transparent" }}
              >
                <div style={{ width: 20, height: s, background: "#000" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-1 bg-[#808080]">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
            className="bg-white cursor-crosshair"
            style={{ width: "100%", height: 220, imageRendering: "auto" }}
          />
        </div>
      </div>

      {/* Color palette */}
      <div className="flex items-center gap-1 px-2 py-1 bg-[#ECE9D8] border-t border-gray-400" style={{ borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }}>
        {/* Active color preview */}
        <div className="w-[18px] h-[18px] border border-gray-600 mr-1" style={{ background: color }} />
        {/* Color grid */}
        <div className="grid grid-cols-14 gap-[1px]" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-[12px] h-[12px] border border-gray-500"
              style={{ background: c, outline: color === c ? "2px solid #000" : "none", outlineOffset: -1 }}
            />
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-2 py-0.5 bg-[#ECE9D8] rounded-b-sm border-t border-gray-300">
        <div className="flex items-center justify-between w-full">
          <span className="text-[9px] text-gray-600">Draw something! ✨</span>
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const ctx = canvas.getContext("2d");
              if (!ctx) return;
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }}
            className="text-[8px] text-blue-600 hover:underline"
          >Clear Canvas</button>
        </div>
      </div>
    </div>
  );
}

// ─── Windows XP Dialog Box (draggable + dismissable) ───
function XPDialog({ title, message, icon, buttons = ["OK"], defaultX = 0, defaultY = 0, zBase = 0, onDismiss }: { title: string; message: string; icon: string; buttons?: string[]; defaultX?: number; defaultY?: number; zBase?: number; onDismiss?: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const [z, setZ] = useState(zBase);
  const dragStart = useRef({ x: 0, y: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7 }}
      whileHover={{ scale: 1.02, transition: { delay: 0, duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="absolute"
      style={{ left: pos.x, top: pos.y, zIndex: z, cursor: dragging ? "grabbing" : "default" }}
      onMouseDown={() => setZ(Date.now() % 10000)}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-titlebar]")) {
          setDragging(true);
          dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
      }}
      onPointerUp={() => setDragging(false)}
    >
      <div className="rounded-t-lg overflow-hidden shadow-2xl" style={{ width: 260, border: "1px solid #0054E3", fontFamily: "Tahoma, sans-serif" }}>
        {/* Title bar — draggable */}
        <div data-titlebar="true" className="flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing select-none" style={{ background: "linear-gradient(180deg, #0A246A, #3A6EA5, #0A246A)" }}>
          <span className="text-[11px] font-bold text-white">{title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
            className="w-[18px] h-[16px] rounded-sm text-[10px] flex items-center justify-center text-white font-bold hover:brightness-110 active:brightness-90"
            style={{ background: "linear-gradient(180deg, #E08070, #C84030)", border: "1px solid #993322" }}
          >✕</button>
        </div>
        {/* Body */}
        <div className="bg-[#ECE9D8] px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">{icon}</span>
            <p className="text-[12px] text-gray-800 leading-relaxed mt-0.5">{message}</p>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {buttons.map((btn) => (
              <button
                key={btn}
                onClick={() => onDismiss?.()}
                className="px-5 py-1 text-[11px] rounded-sm active:translate-y-[1px] hover:brightness-105"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF, #ECE9D8, #D6D0C4)",
                  border: "1px solid #003C74",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset",
                }}
              >{btn}</button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── XP Dialog Stack ───
function XPDialogStack() {
  const [dialogs, setDialogs] = useState([
    { id: 1, title: "Recycle Bin", message: "Are you sure you want to delete ex_boyfriend_pics.zip?", icon: "🗑️", buttons: ["Yes", "ABSOLUTELY"], x: 0, y: 0 },
    { id: 2, title: "MSN Messenger", message: "ur crush is online. Act natural.", icon: "💬", buttons: ["OMG", "Play it cool"], x: 30, y: 35 },
    { id: 3, title: "Webkinz", message: "Your Webkinz is starving. This is a formal warning.", icon: "⚠️", buttons: ["Feed it", "Neglect"], x: 55, y: 70 },
    { id: 4, title: "Error", message: "Ctrl+Z cannot undo your last text.", icon: "❓", buttons: ["Cry", "OK"], x: 15, y: 110 },
  ]);

  const dismiss = (id: number) => setDialogs((d) => d.filter((x) => x.id !== id));

  return (
    <>
      <AnimatePresence>
        {dialogs.map((d, i) => (
          <XPDialog
            key={d.id}
            title={d.title}
            message={d.message}
            icon={d.icon}
            buttons={d.buttons}
            defaultX={d.x}
            defaultY={d.y}
            zBase={i + 1}
            onDismiss={() => dismiss(d.id)}
          />
        ))}
      </AnimatePresence>
      {dialogs.length === 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 text-[11px] rounded-sm"
          style={{
            background: "linear-gradient(180deg, #FFFFFF, #ECE9D8, #D6D0C4)",
            border: "1px solid #003C74",
            fontFamily: "Tahoma, sans-serif",
          }}
          onClick={() => setDialogs([
            { id: Date.now(), title: "Recycle Bin", message: "Are you sure you want to delete ex_boyfriend_pics.zip?", icon: "🗑️", buttons: ["Yes", "ABSOLUTELY"], x: Math.random() * 100, y: Math.random() * 80 },
            { id: Date.now() + 1, title: "MSN Messenger", message: "ur crush is online. Act natural.", icon: "💬", buttons: ["OMG", "Play it cool"], x: 30 + Math.random() * 60, y: 30 + Math.random() * 60 },
            { id: Date.now() + 2, title: "Webkinz", message: "Your Webkinz is starving. This is a formal warning.", icon: "⚠️", buttons: ["Feed it", "Neglect"], x: 50 + Math.random() * 60, y: 60 + Math.random() * 60 },
            { id: Date.now() + 3, title: "Error", message: "Ctrl+Z cannot undo your last text.", icon: "❓", buttons: ["Cry", "OK"], x: 10 + Math.random() * 60, y: 100 + Math.random() * 40 },
          ])}
        >Spawn more errors</motion.button>
      )}
    </>
  );
}

// ─── Interactive Book ───
function InteractiveBook({ cover, title, author }: { cover: string; title: string; author: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen(!open)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="cursor-pointer relative"
      style={{ width: 160, height: 195, perspective: 800 }}
    >
      {/* Back cover — visible when open */}
      <div
        className="absolute top-[8px] left-0 rounded-[4px] overflow-hidden"
        style={{
          width: 126,
          height: 174,
          background: "linear-gradient(180deg, #E8E4DE, #D8D4CE)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08)" }} />
      </div>

      {/* Pages — peeking out the right edge */}
      <motion.div
        className="absolute top-[10px] left-[2px]"
        animate={{ x: open ? 4 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{ width: 124, height: 170 }}
      >
        {[0, 1, 2].map((p) => (
          <motion.div
            key={p}
            className="absolute bg-white rounded-r-[2px]"
            animate={{
              x: open ? 6 + p * 3 : p * 0.5,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: open ? p * 0.03 : 0 }}
            style={{
              top: 2 + p,
              width: 120,
              height: 166 - p * 2,
              boxShadow: "1px 0 2px rgba(0,0,0,0.04)",
            }}
          />
        ))}
      </motion.div>

      {/* Front cover — opens like a real book */}
      <motion.div
        className="absolute top-[8px] left-0 rounded-[4px] overflow-hidden z-10"
        animate={{
          rotateY: open ? -30 : 0,
        }}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
        style={{
          width: 126,
          height: 174,
          boxShadow: open
            ? "4px 2px 16px rgba(0,0,0,0.15)"
            : "0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)",
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
        }}
      >
        <img src={cover} alt={title} className="w-full h-full object-cover" />
        {/* Glossy overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%, rgba(255,255,255,0.05) 60%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.1), inset -2px 0 4px rgba(0,0,0,0.05)" }} />
      </motion.div>

    </div>
  );
}

// ─── iMessage Conversation ───
function IMessageBubbles() {
  const messages = [
    { from: "them", text: "hey r u free to grab coffee?", delay: 0 },
    { from: "me", text: "can't, vibe coding rn", delay: 0.3 },
    { from: "them", text: "it's been 6 hours...", delay: 0.6 },
    { from: "me", text: "wait it's dark outside???", delay: 0.9 },
    { from: "them", text: "taylor.", delay: 1.2 },
    { from: "me", text: "one more component i promise", delay: 1.5 },
    { from: "them", text: "u said that 3 hrs ago 😭", delay: 1.8 },
  ];

  return (
    <div className="w-[240px]">
      {/* iMessage header */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">BFF</span>
        </div>
        <span className="text-[11px] font-medium text-gray-600">iMessage</span>
      </div>
      {/* Messages */}
      <div className="space-y-1.5">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: msg.delay, type: "spring", stiffness: 400, damping: 15 }}
            className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-1.5 rounded-2xl max-w-[180px] ${
                msg.from === "me"
                  ? "bg-blue-500 text-white rounded-br-[4px]"
                  : "bg-gray-200 text-gray-900 rounded-bl-[4px]"
              }`}
            >
              <p className="text-[11px] leading-relaxed">{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {/* Typing indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="flex justify-start"
        >
          <div className="bg-gray-200 rounded-2xl rounded-bl-[4px] px-3 py-2 flex gap-1">
            {[0, 1, 2].map((d) => (
              <motion.div
                key={d}
                className="w-[5px] h-[5px] rounded-full bg-gray-400"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.15 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Claude Character (walks across bottom) ───
function ClaudeWalker() {
  return (
    <div className="absolute bottom-[10px] left-0 right-0 h-[50px] z-30 pointer-events-none">
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-200/40" />
      <motion.div
        className="absolute bottom-[2px]"
        animate={{ x: ["-50px", "calc(100vw + 50px)"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        {/* Claude character — friendly little bot */}
        <svg width="32" height="36" viewBox="0 0 32 36">
          {/* Body */}
          <rect x="6" y="8" width="20" height="16" rx="6" fill="#D97757" />
          {/* Head highlight */}
          <rect x="8" y="10" width="16" height="6" rx="3" fill="#E8956F" opacity="0.5" />
          {/* Eyes */}
          <motion.g animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}>
            <rect x="11" y="14" width="3" height="3" rx="0.5" fill="#5C3A2A" />
            <rect x="18" y="14" width="3" height="3" rx="0.5" fill="#5C3A2A" />
          </motion.g>
          {/* Mouth */}
          <rect x="13" y="19" width="6" height="1.5" rx="0.75" fill="#5C3A2A" />
          {/* Legs — alternating */}
          <motion.g animate={{ rotate: [0, 15, 0, -15, 0] }} transition={{ duration: 0.4, repeat: Infinity }} style={{ transformOrigin: "10px 24px" }}>
            <rect x="9" y="24" width="3" height="8" rx="1.5" fill="#D97757" />
          </motion.g>
          <motion.g animate={{ rotate: [0, -15, 0, 15, 0] }} transition={{ duration: 0.4, repeat: Infinity }} style={{ transformOrigin: "20px 24px" }}>
            <rect x="19" y="24" width="3" height="8" rx="1.5" fill="#D97757" />
          </motion.g>
          {/* Arms */}
          <motion.g animate={{ rotate: [0, -20, 0, 20, 0] }} transition={{ duration: 0.4, repeat: Infinity }} style={{ transformOrigin: "6px 14px" }}>
            <rect x="2" y="12" width="4" height="8" rx="2" fill="#D97757" />
          </motion.g>
          <motion.g animate={{ rotate: [0, 20, 0, -20, 0] }} transition={{ duration: 0.4, repeat: Infinity }} style={{ transformOrigin: "26px 14px" }}>
            <rect x="26" y="12" width="4" height="8" rx="2" fill="#D97757" />
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}

// ─── iOS Notification ───
function IOSNotification() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => setVisible(false)}
      className="cursor-pointer"
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{
          width: 300,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)",
        }}
      >
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-sm">📱</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-900">Screen Time</p>
            <p className="text-[9px] text-gray-400">now</p>
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">You&apos;ve spent 4h 23m in Figma today. That&apos;s 127% more than your daily average.</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── macOS Folder — realistic Finder style ───
function MacFolder({ label, x, y, delay }: { label: string; x: string; y: string; delay: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="absolute flex flex-col items-center cursor-pointer select-none"
      style={{ left: x, top: y }}
      onClick={() => setOpen(!open)}
    >
      <motion.div
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative"
        style={{ width: 80, height: 68 }}
      >
        {/* Files springing out */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ y: 10, opacity: 0, rotate: 0 }}
                animate={{ y: -28, opacity: 1, rotate: -8 }}
                exit={{ y: 10, opacity: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="absolute left-[10px] top-[6px] w-[22px] h-[28px] bg-white rounded-[3px] z-0"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
              >
                <div className="mt-3 mx-1.5 space-y-[2px]">
                  <div className="h-[1.5px] bg-gray-200 rounded-full w-[80%]" />
                  <div className="h-[1.5px] bg-gray-200 rounded-full w-[55%]" />
                  <div className="h-[1.5px] bg-gray-200 rounded-full w-[70%]" />
                </div>
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0, rotate: 0 }}
                animate={{ y: -22, opacity: 1, rotate: 6 }}
                exit={{ y: 10, opacity: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.04 }}
                className="absolute left-[28px] top-[6px] w-[22px] h-[28px] rounded-[3px] z-0 overflow-hidden"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", background: "linear-gradient(135deg, #E8F0FF, #D0E0FF)" }}
              >
                <div className="w-full h-[12px] bg-blue-300/30" />
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0, rotate: 0, x: 0 }}
                animate={{ y: -36, opacity: 1, rotate: -3, x: -4 }}
                exit={{ y: 10, opacity: 0, rotate: 0, x: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.08 }}
                className="absolute left-[18px] top-[6px] w-[20px] h-[24px] bg-white rounded-[3px] z-0"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              >
                <div className="w-full h-full rounded-[3px] overflow-hidden">
                  <div className="w-full h-[10px]" style={{ background: "linear-gradient(135deg, #FFD0D0, #FFB0B0)" }} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Folder icon — real macOS PNG */}
        <img src="/mac-folder.png" alt="folder" className="absolute inset-0 w-full h-full object-contain z-10" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} />
      </motion.div>
      <span className="text-[10px] font-medium text-gray-600 mt-1.5 text-center">{label}</span>
    </motion.div>
  );
}

// ─── Weather App Icon — opens matcha weather ───
function WeatherApp({ x, y, delay }: { x: string; y: string; delay: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="absolute flex flex-col items-center cursor-pointer select-none"
        style={{ left: x, top: y }}
        onClick={() => setOpen(!open)}
      >
        <motion.div
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <img src="/weather-icon.png" alt="Weather" className="w-[56px] h-[56px] rounded-[14px] object-contain" style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.12)" }} />
        </motion.div>
        <span className="text-[10px] font-medium text-gray-600 mt-1.5 text-center">Weather</span>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute left-[58vw] top-[5%] z-50"
          >
            <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setOpen(false)} style={{ width: 260, boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
              <div>
                <img src="/matcha-weather.webp" alt="Matcha Weather Forecast" className="w-full object-contain rounded-xl" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Comical Resume Row — same as ContactInfoRow but grows huge then snaps back ───
function ComicalResumeRow() {
  const [scale, setScale] = useState(1);
  const [showBox, setShowBox] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function animate() {
      // Wait for tagline to finish before starting
      await sleep(18000);
      if (cancelled) return;

      while (!cancelled) {
        // Select it — blue box
        setShowBox(true);
        await sleep(600);
        if (cancelled) return;

        // Grow comically
        for (const s of [1.3, 1.6, 2.0, 2.4]) {
          if (cancelled) return;
          setScale(s);
          await sleep(200);
        }
        await sleep(2000);
        if (cancelled) return;

        // Hide box while sitting large
        setShowBox(false);
        await sleep(3000);
        if (cancelled) return;

        // Show box before resizing
        setShowBox(true);
        await sleep(500);
        if (cancelled) return;

        // Gently resize back
        setScale(1);
        await sleep(800);
        if (cancelled) return;

        setShowBox(false);
        await sleep(200);
        if (cancelled) return;

        setShowBox(false);
        await sleep(10000);
        if (cancelled) return;

        // Loop the grow effect
        setShowBox(true);
        await sleep(600);
      }
    }

    animate();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      animate={{ scale }}
      transition={{ type: "tween", duration: 0.6, ease: "easeInOut" }}
      className="origin-left relative"
    >
      {showBox && (
        <div className="absolute -inset-1 border border-[#0D99FF] rounded-[2px] pointer-events-none z-20">
          <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
          <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
          <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
          <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
        </div>
      )}
      <ContactInfoRow
        icon="/paper-icon.png"
        text="Download Resume.pdf"
        href="/Taylor_Breitzman_Resume.pdf"
        delay={10}
      />
    </motion.div>
  );
}

// ─── Resume Download Box — draws icon, types, selects, scales up comically, settles ───
function ResumeDownloadBox() {
  const [phase, setPhase] = useState<"hidden" | "drawIcon" | "showIcon" | "typing" | "selecting" | "growing" | "shrinking" | "done">("hidden");
  const [typed, setTyped] = useState("");
  const [scale, setScale] = useState(1);
  const fullText = "Download Resume.pdf";

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function animate() {
      await sleep(1500);
      if (cancelled) return;

      while (!cancelled) {
        setTyped("");
        setScale(1);

        // Draw icon box
        setPhase("drawIcon");
        await sleep(500);
        if (cancelled) return;

        // Show icon
        setPhase("showIcon");
        await sleep(400);
        if (cancelled) return;

        // Type text
        setPhase("typing");
        for (let i = 1; i <= fullText.length; i++) {
          if (cancelled) return;
          setTyped(fullText.slice(0, i));
          await sleep(50);
        }
        await sleep(600);
        if (cancelled) return;

        // Select all — blue box appears
        setPhase("selecting");
        await sleep(800);
        if (cancelled) return;

        // Grow comically large
        setPhase("growing");
        for (const s of [1.2, 1.5, 1.8, 2.2, 2.5]) {
          if (cancelled) return;
          setScale(s);
          await sleep(200);
        }
        await sleep(400);
        if (cancelled) return;

        // Shrink back
        setPhase("shrinking");
        setScale(1);
        await sleep(600);
        if (cancelled) return;

        setPhase("done");
        await sleep(6000);
        if (cancelled) return;

        setPhase("hidden");
        await sleep(2000);
      }
    }

    animate();
    return () => { cancelled = true; };
  }, []);

  if (phase === "hidden") return null;

  const showBox = phase === "selecting" || phase === "growing" || phase === "shrinking";
  const showIconImg = phase !== "drawIcon";
  const showHandles = phase === "drawIcon" || showBox;

  return (
    <a
      href="/Taylor_Breitzman_Resume.pdf"
      download
      className="block hover:opacity-80 transition-opacity"
      onClick={(e) => phase !== "done" && e.preventDefault()}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="relative origin-left"
      >
        <div
          className="relative px-3 py-2 rounded-[2px]"
          style={{ border: showHandles ? "1px solid #0D99FF" : "1px solid transparent" }}
        >
          {/* Resize handles */}
          {showHandles && (
            <>
              <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
              <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
              <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
              <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            </>
          )}

          <div className="flex items-center gap-2">
            {/* Icon with draw-in */}
            <div className="relative w-5 h-5 shrink-0">
              {phase === "drawIcon" && (
                <div className="absolute inset-0 border border-[#0D99FF] rounded-[2px]" />
              )}
              <img
                src="/paper-icon.png"
                alt=""
                className="w-full h-full object-contain transition-opacity duration-200"
                style={{ opacity: showIconImg ? 1 : 0 }}
              />
            </div>

            {/* Text */}
            <span className={`text-[14px] whitespace-nowrap font-medium ${showBox ? "text-gray-900" : "text-gray-700"}`}>
              {typed}
            </span>
            {phase === "typing" && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-[1px] h-[14px] bg-[#1D1D1F]"
              />
            )}
          </div>
        </div>
      </motion.div>
    </a>
  );
}

// ─── Resume Tagline — typing animation on right side ───
function ResumeTagline() {
  const [phase, setPhase] = useState<"hidden" | "typing1" | "typing2" | "selecting3x" | "bold3x" | "typing3" | "selectingLine3" | "fontChange" | "done">("hidden");
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [text3, setText3] = useState("");
  const [bold3x, setBold3x] = useState(false);
  const [showLine3, setShowLine3] = useState(false);
  const [line3Font, setLine3Font] = useState<"normal" | "serif">("normal");
  const [funSize, setFunSize] = useState(15);
  const line1 = "I bridge design and engineering...";
  const line2 = "and use AI to do it 10x faster.";
  const line3 = "while keeping things fun!!!";

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function animate() {
      await sleep(2000);
      if (cancelled) return;

      setPhase("typing1");
      for (let i = 1; i <= line1.length; i++) {
        if (cancelled) return;
        setText1(line1.slice(0, i));
        await sleep(40);
      }
      await sleep(400);
      if (cancelled) return;

      setPhase("typing2");
      for (let i = 1; i <= line2.length; i++) {
        if (cancelled) return;
        setText2(line2.slice(0, i));
        await sleep(40);
      }
      await sleep(800);
      if (cancelled) return;

      // Select 3x
      setPhase("selecting3x");
      await sleep(600);
      if (cancelled) return;

      // Bold it
      setBold3x(true);
      setPhase("bold3x");
      await sleep(1000);
      if (cancelled) return;

      // Type line 3
      setShowLine3(true);
      setPhase("typing3");
      for (let i = 1; i <= line3.length; i++) {
        if (cancelled) return;
        setText3(line3.slice(0, i));
        await sleep(40);
      }
      await sleep(800);
      if (cancelled) return;

      // Select "fun"
      setPhase("selectingLine3");
      await sleep(600);
      if (cancelled) return;

      // Grow "fun" bigger and bigger
      setPhase("fontChange");
      for (const size of [18, 22, 26, 32, 38]) {
        if (cancelled) return;
        setFunSize(size);
        await sleep(250);
      }
      await sleep(500);
      if (cancelled) return;

      setPhase("done");
    }

    animate();
    return () => { cancelled = true; };
  }, []);

  if (phase === "hidden") return null;

  const typingMain = phase === "typing1" || phase === "typing2";
  const typingLine3 = phase === "typing3";

  return (
    <div className="relative space-y-3">
      <div
        className="relative px-3 py-2 rounded-[2px]"
        style={{ border: typingMain ? "1px solid #0D99FF" : "1px solid transparent" }}
      >
        {typingMain && (
          <>
            <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
          </>
        )}
        <p className="text-[16px] text-gray-900 leading-relaxed font-normal">
          {text1}
          {text1.length > 0 && text2.length > 0 && <br />}
          {text2.length > 0 && (
            text2.includes("10x") ? (
              <>
                {text2.split("10x")[0]}
                <span className={`${phase === "selecting3x" ? "bg-[#0D99FF]/20" : ""} ${bold3x ? "font-bold" : ""} transition-all duration-200`}>10x</span>
                {text2.split("10x")[1]}
              </>
            ) : text2
          )}
          {typingMain && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-[1px] h-[14px] bg-[#1D1D1F] ml-[1px] align-text-bottom"
            />
          )}
        </p>
      </div>
      {showLine3 && (
        <div
          className="relative px-3 py-2 rounded-[2px]"
          style={{ border: typingLine3 ? "1px solid #0D99FF" : "1px solid transparent" }}
        >
          {typingLine3 && (
            <>
              <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
              <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
              <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
              <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            </>
          )}
          <p className="text-[15px] text-gray-500 leading-relaxed transition-all duration-300">
            {phase !== "typing3" && text3.includes("fun!!!") ? (
              <>
                {text3.split("fun!!!")[0]}
                <span
                  className={`${phase === "selectingLine3" ? "bg-[#0D99FF]/20" : ""} font-bold transition-all duration-200 inline-block`}
                  style={{ fontSize: funSize, color: funSize > 20 ? "#D46CB3" : "inherit" }}
                >fun!!!</span>
              </>
            ) : text3}
            {typingLine3 && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-[1px] h-[14px] bg-[#1D1D1F] ml-[1px] align-text-bottom"
              />
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Contact Info Row — Figma-style draw icon then type text ───
function ContactInfoRow({ icon, emoji, text, href, delay }: { icon?: string; emoji?: string; text: string; href?: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function animate() {
      await sleep(delay * 1000);
      if (cancelled) return;

      setVisible(true);
      await sleep(400);
      if (cancelled) return;

      setShowIcon(true);
      await sleep(400);
      if (cancelled) return;

      setTyping(true);
      for (let i = 1; i <= text.length; i++) {
        if (cancelled) return;
        setTyped(text.slice(0, i));
        await sleep(40);
      }
      await sleep(200);
      setTyping(false);
    }

    animate();
    return () => { cancelled = true; };
  }, [delay, text]);

  const row = (
    <div
      className="flex items-center gap-3 transition-opacity duration-300"
      style={{ height: 36, opacity: visible ? 1 : 0 }}
    >
      {/* Icon */}
      <div
        className="relative shrink-0 rounded-[8px]"
        style={{ width: 36, height: 36 }}
      >
        {icon && <img src={icon} alt="" className="w-full h-full object-cover rounded-[8px] transition-all duration-300" style={{ opacity: showIcon ? 1 : 0, transform: showIcon ? "scale(1)" : "scale(0.5)" }} />}
        {emoji && <div className="w-full h-full flex items-center justify-center text-xl transition-all duration-300" style={{ opacity: showIcon ? 1 : 0, transform: showIcon ? "scale(1)" : "scale(0.5)" }}>{emoji}</div>}
        {visible && !showIcon && (
          <div className="absolute inset-0 border border-[#0D99FF] rounded-[8px]" />
        )}
      </div>

      {/* Text */}
      <div>
        <span className="text-sm text-gray-700">{typed}</span>
        {typing && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-[1px] h-[12px] bg-[#1D1D1F] ml-[1px] align-text-bottom"
          />
        )}
      </div>
    </div>
  );

  if (href && !typing && typed.length === text.length) {
    const isDownload = href.endsWith(".pdf");
    return <a href={href} target={isDownload ? undefined : "_blank"} rel={isDownload ? undefined : "noopener noreferrer"} download={isDownload || undefined} className="hover:opacity-70 transition-opacity">{row}</a>;
  }

  return row;
}

// ─── Contact Photo Frame — draws, fills, rounds, rotates ───
function ContactPhotoFrame() {
  const [phase, setPhase] = useState<"hidden" | "drawing" | "empty" | "filling" | "rounding" | "rotating" | "done">("hidden");

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function animate() {
      while (!cancelled) {
        setPhase("hidden");
        await sleep(1000);
        if (cancelled) return;

        setPhase("drawing");
        await sleep(1000);
        if (cancelled) return;

        setPhase("empty");
        await sleep(800);
        if (cancelled) return;

        setPhase("filling");
        await sleep(1200);
        if (cancelled) return;

        setPhase("rounding");
        await sleep(1200);
        if (cancelled) return;

        setPhase("rotating");
        await sleep(1000);
        if (cancelled) return;

        setPhase("done");
        await sleep(4000);
        if (cancelled) return;
      }
    }

    animate();
    return () => { cancelled = true; };
  }, []);

  const showPhoto = phase !== "hidden" && phase !== "drawing" && phase !== "empty";
  const isRounded = phase === "rounding" || phase === "rotating" || phase === "done";
  const isRotated = phase === "rotating" || phase === "done";
  const showHandles = phase !== "done" && phase !== "hidden";
  const isVisible = phase !== "hidden";

  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      <motion.div
        className="relative overflow-hidden"
        animate={{
          width: isVisible ? 160 : 0,
          height: isVisible ? 160 : 0,
          borderRadius: isRounded ? 9999 : 4,
          rotate: isRotated ? -6 : 0,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          width: { duration: 0.5, ease: "easeOut" },
          height: { duration: 0.5, ease: "easeOut" },
          borderRadius: { duration: 0.6, ease: "easeInOut" },
          rotate: { type: "spring", stiffness: 200, damping: 15 },
          opacity: { duration: 0.3 },
        }}
        style={{ boxShadow: phase === "done" ? "0 8px 30px rgba(0,0,0,0.12)" : "none" }}
      >
        {/* Blue bounding box */}
        {showHandles && (
          <div className="absolute inset-0 border border-[#0D99FF] z-20" style={{ borderRadius: "inherit" }}>
            {!isRounded && <>
              <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
              <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
              <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
              <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            </>}
          </div>
        )}

        {/* Empty checkerboard */}
        {(phase === "empty" || phase === "drawing") && (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }}
          />
        )}

        {/* Photo */}
        {showPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <img src="/taylor.jpeg" alt="Taylor" className="w-full h-full object-cover" />
          </motion.div>
        )}

        {/* Crosshair during drawing */}
        {phase === "drawing" && (
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-[20px] h-[1px] bg-[#0D99FF]" />
            <div className="absolute w-[1px] h-[20px] bg-[#0D99FF]" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Figma Photo Frame — draws rectangle then fills with photo ───
function FigmaPhotoFrame() {
  const [phase, setPhase] = useState<"hidden" | "drawing" | "empty" | "filling" | "bw" | "saturate" | "normal" | "done">("hidden");
  const showPhoto = phase !== "hidden" && phase !== "drawing" && phase !== "empty";
  const [filter, setFilter] = useState("none");

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function animate() {
      await sleep(2000);
      if (cancelled) return;

      while (!cancelled) {
        setFilter("none");
        setPhase("drawing");
        await sleep(800);
        if (cancelled) return;

        setPhase("empty");
        await sleep(1000);
        if (cancelled) return;

        setPhase("filling");
        await sleep(800);
        if (cancelled) return;

        // Go black and white
        setPhase("bw");
        setFilter("grayscale(1) contrast(1.1)");
        await sleep(1500);
        if (cancelled) return;

        // Boost saturation
        setPhase("saturate");
        setFilter("saturate(1.4) contrast(1.05)");
        await sleep(1500);
        if (cancelled) return;

        // Back to normal with slight warmth
        setPhase("normal");
        setFilter("sepia(0.1) saturate(1.1)");
        await sleep(1200);
        if (cancelled) return;

        setPhase("done");
        setFilter("none");
        await sleep(6000);
        if (cancelled) return;

        setPhase("hidden");
        await sleep(3000);
      }
    }

    animate();
    return () => { cancelled = true; };
  }, []);

  if (phase === "hidden") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute left-[2vw] top-[20%]"
    >
      <motion.div
        className="relative overflow-hidden"
        initial={{ width: 0, height: 0 }}
        animate={{
          width: phase === "drawing" ? 180 : 180,
          height: phase === "drawing" ? 220 : 220,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Blue bounding box */}
        {phase !== "done" && (
          <div className="absolute inset-0 border border-[#0D99FF] rounded-[2px]">
            <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
          </div>
        )}

        {/* Empty state — checkerboard */}
        {(phase === "empty" || phase === "drawing") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
            style={{
              backgroundImage: "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }}
          />
        )}

        {/* Photo fading in with filter cycling */}
        {showPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <img
              src="/taylor-selfie.jpg"
              alt="Taylor"
              className="w-full h-full object-cover rounded-[2px] transition-[filter] duration-500"
              style={{ filter }}
            />
          </motion.div>
        )}

        {/* Figma crosshair in center during drawing */}
        {phase === "drawing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-[20px] h-[1px] bg-[#0D99FF]" />
            <div className="absolute w-[1px] h-[20px] bg-[#0D99FF]" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Figma "Let's work together" text box ───
function FigmaWorkTogether() {
  const [phase, setPhase] = useState<"hidden" | "drawing" | "typing" | "selecting" | "fontChange" | "bold" | "done">("hidden");
  const [text, setText] = useState("");
  const [fontStyle, setFontStyle] = useState<"normal" | "serif" | "cursive">("normal");
  const fullText = "Let's work together";

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function animate() {
      await sleep(2000);
      if (cancelled) return;

      while (!cancelled) {
        setFontStyle("normal");
        setPhase("drawing");
        await sleep(500);
        if (cancelled) return;

        // Type
        setPhase("typing");
        for (let i = 1; i <= fullText.length; i++) {
          if (cancelled) return;
          setText(fullText.slice(0, i));
          await sleep(60);
        }
        await sleep(600);
        if (cancelled) return;

        // Add !!!
        for (const char of "!!!") {
          if (cancelled) return;
          setText((prev) => prev + char);
          await sleep(150);
        }
        await sleep(800);
        if (cancelled) return;

        // Select "work"
        setPhase("selecting");
        await sleep(800);
        if (cancelled) return;

        // Change font to cursive
        setPhase("fontChange");
        setFontStyle("cursive");
        await sleep(1200);
        if (cancelled) return;

        // Change to serif
        setFontStyle("serif");
        await sleep(1200);
        if (cancelled) return;

        // Bold phase
        setPhase("bold");
        await sleep(3000);
        if (cancelled) return;

        // Done
        setPhase("done");
        await sleep(5000);
        if (cancelled) return;

        // Reset
        setText("");
        setPhase("hidden");
        await sleep(2000);
      }
    }

    animate();
    return () => { cancelled = true; };
  }, []);

  if (phase === "hidden") return null;

  const renderText = () => {
    const full = text;
    const workIdx = full.indexOf("work");
    if (workIdx === -1 || phase === "typing" || phase === "drawing") {
      return <span>{full}</span>;
    }
    const before = full.slice(0, workIdx);
    const word = "work";
    const after = full.slice(workIdx + 4);
    return (
      <>
        <span>{before}</span>
        <span
          className={phase === "selecting" ? "bg-[#0D99FF]/20" : ""}
          style={{
            fontFamily: fontStyle === "cursive" ? "var(--font-radley), Georgia, serif" : fontStyle === "serif" ? "var(--font-playfair), Georgia, serif" : "inherit",
            fontWeight: phase === "bold" || phase === "done" ? 700 : 400,
            fontStyle: fontStyle === "cursive" ? "italic" : "normal",
          }}
        >{word}</span>
        <span>{after}</span>
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative"
    >
      <motion.div
        className="relative border rounded-[2px] px-3 py-2"
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: "auto",
          height: "auto",
          opacity: 1,
          borderColor: phase === "done" ? "transparent" : "#0D99FF",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ borderWidth: 1 }}
      >
        {phase !== "done" && (
          <>
            <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
          </>
        )}

        <span className="text-xl whitespace-nowrap select-none text-gray-900">
          {renderText()}
        </span>

        {(phase === "typing" || phase === "drawing") && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-[1px] h-[14px] bg-[#1D1D1F] ml-[1px] align-text-bottom"
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── About Me Folder — opens iOS Notes ───
function AboutMeFolder({ x, y, delay }: { x: string; y: string; delay: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="absolute flex flex-col items-center cursor-pointer select-none"
        style={{ left: x, top: y }}
        onClick={() => setOpen(!open)}
      >
        <motion.div
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="relative"
          style={{ width: 80, height: 68 }}
        >
          <img src="/mac-folder.png" alt="folder" className="absolute inset-0 w-full h-full object-contain z-10" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} />
        </motion.div>
        <span className="text-[10px] font-medium text-gray-600 mt-1.5 text-center">about me</span>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute left-[35vw] top-[5%] z-50"
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{
                width: 420,
                background: "#FFFFFF",
                boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.06)",
              }}
            >
              {/* macOS titlebar */}
              <div className="flex items-center px-3 py-2.5 border-b border-gray-200 bg-[#F6F6F6]">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setOpen(false)} className="w-[12px] h-[12px] rounded-full" style={{ background: "#FF5F56" }} />
                  <div className="w-[12px] h-[12px] rounded-full" style={{ background: "#FFBD2E" }} />
                  <div className="w-[12px] h-[12px] rounded-full" style={{ background: "#27C93F" }} />
                </div>
                <span className="flex-1 text-center text-[12px] font-bold text-gray-700">About Me</span>
              </div>
              {/* Note content */}
              <div className="px-5 py-5" style={{ background: "#FFFFFF" }}>
                <p className="text-[18px] font-bold text-gray-900 mb-1">about me</p>
                <p className="text-[10px] text-gray-400 mb-4">April 24, 2026</p>
                <div className="text-[13px] text-gray-700 space-y-3" style={{ lineHeight: 1.7 }}>
                  <p>I grew up obsessed with tech — but my version of it. GirlsGoGames, my pink DS, my iPod Nano. My dad and brother kept me surrounded and inspired by it, so it never occurred to me that it wasn&apos;t for me. I never saw the gender gap because no one told me it existed.</p>
                  <p>I studied computer science and built a career as an engineer — Spotify, Nike. But along the way I realized my passion wasn&apos;t just in how things work. It was in how they feel. I kept gravitating toward the design side, the interaction side, the &quot;make it feel alive&quot; side.</p>
                  <p>I&apos;ve been the only girl in the room more times than I can count. I&apos;ve had my work dismissed as &quot;just aesthetics&quot; by people who didn&apos;t realize I wrote the code too.</p>
                  <p>The truth is, I do both. I design what I build and I build what I design. And as AI makes everyone faster, I think the human stuff — personality, emotion, whimsy — becomes the thing that actually matters.</p>
                  <p>This page is proof of that. The &quot;Now&quot; side is who I am today and the &quot;Then&quot; side is where it all started — the nostalgia, the fun, the y2k girly tech kid. Both sides are me.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Now Playing Pill ───
function NowPlayingPill() {
  const tracks = [
    { title: "Risk", artist: "Gracie Abrams", cover: "/gracie.png" },
    { title: "Cruel Summer", artist: "Taylor Swift", cover: "/taylor-swift-1989.png" },
  ];
  const [trackIdx, setTrackIdx] = useState(0);
  const track = tracks[trackIdx];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -2, transition: { delay: 0, duration: 0.2 } }}
      transition={{ delay: 0.7, type: "spring" }}
      className="md:absolute left-auto md:left-[36vw] bottom-auto md:bottom-[26%]"
    >
      <div
        className="rounded-[28px] pl-2 pr-3 py-2 flex items-center gap-3"
        style={{
          width: 300,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* Album art */}
        <AnimatePresence mode="wait">
          <motion.div
            key={track.cover}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-md"
          >
            <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
          </motion.div>
        </AnimatePresence>
        {/* Song info */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={track.title} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -5, opacity: 0 }} transition={{ duration: 0.15 }}>
              <p className="text-[13px] font-semibold text-gray-900 truncate">{track.title}</p>
              <p className="text-[11px] text-gray-500 truncate">{track.artist}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setTrackIdx((i) => (i - 1 + tracks.length) % tracks.length)}
            className="text-gray-400 hover:text-gray-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setTrackIdx((i) => (i + 1) % tracks.length)}
            className="text-gray-400 hover:text-gray-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </motion.button>
          {/* Waveform */}
          <div className="flex items-end gap-[2px] h-[18px] ml-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full bg-pink-500"
                animate={{ height: [4, 10 + Math.random() * 6, 4, 12 + Math.random() * 4, 6] }}
                transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Xcode Crash Dialog ───
function XcodeCrash() {
  const [visible, setVisible] = useState(true);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setVisible(true), 3000);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.03, y: -2, transition: { delay: 0, duration: 0.2 } }}
      transition={{ delay: 1.2, type: "spring", stiffness: 300, damping: 20 }}
      className="md:absolute right-auto md:right-[6vw] bottom-auto md:bottom-[38%] z-40 cursor-pointer"
      onClick={dismiss}
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{
          width: 300,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div className="w-9 h-9 rounded-[10px] overflow-hidden shrink-0 shadow-sm">
          <img src="/xcode-icon.webp" alt="Xcode" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-900">Xcode</p>
            <p className="text-[9px] text-gray-400">now</p>
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">Xcode quit unexpectedly. It saw your code and chose peace.</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Image Folder — opens a preview window with an image ───
function ImageFolder({ x, y, delay, label, image }: { x: string; y: string; delay: number; label: string; image: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="absolute flex flex-col items-center cursor-pointer select-none"
        style={{ left: x, top: y }}
        onClick={() => setOpen(!open)}
      >
        <motion.div
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="relative"
          style={{ width: 80, height: 68 }}
        >
          <img src="/mac-folder.png" alt="folder" className="absolute inset-0 w-full h-full object-contain z-10" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} />
        </motion.div>
        <span className="text-[10px] font-medium text-gray-600 mt-1.5 text-center">{label}</span>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute left-[38vw] top-[5%] z-50"
          >
            <div className="rounded-xl overflow-hidden" style={{ width: 240, boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
              {/* macOS Preview toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#F6F6F6] border-b border-gray-200">
                <div className="flex gap-[6px]">
                  <button onClick={() => setOpen(false)} className="w-[10px] h-[10px] rounded-full bg-[#FF5F56] hover:brightness-90" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#FFBD2E]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#27C93F]" />
                </div>
                <span className="text-[9px] text-gray-500">{label}</span>
                <div style={{ width: 40 }} />
              </div>
              {/* Image */}
              <div className="bg-black">
                <img src={image} alt={label} className="w-full object-contain" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Notes Folder — opens iOS Notes ───
function NotesFolder({ x, y, delay }: { x: string; y: string; delay: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="absolute flex flex-col items-center cursor-pointer select-none"
        style={{ left: x, top: y }}
        onClick={() => setOpen(!open)}
      >
        <motion.div
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="relative"
          style={{ width: 80, height: 68 }}
        >
          <img src="/mac-folder.png" alt="folder" className="absolute inset-0 w-full h-full object-contain z-10" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} />
        </motion.div>
        <span className="text-[10px] font-medium text-gray-600 mt-1.5 text-center">notes</span>
      </motion.div>

      {/* iOS Notes window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute left-[25vw] top-[6%] z-50"
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{
                width: 280,
                background: "#FFFFFF",
                boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.06)",
              }}
            >
              {/* macOS-style titlebar */}
              <div className="flex items-center px-3 py-2.5 border-b border-gray-200 bg-[#F6F6F6]">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setOpen(false)} className="w-[12px] h-[12px] rounded-full" style={{ background: "#FF5F56" }} />
                  <div className="w-[12px] h-[12px] rounded-full" style={{ background: "#FFBD2E" }} />
                  <div className="w-[12px] h-[12px] rounded-full" style={{ background: "#27C93F" }} />
                </div>
                <span className="flex-1 text-center text-[12px] font-bold text-gray-700">New Note</span>
              </div>
              {/* Note content */}
              <div className="px-4 py-4" style={{ background: "#FFFFFF", minHeight: 220 }}>
                <p className="text-[18px] font-bold text-gray-900 mb-1">design philosophy</p>
                <p className="text-[10px] text-gray-400 mb-4">April 24, 2026</p>
                <div className="space-y-2.5 text-[13px] text-gray-700" style={{ lineHeight: 1.6 }}>
                  <p>- confusion is a design bug</p>
                  <p>- clean and polished, but never boring</p>
                  <p>- the small details are the whole point</p>
                  <p>- if it doesn&apos;t feel good to tap, it&apos;s not done</p>
                  <p>- personality and polish aren&apos;t opposites</p>
                  <p>- every interaction should feel considered, because it is</p>
                  <p>- good design works beautifully and scales</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── macOS App Folder — springs out app icons ───
function MacAppFolder({ x, y, delay }: { x: string; y: string; delay: number }) {
  const [open, setOpen] = useState(false);

  const apps = [
    { name: "Spotify", icon: "/logos/spotify.png", x: -30, y: -45, rotate: -10 },
    { name: "Pinterest", icon: "/pinterest-icon.avif", x: 25, y: -55, rotate: 8 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="absolute flex flex-col items-center cursor-pointer select-none"
      style={{ left: x, top: y }}
      onClick={() => setOpen(!open)}
    >
      <motion.div
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative"
        style={{ width: 80, height: 68 }}
      >
        {/* App icons springing out */}
        <AnimatePresence>
          {open && apps.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ y: 10, opacity: 0, scale: 0.3, rotate: 0 }}
              animate={{ y: app.y, x: app.x, opacity: 1, scale: 1, rotate: app.rotate }}
              exit={{ y: 10, x: 0, opacity: 0, scale: 0.3, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: i * 0.05 }}
              className="absolute left-[12px] top-[4px] z-0"
            >
              <img src={app.icon} alt={app.name} className={`object-contain rounded-[10px] ${app.name === "Pinterest" ? "w-[70px] h-[70px]" : "w-[42px] h-[42px]"}`} style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.15))" }} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Folder icon */}
        <img src="/mac-folder.png" alt="folder" className="absolute inset-0 w-full h-full object-contain z-10" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} />
      </motion.div>
      <span className="text-[10px] font-medium text-gray-600 mt-1.5 text-center">fav apps</span>
    </motion.div>
  );
}

// ─── Spotify Player ───
function SpotifyPlayer() {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 0.5));
    }, 100);
    return () => clearInterval(interval);
  }, [playing]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        width: 280,
        background: "linear-gradient(180deg, #2A1A3A, #1A1A2E, #121212)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}
    >
      {/* Album art */}
      <div className="relative">
        <div className="w-full aspect-square bg-gradient-to-br from-[#3D2C4E] to-[#1A1020] flex items-center justify-center p-6">
          <div className="w-full h-full rounded-md overflow-hidden relative">
            <img src="/gracie.png" alt="The Secret of Us" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Song info */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-white">Risk</p>
            <p className="text-[12px] text-gray-400">Gracie Abrams</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="text-green-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </motion.button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-1">
        <div className="w-full h-[3px] bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-500">{Math.floor(progress * 2.16 / 60)}:{String(Math.floor(progress * 2.16 % 60)).padStart(2, "0")}</span>
          <span className="text-[9px] text-gray-500">3:36</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 px-5 pb-5 pt-2">
        <button className="text-gray-400 hover:text-white transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setPlaying(!playing)}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#121212"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#121212"><path d="M8 5v14l11-7z"/></svg>
          )}
        </motion.button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── AirDrop Popup ───
function AirDropPopup() {
  const [accepted, setAccepted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      layout
      className="rounded-[20px] overflow-hidden"
      style={{
        width: 260,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="pt-5 pb-2 text-center">
        <p className="text-[15px] font-bold text-gray-900">AirDrop</p>
        <p className="text-[12px] text-gray-500 mt-0.5">Taylor would like to share a file</p>
      </div>

      {/* File preview — orange shimmer gradient */}
      <div className="mx-4 mb-3 rounded-xl overflow-hidden relative" style={{ height: 180, background: "linear-gradient(135deg, #FF9A56, #FF6B35, #FF4444, #FF6B35, #FFAA66)" }}>
        {/* Shimmer */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.2) 55%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
        />
      </div>

      {/* Buttons */}
      {!accepted ? (
        <div className="flex border-t border-gray-200/60">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 py-3 text-[14px] text-blue-500 font-medium border-r border-gray-200/60 active:bg-gray-100/50"
          >
            Decline
          </button>
          <button
            onClick={() => setAccepted(true)}
            className="flex-1 py-3 text-[14px] text-blue-500 font-bold active:bg-gray-100/50"
          >
            Accept
          </button>
        </div>
      ) : (
        <div className="py-3 text-center">
          <p className="text-[12px] text-gray-500">Saved to Photos</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Clippy ───
function Clippy() {
  const [visible, setVisible] = useState(true);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 300, damping: 15 }}
      className="flex flex-col items-center"
    >
      {/* Speech bubble */}
      <div className="bg-[#FFFFCC] border-2 border-gray-800 rounded-lg px-3 py-2 mb-1 relative shadow-md" style={{ maxWidth: 180, fontFamily: "Tahoma, sans-serif" }}>
        <p className="text-[10px] text-gray-800 leading-relaxed">It looks like you&apos;re building a portfolio. Would you like help?</p>
        <div className="flex gap-1.5 mt-2">
          <button onClick={() => setVisible(false)} className="text-[9px] px-2 py-0.5 bg-white border border-gray-400 rounded-sm hover:bg-gray-100">Yes please!</button>
          <button onClick={() => setVisible(false)} className="text-[9px] px-2 py-0.5 bg-white border border-gray-400 rounded-sm hover:bg-gray-100">Go away</button>
        </div>
        {/* Triangle pointer */}
        <div className="absolute -bottom-[8px] left-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-gray-800" />
        <div className="absolute -bottom-[6px] left-[26px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-[#FFFFCC]" />
      </div>
      {/* Clippy body */}
      <svg width="50" height="60" viewBox="0 0 50 60">
        {/* Wire body */}
        <path d="M25 5 C25 5, 15 10, 15 20 C15 30, 20 32, 20 38 C20 44, 15 48, 25 52 C35 48, 30 44, 30 38 C30 32, 35 30, 35 20 C35 10, 25 5, 25 5" fill="none" stroke="#808080" strokeWidth="3" />
        <path d="M25 5 C25 5, 15 10, 15 20 C15 30, 20 32, 20 38 C20 44, 15 48, 25 52 C35 48, 30 44, 30 38 C30 32, 35 30, 35 20 C35 10, 25 5, 25 5" fill="none" stroke="#C0C0C0" strokeWidth="2" />
        {/* Eyes */}
        <ellipse cx="21" cy="18" rx="4" ry={blink ? 0.5 : 4} fill="white" stroke="#808080" strokeWidth="1" />
        <ellipse cx="29" cy="18" rx="4" ry={blink ? 0.5 : 4} fill="white" stroke="#808080" strokeWidth="1" />
        {!blink && <>
          <circle cx="22" cy="18" r="2" fill="#333" />
          <circle cx="30" cy="18" r="2" fill="#333" />
          <circle cx="22.5" cy="17" r="0.7" fill="white" />
          <circle cx="30.5" cy="17" r="0.7" fill="white" />
        </>}
        {/* Eyebrows */}
        <path d="M17 13 Q21 11, 25 13" fill="none" stroke="#808080" strokeWidth="1" />
        <path d="M25 13 Q29 11, 33 13" fill="none" stroke="#808080" strokeWidth="1" />
      </svg>
    </motion.div>
  );
}

// ─── Winamp ───
function Winamp() {
  const [playing, setPlaying] = useState(true);

  return (
    <div style={{ width: 200, fontFamily: "Tahoma, sans-serif" }}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-1 py-0.5 rounded-t-sm" style={{ background: "linear-gradient(180deg, #1A1A2E, #2D2D44)" }}>
        <div className="flex items-center gap-1">
          <span className="text-[7px] text-green-400 font-bold">⚡</span>
          <span className="text-[8px] text-green-400 font-bold tracking-wide">WINAMP</span>
        </div>
        <div className="flex gap-[2px]">
          <div className="w-[10px] h-[8px] rounded-sm text-[6px] flex items-center justify-center text-green-400 bg-[#2D2D44] border border-[#444]">_</div>
          <div className="w-[10px] h-[8px] rounded-sm text-[6px] flex items-center justify-center text-green-400 bg-[#2D2D44] border border-[#444]">✕</div>
        </div>
      </div>
      {/* Display */}
      <div className="px-2 py-1.5" style={{ background: "#0A0A12" }}>
        {/* Song info — scrolling */}
        <div className="overflow-hidden mb-1">
          <motion.p
            className="text-[9px] text-green-400 whitespace-nowrap"
            animate={{ x: [0, -200] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            SZA - Kill Bill &nbsp;&nbsp;&nbsp; *** &nbsp;&nbsp;&nbsp; SZA - Kill Bill &nbsp;&nbsp;&nbsp; ***
          </motion.p>
        </div>
        {/* Visualizer bars */}
        <div className="flex items-end gap-[1px] h-[20px] mb-1">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="w-[7px] rounded-t-[1px]"
              style={{ background: "linear-gradient(180deg, #FF0000, #FFFF00, #00FF00)" }}
              animate={playing ? { height: [4 + Math.random() * 12, 2 + Math.random() * 16, 6 + Math.random() * 10] } : { height: 2 }}
              transition={{ duration: 0.3 + Math.random() * 0.2, repeat: Infinity, repeatType: "mirror" }}
            />
          ))}
        </div>
        {/* Time */}
        <div className="flex justify-between items-center">
          <span className="text-[8px] text-green-400/70">03:24</span>
          <span className="text-[7px] text-green-400/50">128kbps</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="px-2 py-1" style={{ background: "#1A1A2E" }}>
        <div className="w-full h-[3px] bg-[#0A0A12] rounded-full">
          <motion.div className="h-full bg-green-500 rounded-full" animate={{ width: ["0%", "100%"] }} transition={{ duration: 20, repeat: Infinity }} />
        </div>
      </div>
      {/* Controls */}
      <div className="flex items-center justify-center gap-1 px-2 py-1 rounded-b-sm" style={{ background: "#1A1A2E" }}>
        {["⏮", "⏪", playing ? "⏸" : "▶", "⏩", "⏭", "⏹"].map((btn, i) => (
          <button
            key={i}
            onClick={i === 2 ? () => setPlaying(!playing) : undefined}
            className="w-[22px] h-[14px] rounded-sm text-[8px] flex items-center justify-center text-green-400 hover:text-green-300"
            style={{ background: "#2D2D44", border: "1px solid #444" }}
          >{btn}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Limewire Download ───
function LimewireDownload() {
  return (
    <div className="rounded-t-sm overflow-hidden shadow-lg" style={{ width: 260, border: "1px solid #0054E3", fontFamily: "Tahoma, sans-serif" }}>
      <div className="flex items-center justify-between px-2 py-0.5" style={{ background: "linear-gradient(180deg, #0A246A, #3A6EA5, #0A246A)" }}>
        <span className="text-[9px] font-bold text-white">🍋 LimeWire 4.18.8</span>
        <div className="flex gap-[2px]">
          <div className="w-[14px] h-[12px] rounded-sm text-[8px] flex items-center justify-center text-black" style={{ background: "#C0C0C0" }}>_</div>
          <div className="w-[14px] h-[12px] rounded-sm text-[8px] flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(180deg, #E08070, #C84030)" }}>✕</div>
        </div>
      </div>
      <div className="bg-[#ECE9D8] p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <div>
            <p className="text-[9px] text-gray-800 font-bold">taylor_resume_FINAL.pdf.exe</p>
            <p className="text-[8px] text-gray-500">From: xX_t0tAlLy_SaFe_Xx</p>
          </div>
        </div>
        {/* Progress bar */}
        <div>
          <div className="w-full h-[14px] bg-white border border-gray-400 rounded-sm overflow-hidden">
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #00AA00, #00CC00, #00AA00)" }}
              animate={{ width: ["0%", "73%"] }}
              transition={{ duration: 12, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[8px] text-gray-500">73% complete</span>
            <span className="text-[8px] text-gray-500">2.1 MB of 2.9 MB</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[8px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>⬇️ 14.2 KB/s</span>
            <span>ETA: forever lol</span>
          </div>
          <a
            href="/Taylor_Breitzman_Resume.pdf"
            download
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-0.5 text-[8px] font-bold text-white rounded-sm hover:brightness-110"
            style={{ background: "linear-gradient(180deg, #00AA00, #008800)", border: "1px solid #006600" }}
          >Actually Download</a>
        </div>
      </div>
    </div>
  );
}

// ─── Y2K Loading Screen ───
// ─── Internet Explorer — opens Webkinz ───
function IEBrowser() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* IE Icon */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.08, y: -3, transition: { delay: 0, duration: 0.2 } }}
        whileTap={{ scale: 0.92, transition: { delay: 0, duration: 0.1 } }}
        transition={{ delay: 0.2 }}
        onClick={() => setOpen(!open)}
        className="absolute flex flex-col items-center cursor-pointer select-none"
        style={{ left: "54vw", top: "8%" }}
      >
        <img src="/ie-icon.png" alt="Internet Explorer" className="w-[72px] h-[72px] object-contain" style={{ imageRendering: "pixelated" }} />
      </motion.div>

      {/* Browser window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute left-[20vw] top-[5%] z-50"
          >
            <div className="rounded-t-sm overflow-hidden shadow-2xl" style={{ width: 480, border: "2px solid #808080", fontFamily: "Tahoma, sans-serif" }}>
              {/* Title bar */}
              <div className="flex items-center justify-between px-2 py-1" style={{ background: "linear-gradient(180deg, #0A246A, #3A6EA5, #0A246A)" }}>
                <div className="flex items-center gap-1.5">
                  <img src="/ie-icon.png" alt="" className="w-[14px] h-[14px]" style={{ imageRendering: "pixelated" }} />
                  <span className="text-[11px] font-bold text-white">Webkinz World - Microsoft Internet Explorer</span>
                </div>
                <div className="flex gap-[2px]">
                  <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>_</div>
                  <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>□</div>
                  <button onClick={() => setOpen(false)} className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-white font-bold hover:brightness-110" style={{ background: "linear-gradient(180deg, #E08070, #C84030)", border: "1px solid #993322" }}>✕</button>
                </div>
              </div>
              {/* Menu bar */}
              <div className="flex gap-3 px-2 py-0.5 bg-[#ECE9D8] border-b border-gray-400">
                {["File", "Edit", "View", "Favorites", "Tools", "Help"].map((m) => (
                  <span key={m} className="text-[10px] text-gray-700">{m}</span>
                ))}
              </div>
              {/* Address bar */}
              <div className="flex items-center gap-1 px-2 py-1 bg-[#ECE9D8] border-b border-gray-400">
                <span className="text-[9px] text-gray-500">Address</span>
                <div className="flex-1 bg-white border border-gray-400 rounded-sm px-1 py-0.5 flex items-center gap-1">
                  <img src="/ie-icon.png" alt="" className="w-[10px] h-[10px]" style={{ imageRendering: "pixelated" }} />
                  <span className="text-[9px] text-gray-700">http://www.webkinz.com</span>
                </div>
                <div className="px-2 py-0.5 text-[9px] rounded-sm" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)", border: "1px outset #DFDFDF" }}>Go</div>
              </div>
              {/* Content */}
              <div className="bg-white">
                <img src="/webkinz-full.jpg" alt="Webkinz World" className="w-full" />
              </div>
              {/* Status bar */}
              <div className="px-2 py-0.5 bg-[#ECE9D8] border-t border-gray-300 flex justify-between">
                <span className="text-[8px] text-gray-500">Done</span>
                <span className="text-[8px] text-gray-500">Internet</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Y2K Canvas Wrapper — shows loader, delays heavy content ───
function Y2KCanvasWrapper({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [blocks, setBlocks] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlocks((b) => {
        if (b >= 8) {
          clearInterval(interval);
          setTimeout(() => setLoaded(true), 200);
          return b;
        }
        return b + 1;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 140px)" }}>
      {/* Loading bar — shows immediately */}
      {!loaded && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center" style={{ background: "#FFFDFB" }}>
          <p className="text-[24px] font-black text-purple-400 mb-4 tracking-wider" style={{ fontFamily: "monospace", textShadow: "2px 2px 0 rgba(128,0,128,0.15)" }}>
            LOADING...
          </p>
          <div className="w-[200px] h-[30px] border-[3px] border-purple-400 rounded-[2px] p-[3px] flex gap-[3px]">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-full flex-1 rounded-[1px] transition-opacity duration-100"
                style={{ background: "#9B72CF", opacity: i < blocks ? 1 : 0 }}
              />
            ))}
          </div>
        </div>
      )}
      {/* Canvas content — only renders after loading */}
      {loaded && children}
    </div>
  );
}

// ─── Sparkle Trail (follows cursor on Y2K canvas) ───
function SparkleTrail() {
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;
    let count = 0;
    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      count++;
      if (count % 3 !== 0) return;
      const id = Date.now() + Math.random();
      setSparkles((prev) => [...prev.slice(-12), { id, x, y }]);
      setTimeout(() => setSparkles((prev) => prev.filter((s) => s.id !== id)), 600);
    };
    container.addEventListener("mousemove", handleMove);
    return () => container.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ left: s.x - 6, top: s.y - 6 }}
        >
          <span className="text-[12px]">✦</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── XP Folder Icon ───
function XPFolderIcon({ label, x, y, delay, onClick, onDoubleClick }: { label: string; x: string; y: string; delay: number; onClick?: () => void; onDoubleClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.08, y: -3, transition: { delay: 0, duration: 0.2 } }}
      whileTap={{ scale: 0.92, transition: { delay: 0, duration: 0.1 } }}
      transition={{ delay }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="absolute flex flex-col items-center cursor-pointer select-none"
      style={{ left: x, top: y }}
    >
      <div className="relative" style={{ width: 42, height: 36 }}>
        <div className="absolute top-0 left-0 w-[18px] h-[8px] rounded-t-[3px]" style={{ background: "linear-gradient(180deg, #F0DC82, #E8C840)" }} />
        <div className="absolute bottom-0 left-0 w-full rounded-[2px] rounded-tl-none" style={{ height: 28, background: "linear-gradient(180deg, #F5E6A0, #E8CC50, #DFC040)", boxShadow: "0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)" }}>
          <div className="absolute top-[1px] left-[2px] right-[2px] h-[1px] bg-white/30" />
        </div>
      </div>
      <span className="text-[10px] text-gray-800 mt-1 text-center leading-tight" style={{ fontFamily: "Tahoma, sans-serif", textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}>{label}</span>
    </motion.div>
  );
}

// ─── XP Folders with openable Typography folder ───
function XPFolders() {
  const [typoOpen, setTypoOpen] = useState(false);
  const [untitledOpen, setUntitledOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <XPFolderIcon label="Notes" x="30vw" y="6%" delay={0.3} onClick={() => setNotesOpen(true)} />
      <XPFolderIcon label="About Me" x="38vw" y="5%" delay={0.38} onClick={() => setAboutOpen(true)} />
      <XPFolderIcon label="Typography" x="34vw" y="22%" delay={0.46} onClick={() => setTypoOpen(true)} />
      <XPFolderIcon label="Untitled" x="46vw" y="8%" delay={0.54} onClick={() => setUntitledOpen(true)} />

      {/* Untitled — Windows Picture Viewer */}
      <AnimatePresence>
        {untitledOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute left-[30vw] top-[5%] z-50"
          >
            <div className="rounded-t-lg overflow-hidden shadow-2xl" style={{ width: 360, border: "1px solid #0054E3", fontFamily: "Tahoma, sans-serif" }}>
              {/* Title bar */}
              <div className="flex items-center justify-between px-2 py-1" style={{ background: "linear-gradient(180deg, #0A246A, #3A6EA5, #0A246A)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">🖼️</span>
                  <span className="text-[11px] font-bold text-white">Windows Picture and Fax Viewer</span>
                </div>
                <div className="flex gap-[2px]">
                  <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>_</div>
                  <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>□</div>
                  <button
                    onClick={() => setUntitledOpen(false)}
                    className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-white font-bold hover:brightness-110"
                    style={{ background: "linear-gradient(180deg, #E08070, #C84030)", border: "1px solid #993322" }}
                  >✕</button>
                </div>
              </div>
              {/* Image area */}
              <div className="bg-[#2B2B2B] flex items-center justify-center p-2">
                <img src="/lol.jpg" alt="pain is temporary, swag is forever" className="max-w-full max-h-[320px] object-contain" />
              </div>
              {/* Toolbar */}
              <div className="bg-[#ECE9D8] px-2 py-1 flex items-center justify-center gap-1 border-t border-gray-400">
                {["⏮", "◀", "▶", "⏭", "⊕", "⊖", "🖨️", "💾", "🗑️"].map((btn, i) => (
                  <div key={i} className="w-[22px] h-[18px] rounded-sm text-[10px] flex items-center justify-center" style={{ background: "linear-gradient(180deg, #F5F5F5, #E0E0E0)", border: "1px solid #999" }}>{btn}</div>
                ))}
              </div>
              {/* Status bar */}
              <div className="px-2 py-0.5 bg-[#ECE9D8] border-t border-gray-300 flex justify-between">
                <span className="text-[8px] text-gray-500">lol.jpg — 420 x 420 pixels</span>
                <span className="text-[8px] text-gray-500">69 KB</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes — Notepad window */}
      <AnimatePresence>
        {notesOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute left-[22vw] top-[6%] z-50"
          >
            <div className="rounded-t-sm overflow-hidden shadow-2xl" style={{ width: 300, border: "1px solid #0054E3", fontFamily: "Tahoma, sans-serif" }}>
              <div className="flex items-center justify-between px-2 py-1" style={{ background: "linear-gradient(180deg, #0A246A, #3A6EA5, #0A246A)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">📝</span>
                  <span className="text-[11px] font-bold text-white">notes.txt - Notepad</span>
                </div>
                <div className="flex gap-[2px]">
                  <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>_</div>
                  <button onClick={() => setNotesOpen(false)} className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(180deg, #E08070, #C84030)", border: "1px solid #993322" }}>✕</button>
                </div>
              </div>
              <div className="flex gap-3 px-2 py-0.5 bg-[#ECE9D8] border-b border-gray-400">
                {["File", "Edit", "Format", "View", "Help"].map((m) => (
                  <span key={m} className="text-[10px] text-gray-700">{m}</span>
                ))}
              </div>
              <div className="bg-white p-3 text-[11px] text-gray-800 leading-relaxed" style={{ minHeight: 180, fontFamily: "Courier New, monospace" }}>
                <p>things on my mind rn:</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Me — WordPad window */}
      <AnimatePresence>
        {aboutOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute left-[28vw] top-[4%] z-50"
          >
            <div className="rounded-t-sm overflow-hidden shadow-2xl" style={{ width: 320, border: "1px solid #0054E3", fontFamily: "Tahoma, sans-serif" }}>
              <div className="flex items-center justify-between px-2 py-1" style={{ background: "linear-gradient(180deg, #0A246A, #3A6EA5, #0A246A)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">📄</span>
                  <span className="text-[11px] font-bold text-white">about_me.doc - WordPad</span>
                </div>
                <div className="flex gap-[2px]">
                  <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>_</div>
                  <button onClick={() => setAboutOpen(false)} className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(180deg, #E08070, #C84030)", border: "1px solid #993322" }}>✕</button>
                </div>
              </div>
              <div className="flex gap-3 px-2 py-0.5 bg-[#ECE9D8] border-b border-gray-400">
                {["File", "Edit", "View", "Insert", "Format", "Help"].map((m) => (
                  <span key={m} className="text-[10px] text-gray-700">{m}</span>
                ))}
              </div>
              <div className="bg-white p-4 text-[11px] text-gray-800 leading-relaxed" style={{ minHeight: 200 }}>
                <p className="text-[14px] font-bold" style={{ fontFamily: "Comic Sans MS, cursive" }}>~*~ aBouT mE ~*~</p>
                <p className="mt-3">★ taylor breitzman</p>
                <p>★ designer / engineer from new jersey</p>
                <p>★ now in san francisco</p>
                <p>★ design engineer @ EA</p>
                <p>★ previously: spotify, nike, sidework</p>
                <p>★ pickleball on saturdays</p>
                <p>★ strawberry matcha enthusiast</p>
                <p>★ loveeeee reading</p>
                <p className="mt-2" style={{ fontFamily: "Comic Sans MS, cursive" }}>~*~ dOnT fOrGeT tO sIgN mY gUeStBoOk ~*~</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typography XP window */}
      <AnimatePresence>
        {typoOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute left-[26vw] top-[8%] z-50"
          >
            <div className="rounded-t-lg overflow-hidden shadow-2xl" style={{ width: 440, border: "1px solid #0054E3", fontFamily: "Tahoma, sans-serif" }}>
              {/* Title bar */}
              <div className="flex items-center justify-between px-2 py-1" style={{ background: "linear-gradient(180deg, #0A246A, #3A6EA5, #0A246A)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">📁</span>
                  <span className="text-[11px] font-bold text-white">C:\Desktop\Typography</span>
                </div>
                <div className="flex gap-[2px]">
                  <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>_</div>
                  <div className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-black" style={{ background: "linear-gradient(180deg, #E8E8E8, #C0C0C0)" }}>□</div>
                  <button
                    onClick={() => setTypoOpen(false)}
                    className="w-[16px] h-[14px] rounded-sm text-[9px] flex items-center justify-center text-white font-bold hover:brightness-110"
                    style={{ background: "linear-gradient(180deg, #E08070, #C84030)", border: "1px solid #993322" }}
                  >✕</button>
                </div>
              </div>
              {/* Menu bar */}
              <div className="flex gap-3 px-2 py-0.5 bg-[#ECE9D8] border-b border-gray-400">
                {["File", "Edit", "View", "Favorites", "Tools", "Help"].map((m) => (
                  <span key={m} className="text-[10px] text-gray-700">{m}</span>
                ))}
              </div>
              {/* Address bar */}
              <div className="flex items-center gap-1 px-2 py-1 bg-[#ECE9D8] border-b border-gray-400">
                <span className="text-[9px] text-gray-500">Address</span>
                <div className="flex-1 bg-white border border-gray-400 rounded-sm px-1 py-0.5">
                  <span className="text-[9px] text-gray-700">C:\Desktop\Typography</span>
                </div>
              </div>
              {/* Content — WordArt image */}
              <div className="bg-white p-4 flex items-center justify-center" style={{ minHeight: 260 }}>
                <img src="/wordart.png" alt="WordArt Typography" className="max-w-full max-h-[240px] object-contain" style={{ mixBlendMode: "multiply" }} />
              </div>
              {/* Status bar */}
              <div className="px-2 py-0.5 bg-[#ECE9D8] border-t border-gray-300 flex justify-between">
                <span className="text-[9px] text-gray-500">3 objects</span>
                <span className="text-[9px] text-gray-500">My Computer</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Big CD Case with ejectable disc ───
function BigCDCase({ cover, title }: { cover: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative cursor-pointer"
      style={{ width: 180, height: 180 }}
    >
      {/* Disc — slides out right */}
      <motion.div
        className="absolute top-[10px]"
        animate={{ x: open ? 80 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{ left: 40 }}
      >
        <div
          className="w-[140px] h-[140px] rounded-full relative"
          style={{
            background: "conic-gradient(from 0deg, #D8D8DC, #F0F0F4, #C8C8CC, #E8E8EC, #D0D0D4, #F5F5F8, #CCCCCE, #D8D8DC)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          {/* Grooves */}
          <div className="absolute inset-[12px] rounded-full border border-white/[0.06]" />
          <div className="absolute inset-[20px] rounded-full border border-white/[0.04]" />
          <div className="absolute inset-[28px] rounded-full border border-white/[0.06]" />
          <div className="absolute inset-[36px] rounded-full border border-white/[0.04]" />
          <div className="absolute inset-[44px] rounded-full border border-white/[0.03]" />
          {/* Rainbow holographic sheen */}
          <motion.div
            className="absolute inset-[6px] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{
              background: "conic-gradient(from 0deg, rgba(255,0,0,0.08), rgba(255,140,0,0.12), rgba(255,255,0,0.08), rgba(0,255,0,0.1), rgba(0,140,255,0.12), rgba(140,0,255,0.08), rgba(255,0,140,0.1), rgba(255,0,0,0.08))",
            }}
          />
          {/* Secondary rainbow band */}
          <div
            className="absolute inset-[18px] rounded-full"
            style={{
              background: "conic-gradient(from 120deg, rgba(255,200,100,0.1), rgba(100,255,200,0.08), rgba(200,100,255,0.1), rgba(255,100,200,0.08), rgba(255,200,100,0.1))",
            }}
          />
          {/* Metallic sheen highlight */}
          <div className="absolute inset-[6px] rounded-full" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, rgba(255,255,255,0.1) 60%, transparent 100%)" }} />
          {/* Center hub */}
          <div className="absolute inset-0 m-auto w-[34px] h-[34px] rounded-full" style={{ background: "linear-gradient(145deg, #F0F0F0, #D8D8D8, #E8E8E8)", boxShadow: "0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)" }}>
            {/* Center hole */}
            <div className="absolute inset-0 m-auto w-[10px] h-[10px] rounded-full" style={{ background: "linear-gradient(135deg, #C0C0C0, #A0A0A0)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)" }} />
            {/* Label area */}
            <div className="absolute inset-[6px] rounded-full border border-gray-200/30" />
          </div>
        </div>
      </motion.div>

      {/* Jewel case */}
      <div
        className="absolute top-0 left-0 w-[160px] h-[160px] rounded-[3px] overflow-hidden z-10"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.3)" }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[8px] z-10" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))" }} />
        <div className="absolute top-0 left-0 right-0 h-[4px] z-10" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)" }} />
        <img src={cover} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.08) 100%)" }} />
      </div>
    </div>
  );
}

// ─── CD Case with ejectable disc ───
function CDCase({ book, index }: { book: { title: string; author: string; color: string }; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={() => setOpen(!open)}
      className="shrink-0 cursor-pointer relative"
      style={{ width: 130, height: 130 }}
    >
      {/* Disc — slides out to the right */}
      <motion.div
        className="absolute top-[5px]"
        animate={{
          x: open ? 60 : 0,
          rotate: open ? 15 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        style={{ right: 0, zIndex: 0 }}
      >
        <div className="w-[120px] h-[120px] rounded-full relative"
          style={{
            background: "radial-gradient(circle at 35% 35%, #F8F8F8, #E0E0E0, #C8C8C8, #D8D8D8, #F0F0F0)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}
        >
          {/* Disc grooves */}
          <div className="absolute inset-[15px] rounded-full border border-gray-300/30" />
          <div className="absolute inset-[25px] rounded-full border border-gray-300/20" />
          <div className="absolute inset-[35px] rounded-full border border-gray-300/15" />
          {/* Center hole */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-white border-2 border-gray-300" />
          {/* Rainbow sheen */}
          <div className="absolute inset-0 rounded-full opacity-20"
            style={{ background: "conic-gradient(from 0deg, #ff000015, #00ff0015, #0000ff15, #ff00ff15, #ffff0015, #00ffff15, #ff000015)" }}
          />
        </div>
      </motion.div>

      {/* Jewel case */}
      <div
        className="relative w-[130px] h-[130px] rounded-[3px] overflow-hidden"
        style={{
          background: book.color,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)",
          zIndex: 1,
        }}
      >
        {/* Plastic shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/5" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30" />
        {/* Spine edge */}
        <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-black/10" />
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-[9px] font-bold text-white/90 leading-tight">{book.title}</p>
          <p className="text-[7px] text-white/60 mt-0.5">{book.author}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Figma Text Box ───
function FigmaTextBox({ onClick }: { onClick: () => void }) {
  const [phase, setPhase] = useState<"hidden" | "drawing" | "typing" | "selecting" | "italic" | "done">("hidden");
  const [text, setText] = useState("");
  const fullText = "Contact me";

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function animate() {
      // Wait before starting (after avatar appears)
      await sleep(3500);
      if (cancelled) return;

      while (!cancelled) {
        // Draw the box
        setPhase("drawing");
        await sleep(600);
        if (cancelled) return;

        // Type the text
        setPhase("typing");
        for (let i = 1; i <= fullText.length; i++) {
          if (cancelled) return;
          setText(fullText.slice(0, i));
          await sleep(70);
        }
        await sleep(800);
        if (cancelled) return;

        // Select all text
        setPhase("selecting");
        await sleep(600);
        if (cancelled) return;

        // Done with selection
        setPhase("done");
        await sleep(4000);
        if (cancelled) return;

        // Add exclamation marks one by one
        for (const char of "!!!") {
          if (cancelled) return;
          setText((prev) => prev + char);
          await sleep(200);
        }
        await sleep(6000);
        if (cancelled) return;

        // Clear and restart
        setText("");
        setPhase("hidden");
        await sleep(2000);
      }
    }

    animate();
    return () => { cancelled = true; };
  }, []);

  if (phase === "hidden") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className="cursor-pointer relative"
    >
      {/* Blue bounding box */}
      <motion.div
        className="relative border rounded-[2px] px-2 py-1"
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: "auto",
          height: "auto",
          opacity: 1,
          borderColor: phase === "done" ? "transparent" : "#0D99FF",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ borderWidth: 1 }}
      >
        {/* Resize handles */}
        {phase !== "done" && (
          <>
            <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
            <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white border border-[#0D99FF] rounded-[1px]" />
          </>
        )}

        {/* Text */}
        <span
          className={`text-lg whitespace-nowrap select-none ${
            phase === "selecting" ? "bg-[#0D99FF]/20" : ""
          }`}
          style={{
            color: phase === "done" ? "#666" : "#1D1D1F",
            fontFamily: "var(--font-radley), Georgia, serif",
          }}
        >
          {text}
        </span>

        {/* Blinking cursor */}
        {(phase === "typing" || phase === "drawing") && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-[1px] h-[12px] bg-[#1D1D1F] ml-[1px] align-text-bottom"
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Contact Typewriter ───
function ContactTypewriter() {
  const phrases = [
    { text: "Contact me", link: "", subtitle: "" },
    { text: "Email me", link: "mailto:tbreitz16@gmail.com", subtitle: "tbreitz16@gmail.com" },
    { text: "Connect with me", link: "https://www.linkedin.com/in/taylor-breitzman-778925152/", subtitle: "linkedin.com/in/taylor-breitzman" },
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function run() {
      while (!cancelled) {
        const phrase = phrases[phraseIndex % phrases.length];

        // Type in
        setTyping(true);
        for (let i = 1; i <= phrase.text.length; i++) {
          if (cancelled) return;
          setDisplayed(phrase.text.slice(0, i));
          await sleep(60);
        }
        setTyping(false);

        // Hold
        await sleep(3000);
        if (cancelled) return;

        // Delete
        setTyping(true);
        for (let i = phrase.text.length; i >= 0; i--) {
          if (cancelled) return;
          setDisplayed(phrase.text.slice(0, i));
          await sleep(25);
        }
        setTyping(false);
        await sleep(300);

        setPhraseIndex((prev) => prev + 1);
      }
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phraseIndex]);

  const current = phrases[phraseIndex % phrases.length];

  return (
    <div className="flex flex-col">
      <div className="h-[60px] flex items-center">
        <h2
          className="text-5xl tracking-tight text-gray-900 whitespace-nowrap"
          style={{ fontFamily: "var(--font-radley), Georgia, serif" }}
        >
          {displayed}
          <motion.span
            animate={{ opacity: typing ? [1, 0] : 0 }}
            transition={typing ? { duration: 0.5, repeat: Infinity } : { duration: 0.2 }}
            className="inline-block w-[2px] h-[0.8em] bg-gray-900 ml-0.5 align-text-bottom"
          />
        </h2>
      </div>
      <div className="h-[30px] mt-2">
        <AnimatePresence mode="wait">
          {current.subtitle && !typing && displayed === current.text && (
            <motion.a
              key={current.subtitle}
              href={current.link}
              target={current.link.startsWith("http") ? "_blank" : undefined}
              rel={current.link.startsWith("http") ? "noopener noreferrer" : undefined}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-gray-400 hover:text-gray-900 transition-colors text-base"
              style={{ fontFamily: "var(--font-abhaya), Georgia, serif" }}
            >
              {current.subtitle}
            </motion.a>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Carousel Phone (waits for media to load before showing) ───
function CarouselPhone({ src, isVideo, title, contain }: { src: string; isVideo: boolean; title: string; contain?: boolean }) {
  const [ready, setReady] = useState(!isVideo); // images are ready immediately

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`relative w-[280px] h-[580px] rounded-[48px] border-[8px] border-gray-900 shadow-2xl overflow-hidden ${contain ? "bg-white" : "bg-black"}`}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-b-2xl z-10" />
      <div className={`w-full h-full rounded-[40px] overflow-hidden ${contain ? "bg-white flex items-center" : "bg-gray-100"}`}>
        {isVideo ? (
          <video
            src={src}
            autoPlay loop muted playsInline
            onLoadedData={() => setReady(true)}
            className={`w-full ${contain ? "object-contain" : "h-full object-cover"}`}
            style={contain ? { objectPosition: "center 0%" } : undefined}
          />
        ) : src ? (
          <img src={src} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
            <span className="text-sm text-gray-400 font-medium">Add media</span>
          </div>
        )}
      </div>
      {contain && <div className="absolute top-[28px] left-0 right-0 h-[50px] bg-white z-[5]" />}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-[4px] bg-gray-600 rounded-full" />
    </motion.div>
  );
}

// ─── Prototypes View (Carousel + Grid toggle) ───
function PrototypesView() {
  const [view, setView] = useState<"carousel" | "grid">("grid");
  const [current, setCurrent] = useState(0);

  const [direction, setDirection] = useState(0);
  const goNext = () => { setDirection(1); setCurrent((c) => (c + 1) % prototypes.length); };
  const goPrev = () => { setDirection(-1); setCurrent((c) => (c - 1 + prototypes.length) % prototypes.length); };

  return (
    <div>

      <AnimatePresence mode="wait">
        {view === "carousel" ? (
          <motion.div
            key="carousel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Big iPhone */}
            <div className="flex flex-col items-center">
              {/* Info above phone */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="mb-8 text-center"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {prototypes[current].title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {prototypes[current].description}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-500">
                    {prototypes[current].tag}
                  </span>
                </motion.div>
              </AnimatePresence>

              <div className="relative">
                {/* Nav arrows */}
                <motion.button
                  onClick={goPrev}
                  whileTap={{ scale: 0.85, x: -3 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -left-16 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md z-10"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
                <motion.button
                  onClick={goNext}
                  whileTap={{ scale: 0.85, x: 3 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -right-16 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md z-10"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>

                {/* Preload all videos hidden */}
                <div className="hidden">
                  {prototypes.map((p, i) => p.videoSrc && (
                    <video key={i} src={p.videoSrc} preload="auto" muted />
                  ))}
                </div>

                {/* Phone — larger mockup */}
                <AnimatePresence mode="wait">
                  <CarouselPhone
                    key={current}
                    src={prototypes[current].videoSrc || prototypes[current].gifSrc || ""}
                    isVideo={!!prototypes[current].videoSrc}
                    title={prototypes[current].title}
                    contain={(prototypes[current] as any).contain}
                  />
                </AnimatePresence>
              </div>

              {/* Dots */}
              <div className="mt-6 flex gap-2">
                {prototypes.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className="relative h-2 rounded-full transition-all"
                    style={{ width: i === current ? 24 : 8 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        backgroundColor: i === current ? "#1D1D1F" : "#D1D1D6",
                      }}
                      transition={{ duration: 0.2 }}
                      style={{ borderRadius: 999 }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {prototypes.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => { setCurrent(i); setView("carousel"); }}
                  className="cursor-pointer flex flex-col items-center"
                >
                  <IPhoneMockup
                    title={p.title}
                    description={p.description}
                    tag={p.tag}
                    index={i}
                    gifSrc={p.gifSrc}
                    videoSrc={p.videoSrc}
                    contain={(p as any).contain}
                    lighten={(p as any).lighten}
                    padded={(p as any).padded}
                  />
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                    <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-500">{p.tag}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Data ───
const experiences = [
  {
    company: "Electronic Arts",
    logo: "/logos/ea.jpg",
    role: "Product Design Engineer",
    period: "Mar 2025 — Present",
    description:
      "Sole design engineer on Parasoul, EA's world-building platform. Built the design system from scratch and owned the creative engineering — the animations, interactions, and details that make the product feel alive.",
    highlights: [
      "Architected and built a 90+ component design system in SwiftUI from the ground up — defining tokens for color, typography, spacing, motion, and layout with 1:1 Figma parity, enabling scalable and consistent UI development",
      "Created high-fidelity, tactile interaction systems using spring physics, gesture-driven interfaces, and motion design to elevate product feel and responsiveness",
      "Designed and engineered an immersive character chat experience, leveraging custom Metal shaders and transparent video avatars — supporting 8 dynamic emotion states with GPU-accelerated compositing, depth layering, and real-time sentiment-driven transitions",
      "Built a rich messaging interface with variable font interpolation, ambient thinking animations, and depth-based avatar hierarchy",
      "Shipped interaction concepts like glassmorphism, transparent video layers, and gesture-driven flows directly in production SwiftUI",
      "Defined an AI-native design engineering workflow using Claude and MCP integrations to parallelize design and development — reducing design-to-code cycles from days to hours",
    ],
    color: "#0071E3",
  },
  {
    company: "Sidework",
    logo: "/logos/sidework.png",
    role: "Product Design Engineer",
    period: "Mar 2024 — Mar 2025",
    description:
      "Led end-to-end product design for a 0→1 startup — from user research and discovery through prototyping, usability testing, and production engineering.",
    highlights: [
      "Led end-to-end product design for a 0→1 startup — from user research and discovery through prototyping, usability testing, and production engineering",
      "Spearheaded a UX redesign informed by behavioral analysis and user interviews, reducing user errors and support tickets by 40%",
      "Designed and validated complex workflows through high-fidelity interactive prototypes, iterating rapidly on qualitative and quantitative feedback before committing to engineering",
      "Developed a scalable design system to unify visual language and interaction patterns, improving consistency and development efficiency",
      "Translated ambiguous product requirements into clear, intuitive flows — simplifying a complex coffee machine interface into an experience baristas could learn in minutes",
    ],
    color: "#3DC1B8",
  },
  {
    company: "Spotify",
    logo: "/logos/spotify.png",
    role: "iOS Engineer",
    period: "Oct 2022 — Mar 2024",
    description:
      "Led iOS development of Spotify's Ads UI redesign across audio, video, and podcast formats, shipping to hundreds of millions of users globally.",
    highlights: [
      "Developed a new Ads UI, enhancing interactivity and delivering a 61% increase in overall click-through rates and a 120% surge in global video click-through rates",
      "Engineered a client-side color-extraction algorithm using binary search to find the brightest brand-safe shade that passes WCAG AA — preserving advertiser identity while guaranteeing 4.5:1 contrast compliance",
      "Worked across the full ads lifecycle (audio, video, and podcast formats) shipping components that served ads to hundreds of millions of users globally",
    ],
    color: "#1DB954",
  },
  {
    company: "Nike",
    logo: "/logos/nike.svg",
    role: "iOS Engineer",
    period: "Aug 2021 — Oct 2022",
    description:
      "Designed and developed a running app for first-time female runners on Nike's Valiant Labs innovation team.",
    highlights: [
      "Worked on Nike's Valiant Labs innovation team, shipping experimental product concepts from prototype to production in rapid cycles",
      "Designed and developed a running app for first-time female runners — shaping inclusive, community-driven experiences that reinforced motivation, habit formation, and shared progress",
      "Designed a community chat feature that proved successful enough to be integrated into Nike Sneakers app, extending its impact across Nike's digital ecosystem",
    ],
    color: "#111111",
  },
];

const prototypes: { title: string; description: string; tag: string; gifSrc?: string; videoSrc?: string; contain?: boolean; lighten?: boolean; padded?: boolean }[] = [
  { title: "Spinning World", description: "Interactive 3D spinning globe with video textures and immersive profile layout", tag: "SwiftUI", videoSrc: "/projects/world-profile.mp4" },
  { title: "Feed Portal", description: "Animated character portal with depth transitions on the feed", tag: "SwiftUI", videoSrc: "/projects/feed-portal.mov" },
  { title: "Profile Transitions", description: "Seamless animated transitions between character and world profiles", tag: "SwiftUI", videoSrc: "/projects/profile-transitions.mp4" },
  { title: "Depth Chat", description: "Depth-layered avatars that bring the most recent speaker to the foreground in group conversations", tag: "Metal + SwiftUI", videoSrc: "/projects/depth-chat.mp4" },
  { title: "Emotion Chat", description: "Sentiment-driven character emotions with depth-layered avatar responses", tag: "Metal + SwiftUI", videoSrc: "/projects/character-chat-2.mov" },
  { title: "Solo Chat", description: "One-on-one character conversation with real-time emotion transitions", tag: "Metal + SwiftUI", videoSrc: "/projects/solo-chat.mov" },
  { title: "Character Portal", description: "Animated portal avatar with transparent video compositing", tag: "Metal + SwiftUI", videoSrc: "/projects/character-portal.mp4" },
  { title: "Galaxy Canvas", description: "Interactive particle canvas with gesture-driven star field", tag: "SwiftUI", videoSrc: "/projects/galaxy-canvas.mov" },
  { title: "Variable Font Animation", description: "Each glyph animates from bold to regular weight as it types, creating a natural settling feel", tag: "SwiftUI", videoSrc: "/projects/chat-bubble-anim.mp4", contain: true },
  { title: "Bubble Morph", description: "Thinking bubble morphing into a chat bubble using Canvas in SwiftUI", tag: "SwiftUI + Canvas", videoSrc: "/projects/bubble-morph.mov", contain: true },
  { title: "Tab Bar", description: "Dynamic tab bar that minimizes in one fluid motion during profile transitions", tag: "SwiftUI", videoSrc: "/projects/tab-bar.mov" },
  { title: "Split Pane", description: "Draggable split view with fluid resizing and snap points", tag: "SwiftUI", videoSrc: "/projects/split-pane.mp4" },
];

const playgroundItems = [
  { title: "Spring Physics", description: "Custom spring curves for button press", tag: "Motion", emoji: "🌀", span: "col-span-2" },
  { title: "Haptic Patterns", description: "Coordinated haptic + visual feedback", tag: "UIKit", emoji: "📳" },
  { title: "Gesture Chains", description: "Swipe → scale → rotate sequences", tag: "SwiftUI", emoji: "👆" },
  { title: "Blur Transitions", description: "Progressive blur with scroll position", tag: "Effects", emoji: "🌫️" },
  { title: "Particle System", description: "Confetti burst on achievement unlock", tag: "Core Animation", emoji: "🎉", span: "col-span-2" },
  { title: "Morphing Shapes", description: "Smooth path interpolation between icons", tag: "SwiftUI", emoji: "◇" },
  { title: "Scroll Parallax", description: "Multi-layer depth on feed cards", tag: "SwiftUI", emoji: "📜" },
  { title: "Liquid Glass", description: "Frosted glass with dynamic refraction", tag: "Metal", emoji: "💎", span: "col-span-2" },
  { title: "Skeleton Loading", description: "Shimmer with gradient mask animation", tag: "SwiftUI", emoji: "💀" },
];

const raisedMeDevices = [
  { label: "Nintendo DS", year: "2004", type: "ds" as const, src: "" },
  { label: "Y2K Laptop", year: "2003", type: "laptop" as const, src: "" },
  { label: "iPod Touch", year: "2007", type: "ipod" as const, src: "" },
];

const y2kUIs = [
  { label: "Nintendogs", src: "/raised-me/nintendogs.jpg" },
  { label: "Club Penguin", src: "" },
  { label: "Webkinz", src: "/raised-me/webkinz.jpg" },
  { label: "AIM", src: "/raised-me/aim.jpg" },
  { label: "iPod Touch", src: "" },
  { label: "GirlsGoGames", src: "/raised-me/girlsgo.jpg" },
];

const albums = [
  { title: "Hannah Montana", artist: "Hannah Montana", color: "#FF69B4", gradient: "linear-gradient(135deg, #FF69B4, #FF1493)", cover: "/hannah.jpg" },
  { title: "Short n' Sweet", artist: "Sabrina Carpenter", color: "#2060A0", gradient: "linear-gradient(135deg, #2060A0, #4080C0)", cover: "/sabrina.jpeg" },
  { title: "TTPD", artist: "Taylor Swift", color: "#3A3530", gradient: "linear-gradient(135deg, #3A3530, #5A5550)", cover: "/ttpd.jpeg" },
  { title: "Stellaria", artist: "Chelsea Cutler", color: "#6B5B7B", gradient: "linear-gradient(135deg, #6B5B7B, #9B8BAB)", cover: "/stellaria.jpeg" },
  { title: "Good Girl Gone Bad", artist: "Rihanna", color: "#008080", gradient: "linear-gradient(135deg, #008080, #40A0A0)", cover: "/rihanna.jpg" },
  { title: "The Secret of Us", artist: "Gracie Abrams", color: "#E8D5B7", gradient: "linear-gradient(135deg, #E8D5B7, #C4A882)", cover: "/gracie.png" },
  { title: "Let Go", artist: "Avril Lavigne", color: "#4A6080", gradient: "linear-gradient(135deg, #4A6080, #7090B0)", cover: "/avril.jpg" },
  { title: "1989 (TV)", artist: "Taylor Swift", color: "#87CEEB", gradient: "linear-gradient(135deg, #87CEEB, #5BA3D9)", cover: "/taylor-swift-1989.png" },
  { title: "a beautiful blur", artist: "LANY", color: "#4466FF", gradient: "linear-gradient(135deg, #4466FF, #0A0A0A)", cover: "/lany.jpeg" },
];

const books = [
  { title: "A Court of Thorns and Roses", author: "Sarah J. Maas", color: "#C83232", cover: "/books/acotar.jpg" },
  { title: "A Court of Mist and Fury", author: "Sarah J. Maas", color: "#2A9D8F", cover: "/books/acomaf.jpg" },
  { title: "Fourth Wing", author: "Rebecca Yarros", color: "#C4A44A", cover: "/books/fourth-wing.jpg" },
  { title: "One Golden Summer", author: "Carley Fortune", color: "#2E6BC4", cover: "/books/one-golden-summer.jpg" },
  { title: "Project Hail Mary", author: "Andy Weir", color: "#1A1A0A", cover: "/books/project-hail-mary.jpg" },
  { title: "The Correspondent", author: "Virginia Evans", color: "#F5F0E8", cover: "/books/the-correspondent.jpg" },
  { title: "I Who Have Never Known Men", author: "Jacqueline Harpman", color: "#D45A35", cover: "/books/never-known-men.jpg" },
  { title: "The Nightingale", author: "Kristin Hannah", color: "#2C4A6E", cover: "/books/nightingale.jpg" },
  { title: "Binding 13", author: "Chloe Walsh", color: "#CC2222", cover: "/books/binding-13.jpg" },
];

// Drop photos in /public/life/ and add paths here
const lifePhotos: string[] = [
  // "/life/photo1.jpg",
  // "/life/photo2.jpg",
];

// ─── Projects Data ───
const projects = [
  {
    id: "ea",
    company: "Electronic Arts",
    logo: "/logos/ea.jpg",
    coverImage: "/projects/parasoul-cover.png",
    coverVideos: ["/projects/discover-video.mp4", "/projects/feed-vid1.mp4"],
    title: "Parasoul",
    subtitle: "Creative engineering behind EA's world-building platform",
    role: "Design Engineer",
    period: "2025",
    color: "#0071E3",
    overview: "Parasoul is a world-building app where users create characters with deep personalities, craft lore and plotlines, and build immersive worlds that evolve over time. Characters grow, storylines branch, and worlds change based on how users interact with them.",
    roleDescription: "I joined as the sole design engineer. My job was two-fold: build a production design system from zero, and bring the more ambitious interaction ideas to life in code. A lot of what I designed — spring animations, emotion-driven transitions, gesture-based flows — can\u0027t be specced in Figma. I prototyped and shipped directly in SwiftUI.",
    impact: [
      "92+ production components across 14 categories",
      "Design token system covering color, typography, spacing, icons, gradients, and corner radius",
      "Figma-to-code catalog enabling self-serve adoption by product teams",
      "Custom squircle algorithm matching Figma's 100% corner smoothing",
      "Avatar system with transparent video compositing via Metal shaders",
    ],
    tools: ["SwiftUI", "Swift 6", "Figma", "Metal", "GRPC"],
    images: [],
    sections: [
      {
        title: "Feed & Discovery",
        subtitle: "Content browsing, storylines, and world exploration",
        body: "",
        items: [
          { label: "Feed", src: "/projects/Notifications.png", scroll: false },
          { label: "Discovery", src: "/projects/discover-video.mp4", scroll: false },
          { label: "Feed", src: "/projects/feed-vid1.mp4", scroll: false },
        ],
      },
      {
        title: "Profiles",
        subtitle: "World, Character, and Creator profile experiences",
        body: "",
        items: [
          { label: "Character Profile", src: "/projects/character-profile-scroll.mp4", scroll: false },
          { label: "World Profile", src: "/projects/world-profile-case.mov", scroll: false },
          { label: "Creator Profile", src: "/projects/creator-profile-scroll.mp4", scroll: false },
        ],
      },
      {
        title: "Chat",
        subtitle: "AI character messaging and group conversations",
        body: "",
        items: [
          { label: "Messages", src: "/projects/char-1.png", scroll: false },
          { label: "Group Chat", src: "/projects/group-chat.png", scroll: false },
          { label: "Creator Chat", src: "/projects/creator-chat.png", scroll: false },
        ],
      },
      {
        title: "Creation",
        subtitle: "World building, character creation, and lore management",
        body: "",
        items: [
          { label: "World Creation", src: "/projects/creation.png", scroll: false },
          { label: "Character Editor", src: "/projects/creation2.png", scroll: false },
          { label: "Character Lore", src: "/projects/creation3.png", scroll: false },
        ],
      },
      {
        title: "",
        subtitle: "",
        body: "",
        items: [
          { label: "Character Book", src: "/projects/chyles-creation.mp4", scroll: false },
        ],
      },
      {
        title: "Character Chat System",
        subtitle: "Bringing characters to life through emotion, depth, and interaction",
        body: "Each character has six emotion composites — happy, sad, angry, surprised, thinking, and neutral — that map directly to the sentiment of their messages. As a character responds, their expression shifts in real time, creating a chat experience that feels genuinely emotional and alive. The depth-stacking effect layers characters by recency, so in group conversations you can instantly see who's most active. It made the whole interaction feel less like messaging and more like being in a room with people who react to what you say.",
        items: [
          { label: "Depth Chat", src: "/projects/depth-chat.mp4", scroll: false },
          { label: "Emotion Chat", src: "/projects/character-chat-2.mov", scroll: false },
          { label: "Solo Chat", src: "/projects/solo-chat.mov", scroll: false },
        ],
      },
      {
        title: "",
        subtitle: "",
        body: "",
        items: [
          { label: "Character Reactions", src: "/projects/character-reactions.mov", scroll: false, transparent: true },
        ],
      },
    ],
  },
  {
    id: "sidework-pos",
    company: "Sidework",
    logo: "/logos/sidework.png",
    coverImage: "/projects/sidework/pos-cover.png",
    title: "Point of Sale Coffee Machine",
    subtitle: "Designing to Empower Baristas and Redefine Coffee-Making",
    role: "Product Design Engineer",
    period: "2024 — 2025",
    color: "#3DC1B8",
    overview: "",
    impact: [],
    tools: ["Flutter", "Figma"],
    images: [],
    hideContext: true,
    contentBlocks: [
      {
        type: "section" as const,
        title: "Context",
        subtitle: "Disrupting the way coffee shops serve drinks",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'At Sidework, we built a disruptive piece of technology for coffee shops: a <b>smart dispenser that connects directly with the barista\'s POS system.</b> Whatever drink a customer ordered in Toast automatically appeared on the dispenser\'s screen, ready to be made with perfect precision.',
          'The vision was simple — remove the need to memorize recipes, guarantee consistency, and let baristas spend less time measuring and more time connecting with customers.',
          'But there was a problem. The very people we were trying to help — baristas — <b>weren\'t using it.</b>',
          'Despite its promise of consistency and efficiency, they found the dispenser harder to use than simply making drinks by hand. <b>Adoption stalled</b>, threatening the company\'s ability to scale.',
          'That\'s when I stepped in to <b>lead a complete redesign of the user experience.</b>',
        ],
      },
      { type: "full-image" as const, src: "/projects/sidework/gregs.png" },
      {
        type: "section" as const,
        title: "Problem",
        subtitle: "Baristas struggled to adopt a system that disrupted their workflow",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'What we discovered was that precision wasn\'t the problem — <b>workflow was.</b> Baristas valued speed and familiarity above all else. The dispenser\'s original UI forced them to slow down, navigate multiple screens, and relearn habits they had already mastered behind the bar. Instead of saving time, it added friction.',
          'In short, the product designed to make their lives easier was actually <b>making their jobs harder.</b>',
          'As a result, adoption lagged, and the technology risked becoming irrelevant before it ever had the chance to scale.',
        ],
      },
      { type: "mid-image" as const, src: "/projects/sidework/reviews-bad.png" },
      {
        type: "section" as const,
        title: "Solution",
        subtitle: "Redesigning for speed, clarity, and barista adoption",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'Baristas are often reluctant to adopt disruptive technology if it complicates their work, so I designed the interface to <b>support their natural flow.</b> I took a user-centered approach, putting baristas at the heart of the solution to create a system that works for them — not against them.',
          'To address the friction, I led a <b>complete overhaul of the dispenser UI</b>, focusing on streamlining the workflow and reducing cognitive load.',
          'By centering on baristas\' needs and designing around their existing habits and pace, the interface became <b>intuitive, fast, and widely adopted.</b>',
        ],
      },
      { type: "small-image" as const, src: "/projects/sidework/user-persona.png" },
      {
        type: "section" as const,
        title: "Research & Insights",
        subtitle: "Understanding why adoption stalled",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'Before the redesign, the dispenser\'s interface created friction and confusion.',
          'Observing baristas in action and talking with them revealed <b>4 major issues:</b>',
          '<b>Order vs. Drink mismatch</b> — Baristas think in terms of individual drinks, not grouped orders. The system forced them to navigate through each drink, slowing down their workflow.',
          '<b>Lack of immediate details</b> — Baristas needed quick access to customer names and modifications to distinguish between similar drinks. The old design required tapping into each item to see this information.',
          '<b>Non-intuitive interface</b> — The UI was confusing and anxiety-inducing, relying heavily on manual training rather than natural usability.',
          '<b>Frozen dispensing screen</b> — Drinks with different prep times appeared static, leaving baristas uncertain when a drink was finished.',
          'These observations highlighted that the problem wasn\'t baristas being resistant to technology — it was that <b>the technology didn\'t align with their workflow or mental model.</b>',
        ],
      },
      {
        type: "section" as const,
        title: "Before",
        subtitle: "",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [],
      },
      { type: "full-image" as const, src: "/projects/sidework/before.png" },
      {
        type: "section" as const,
        title: "Key Fixes",
        subtitle: "Redesigning the workflow to fit baristas, not the other way around",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'To tackle the adoption and workflow issues, I redesigned the dispenser interface with baristas\' mental model and natural workflow in mind:',
          '<b>Drink-first queue</b> — Ungrouped orders and restructured the workflow so baristas could focus on individual drinks rather than navigating grouped orders.',
          '<b>Immediate access to details</b> — Customer names, drink orders, and modifications displayed at a glance — no tapping required — even when managing 10 variations of cold brew.',
          '<b>Intuitive, anxiety-free flow</b> — Simplified navigation eliminated confusion and reduced the need for manual training.',
          '<b>Dynamic drink feedback</b> — Added a circular countdown timer for each drink, giving real-time progress and reducing uncertainty for varying prep times.',
          '<b>Familiar visual cues</b> — Incorporated elements inspired by baristas\' natural workflow, like sticky labels, to enhance familiarity and comfort.',
          'These improvements aligned the technology with how baristas naturally work, making the system <b>both efficient and widely adopted.</b>',
        ],
      },
      {
        type: "section" as const,
        title: "The Drinks Tab",
        subtitle: "Order screen",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'The order screen displays drinks in the order they were placed, automatically pulled from the barista\'s POS (Toast or Square). The yellow highlight indicates the selected drink for clarity, while the <b>customer name, drink name, and modifiers are visible at a glance.</b>',
          'On the right, a larger drink detail view intentionally <b>mirrors the sticky label on the cup</b> below the screen, showing all modifications — even for complex orders with multiple customizations.',
          'This design ensures baristas can verify the correct drink at a glance, <b>reduces cognitive load</b>, and allows them to focus on making drinks without memorizing details.',
        ],
      },
      { type: "mid-image" as const, src: "/projects/sidework/Drinks-tab.png" },
      {
        type: "section" as const,
        title: "History Tab",
        subtitle: "Order screen",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'While watching baristas use our machine, I noticed they often needed to <b>bring back a dispensed drink</b> due to spills, customer complaints, or other reasons.',
          'To address this, I implemented a <b>history tab feature</b> that displays all dispensed and canceled drinks, enabling baristas to quickly re-dispense as needed.',
        ],
      },
      { type: "mid-image" as const, src: "/projects/sidework/history-tab.png" },
      {
        type: "section" as const,
        title: "Dispensing Screen",
        subtitle: "",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'The dispense screen shows the selected drink being prepared in real time. A <b>circular countdown timer</b> indicates progress for each drink, accounting for varying prep times, so baristas always know when a drink is ready.',
          'This dynamic feedback replaces the old "frozen" screen, <b>reducing uncertainty</b> and keeping baristas confident and efficient during peak hours.',
        ],
      },
      { type: "mid-image" as const, src: "/projects/sidework/Dispensing-tab.png" },
      {
        type: "section" as const,
        title: "Modify Drinks",
        subtitle: "",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'Drinks are sent to the dispenser exactly as entered in the POS system, but sometimes baristas need to make <b>on-the-fly modifications</b> (like adding an extra shot or changing the milk) without re-entering the order.',
          'This screen allows them to adjust any part of the drink while keeping all default recipe options pre-selected. A <b>reset-to-default button</b> lets baristas quickly revert changes if needed.',
          'The feature is optional and unobtrusive, appearing as a simple button, so baristas can <b>modify drinks only when necessary</b> without slowing down the workflow.',
        ],
      },
      { type: "mid-image" as const, src: "/projects/sidework/Modify-drinks.png" },
      {
        type: "section" as const,
        title: "Drink Feedback",
        subtitle: "Built in feedback tools",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'Hardware issues can arise even when software is functioning correctly. To capture this feedback, I introduced <b>"Flag Drink" and "Recipe Audit" buttons</b> that baristas and store managers could use to quickly report problems with ingredients, ingredient lines, or recipes.',
          'These tools were lightweight and optional, designed to <b>fit seamlessly into their workflow</b> while providing critical visibility into machine health and ingredient accuracy.',
        ],
      },
      {
        type: "side-by-side" as const,
        images: ["/projects/sidework/Report-drinks.png", "/projects/sidework/Audit.png"],
      },
      {
        type: "section" as const,
        title: "Dashboard",
        subtitle: "Turning Feedback into Proactive Insights",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'We transformed this raw feedback into actionable data by building a <b>dashboard that surfaced patterns, flagged recurring issues, and prioritized fixes.</b> This closed-loop system allowed us to proactively address hardware and recipe concerns, improving reliability before they became widespread problems.',
          'The impact was clear: <b>flagged drinks dropped by 54%</b>, machine trust grew, and baristas felt confident the system was both responsive and reliable.',
        ],
      },
      { type: "full-image" as const, src: "/projects/sidework/Data.png" },
      {
        type: "section" as const,
        title: "Monthly Drinks Dispensed",
        subtitle: "Represents the number of drinks dispensed by our machine each month",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [],
      },
      { type: "full-image" as const, src: "/projects/sidework/Monthly-drinks.png" },
      { type: "mid-image" as const, src: "/projects/sidework/good-reviews.png" },
      {
        type: "section" as const,
        title: "Challenge",
        subtitle: "Engineering + User",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'The biggest challenge was balancing the needs of the user — who requires a simple, intuitive experience — with the constraints of a <b>technically complex hardware and software product.</b>',
        ],
      },
      {
        type: "section" as const,
        title: "Takeaway",
        subtitle: "Engineering + User = Product",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          '<b>A product isn\'t truly a product if it doesn\'t work for the user.</b>',
          'No matter how impressive the engineering is, if it\'s not intuitive and usable, it fails to meet the real need.',
          'At its core, a product exists to serve the people who use it — without that connection, <b>it loses its purpose.</b>',
        ],
      },
    ],
  },
  {
    id: "sidework",
    company: "Sidework",
    logo: "/logos/sidework.png",
    coverImage: "/projects/self-serve-cover.png",
    title: "Self Serve Kiosk",
    subtitle: "Disrupting the way coffee shops serve drinks",
    role: "Product Design Engineer",
    period: "2024 — 2025",
    color: "#3DC1B8",
    overview: "",
    impact: [],
    tools: ["Flutter", "Figma"],
    images: [],
    hideContext: true,
    contentBlocks: [
      {
        type: "section" as const,
        title: "Context",
        subtitle: "Disrupting the way coffee shops serve drinks",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'Sidework\'s beverage dispenser was originally built for coffee shops and bars — venues that already had menus, trained staff, and established workflows.',
          'I led the design of a <b>self-serve kiosk interface</b> that reimagined the experience for restaurants without beverage programs or baristas, like Insomnia Cookies.',
          'This prototype showed how our machine could <b>add beverages as a new revenue stream without requiring staff training or additional labor.</b> The kiosk made ordering intuitive for customers, bridging the gap between food-only venues and full café-style drink offerings.',
        ],
      },
      {
        type: "section" as const,
        title: "Problem",
        subtitle: "The Challenge: No Menu, No Barista",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'Restaurants like Insomnia Cookies <b>wanted to serve drinks but lacked both a beverage menu and trained staff.</b>',
          'The existing dispenser POS-UI assumed a barista-driven workflow, making it unusable in environments where customers would interact directly with the machine.',
        ],
      },
      {
        type: "section" as const,
        title: "Solution",
        subtitle: "Re-imagining our technology as a self-service kiosk",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'I designed a prototype that transformed Sidework\'s dispenser into a kiosk-style, customer-facing experience tailored for Insomnia Cookies.',
          '<b>The demo showed how customers could order and customize drinks on their own, without staff involvement</b> — helping Insomnia visualize the opportunity to add beverages as a new revenue stream while reducing labor needs.',
        ],
      },
      {
        type: "annotated-image" as const,
        src: "/projects/sidework/Drink-selection.png",
        annotations: [
          { label: "Custom Menu", x: 45, y: -5, rotate: 0 },
          { label: "Friendly UI", x: -15, y: 50, rotate: -15 },
        ],
      },
      {
        type: "annotated-image" as const,
        src: "/projects/sidework/Drink-details.png",
        annotations: [
          { label: "Recipe Logic", x: 85, y: -12, rotate: 10 },
          { label: "Easy to\nModify", x: -15, y: 40, rotate: -10 },
          { label: "Dispense", x: 105, y: 75, rotate: 5 },
        ],
      },
      {
        type: "section" as const,
        title: "Impact",
        subtitle: "From Prototype to Market Expansion",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'My prototype reframed Sidework\'s value proposition by showing how beverage innovation could thrive in spaces without trained baristas.',
          'This vision led Insomnia Cookies to <b>greenlight a pilot</b> based on the menu and UX I designed, providing a tangible proof point of the in-store experience.',
          'The pilot\'s success <b>unlocked a larger contract</b> and turned the prototype into a <b>key storytelling tool</b> in high-stakes meetings with Coke, Starbucks, Dutch Bros, Pepsi, and Inspire Brands\' Innovation Studio.',
          'By rapidly iterating and translating complex ideas into interactive prototypes, I helped accelerate decisions, build trust, and <b>open doors to entirely new markets.</b>',
        ],
      },
      {
        type: "section" as const,
        title: "Kiosk for Staff",
        subtitle: "Lightweight, staff-friendly interface for quick service",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'Not every venue wanted a customer-facing kiosk — some preferred a lightweight, staff-facing version for low-volume beverage service.',
          'I designed a <b>color-coded kiosk UI</b> that streamlined ordering for employees without requiring full POS integration. Unlike the barista-focused order queue, this version prioritized speed and simplicity, letting staff quickly select and dispense drinks without navigating grouped orders.',
          'This flexibility allowed Sidework to <b>serve a wider range of restaurant models</b>, adapting the dispenser UI to different workflows and business needs.',
        ],
      },
      { type: "full-image" as const, src: "/projects/sidework/kiosk.png" },
      {
        type: "section" as const,
        title: "Color-Coded Kiosk",
        subtitle: "for Cognitive Clarity",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [],
      },
      {
        type: "section" as const,
        title: "",
        subtitle: "",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          'Drawing from UX research on POS systems like Toast and Square, I leveraged <b>color as a cognitive anchor</b> to reduce load and improve recall.',
          'Each drink category was assigned a distinct color — <b>brown for coffee, green for tea, pink for refreshers, and seasonal colors</b> for limited-time offerings. This visual system persisted from drink selection through customization to dispensing, creating a <b>consistent context</b> that baristas (or staff) could lock onto mentally.',
          'By pairing color-coding with popularity-based sorting (placing the most-ordered drinks first), the interface supported <b>mental matching, rapid recognition, and error reduction</b> — <b>principles rooted in cognitive psychology and human factors research.</b>',
          'This design turned what could have been a complex, overwhelming system into one that felt <b>familiar, intuitive, and fast to use</b>, even for untrained staff.',
        ],
      },
      { type: "full-image" as const, src: "/projects/sidework/kiosk2.png" },
      { type: "full-image" as const, src: "/projects/sidework/kiosk3.png" },
      {
        type: "section" as const,
        title: "Design Decisions",
        subtitle: "Applying design psychology principles to reduce cognitive load",
        highlight: "",
        highlightColor: "#3DC1B8",
        body: [
          '<b>Persistent visual context:</b> Colors remain consistent from selection → customization → dispense, reducing context switching.',
          '<b>Category differentiation:</b> Distinct colors for coffee, tea, refreshers, and seasonal drinks make multiple options instantly recognizable.',
          '<b>Popularity-first ordering (Hick\'s Law):</b> Most-ordered drinks appear first to minimize choice overload and speed decision-making.',
          '<b>Error prevention:</b> Color-coding and grouping reduce the risk of selecting the wrong drink, even under high pressure.',
          '<b>Intuitive for untrained staff:</b> Designed to be familiar and fast to learn, lowering training time and cognitive load.',
          '<b>Recognition over recall:</b> Staff rely on visual cues rather than memory, improving speed and confidence.',
        ],
      },
    ],
  },
  {
    id: "spotify",
    company: "Spotify",
    logo: "/logos/spotify.png",
    title: "Ads UI Redesign",
    subtitle: "Discovering how UI can Improve User Engagement",
    role: "iOS Engineer",
    period: "2022 — 2024",
    color: "#1DB954",
    overview: "",
    impact: [],
    tools: ["Swift", "SwiftUI"],
    team: "Ad Formats",
    coverImage: "/projects/spotify/chd-phone.png",
    coverVideo: "/projects/spotify/ad-formats.mp4",
    images: [],
    hideContext: true,
    contentBlocks: [
      {
        type: "section" as const,
        title: "Ads Team",
        subtitle: "Transforming ads into a more interactive and visually engaging experience",
        highlight: "",
        highlightColor: "#1DB954",
        body: [
          'As an iOS engineer at Spotify, <b>I led the development of a new Ads UI.</b>',
          'The goal was to design something that not only visually resonated with users but also e<b>nhanced interactivity and user engagement across multiple formats.</b>',
          'Working closely with designers and product teams, I helped shape a more cohesive, responsive, and visually rich ad experience that felt native to Spotify\'s platform.',
          'Beyond implementation, I played a key role i<b>n crafting reusable design system components that spanned the entire ads ecosystem</b> — ensuring consistency, scalability, and accessibility across all ad formats.',
        ],
      },
      {
        type: "section" as const,
        title: "Audio Ads",
        subtitle: "Audio ads are served between songs, so listeners are distraction-free and focused on what you have to say",
        highlight: "",
        highlightColor: "#1DB954",
        body: [],
      },
      { type: "full-image" as const, src: "/projects/spotify/spotify2.png" },
      {
        type: "section" as const,
        title: "Video Ads",
        subtitle: "Video ads create moments of connection through visual storytelling, served only when your audience is viewing the app",
        highlight: "",
        highlightColor: "#1DB954",
        body: [],
      },
      { type: "full-image" as const, src: "/projects/spotify/spotify3.png" },
      {
        type: "section" as const,
        title: "Accessibility",
        subtitle: "Dynamic color extraction to balance brand expression with WCAG compliance",
        highlight: "",
        highlightColor: "#1DB954",
        body: [
          'One of the most important aspects of this project was ensuring accessibility.',
          'To achieve this, <b>I developed a client-side color extraction algorithm</b> that dynamically adjusted the hue, brightness, and contrast based on the WCAG guidelines.',
          'This ensured that the CTA card was not only visually appealing but also compliant with accessibility, <b>making the experience inclusive for all users.</b>',
        ],
      },
      {
        type: "section" as const,
        title: "Darken to Contrast",
        subtitle: "My client-side color extraction algorithm that dynamically adjusts the hue to meet AA",
        highlight: "",
        highlightColor: "#1DB954",
        body: [
          'The algorithm extracts the dominant color from each advertiser\'s brand assets, then runs a <b>binary search to find the brightest possible shade that still passes WCAG AA contrast requirements</b> against white text.',
          'Instead of defaulting to a generic dark background, the CTA card preserves as much of the brand\'s original color identity as possible — only darkening as much as accessibility demands.',
          'The result: every ad feels on-brand while guaranteeing <b>a minimum 3:1 contrast ratio</b> for interactive elements and <b>4.5:1 for body text</b>, no matter how light the source color.',
        ],
      },
      { type: "small-image" as const, src: "/projects/spotify/contrast-ratio.png" },
      { type: "spacer" as const },
      {
        type: "section" as const,
        title: "Reusable Component",
        subtitle: "A single UI solution evolved into a flexible, platform-wide design system",
        highlight: "",
        highlightColor: "#1DB954",
        body: [
          'What began as a single component quickly evolved into a reusable design system, adopted across Spotify\'s ads platform. Its scalability allowed seamless integration into multiple ad formats — audio, video, and interactive canvases — demonstrating <b>both flexibility and broad impact.</b>',
          'By standardizing design patterns, the system not only streamlined development but also ensured consistency, accessibility, and a <b>more cohesive ad experience for millions of users.</b>',
        ],
      },
      {
        type: "three-titles" as const,
        titles: ["Now Playing Bar", "Show Page", "Episode Page"],
      },
      { type: "full-image" as const, src: "/projects/spotify/spotify-chd.png" },
      {
        type: "three-cards" as const,
        cards: [
          { title: "", body: "Ensures that advertisers remain visible even when ads are minimized which allows for <b>continued click-ability.</b>" },
          { title: "", body: "Access any of the sponsors of the podcast show, providing <b>more interactivity</b> even after they finished the show." },
          { title: "", body: "Click on the cards to access any of <b>recently played ads</b> from the podcast episode." },
        ],
      },
      {
        type: "section" as const,
        title: "Impact",
        subtitle: "Blending design and engineering to boost ad performance at scale",
        highlight: "",
        highlightColor: "#1DB954",
        body: [
          'A key driver of success was the in-app browser functionality I developed, which allowed users to seamlessly interact with brand content without leaving the app.',
          'The CTA card contributed to a <b>61% increase in overall click-through rates</b> and a <b>120% surge in global video ad click-through rates.</b>',
          'This feature played a crucial role in increasing click-through rates, driving significant traffic to brand websites and improving ad performance.',
          'By focusing on intuitive design principles and seamless user interactions, the redesigned UI showcased the impact of well-executed <b>design and development collaboration.</b>',
        ],
      },
      {
        type: "stats" as const,
        items: [
          { number: "61%", label: "Click Increase" },
          { number: "120%", label: "Surge Globally" },
        ],
        color: "#1DB954",
      },
    ],
  },
  {
    id: "nike",
    company: "Nike",
    logo: "/logos/nike.svg",
    title: "Momentum",
    subtitle: "Designing for Women at a Company Known for Elite Sport",
    role: "iOS Engineer",
    period: "2021 — 2022",
    color: "#111111",
    overview: "",
    impact: [],
    hideContext: true,
    tools: ["Swift", "SwiftUI"],
    images: [],
    coverImage: "/projects/nike/nike-cover.png",
    dividerImage: "/projects/nike/momentum-divider.png",
    contentBlocks: [
      { type: "hero-image" as const, src: "/projects/nike/momentum-header.avif" },
      {
        type: "section" as const,
        title: "Empowering Women",
        highlight: "Women",
        highlightColor: "#FE00AB",
        body: [
          'Our goal was to create a <b>running app for first time female runners</b> - an underserved consumer segment.',
          'The project aimed to <b style="color:#FE00AB">empower women</b> by providing a supportive, community driven running experience that catered to their unique needs.',
        ],
      },
      { type: "full-image" as const, src: "/projects/nike/Momentum1.png" },
      {
        type: "section" as const,
        title: "Celebrating Collective Wins",
        highlight: "Collective",
        highlightColor: "#FE00AB",
        body: [
          'After each run, Momentum showcases team metrics to highlight everyone\'s effort.',
          'From total miles covered to calories burned, age group averages, and individual achievements, this feature recognizes the <b>power of shared progress</b>, inspiring women to <b>reach new goals together</b>.',
        ],
      },
      { type: "full-image" as const, src: "/projects/nike/momentum3.png" },
      {
        type: "section" as const,
        title: "Emphasizing Inclusivity",
        highlight: "Inclusivity",
        highlightColor: "#FE00AB",
        body: [
          'As an engineer with a design focused mindset, I helped enable women to connect through a community chat feature, <b>emphasizing inclusivity and fostering engagement among runners.</b>',
          'I contributed to the development of a scalable design system that aligned with Nike\'s brand standards while focusing on creating intuitive, user-friendly interfaces.',
        ],
      },
      { type: "full-image" as const, src: "/projects/nike/momentum2.png" },
      {
        type: "section" as const,
        title: "Building Community",
        highlight: "Community",
        highlightColor: "#FE00AB",
        body: [
          'The community chat feature proved to be highly effective in building a <b>supportive environment for users.</b>',
          'Its success led to the integration into Nike Sneakers app, where it continued to foster community interaction and engagement, making it a reusable and <b>impactful feature across Nike\'s digital ecosystem</b>.',
        ],
      },
      { type: "full-image" as const, src: "/projects/nike/momentum-divider.png" },
      {
        type: "section" as const,
        title: "Her Strength. Our Mission.",
        highlight: "",
        highlightColor: "#FE00AB",
        body: [
          'With <b style="color:#FE00AB">Momentum</b>, we set out to build more than just a running app; we aimed to create a supportive space where women — especially those new to running — felt encouraged and seen.',
          'Guided by <b>user-centered principles</b>, we focused on understanding the unique needs of first-time female runners, shaping every feature to resonate with their goals and challenges.',
          'From intuitive design choices to a community-driven experience, Momentum placed <b>women at the heart of every interaction</b>, ensuring Nike\'s vision of inclusivity and empowerment was felt at every step.',
          'In crafting a scalable design system true to Nike\'s brand, we created not only an app but an <b>invitation to women everywhere</b> to begin their running journey with confidence and connection.',
        ],
      },
      { type: "full-image" as const, src: "/projects/nike/momentum-divider.png" },
    ],
  },
];

// ─── Projects View ───
function ProjectsView() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const project = projects.find((p) => p.id === selectedProject);

  return (
    <div>
      <AnimatePresence mode="wait">
        {!selectedProject ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-auto">
              {projects.map((p, i) => {
                const isHero = i === 0;
                const coverSrc = (p as any).coverImage || (p as any).heroImage || (p.images.length > 0 ? p.images[0] : null);
                const coverVideo = (p as any).coverVideos?.[0] || (p as any).coverVideo;
                const coverVideos = (p as any).coverVideos as string[] | undefined;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.1 }}
                    whileHover={{ y: -4, transition: { delay: 0, duration: 0.2 } }}
                    onClick={() => setSelectedProject(p.id)}
                    className={`cursor-pointer group ${isHero ? "md:col-span-2" : ""}`}
                  >
                    {/* Image/video area */}
                    <div
                      className="rounded-2xl overflow-hidden relative"
                      style={{ height: isHero ? 280 : 260 }}
                    >
                      {/* Background */}
                      {isHero && coverSrc ? (
                        <div className="absolute inset-0">
                          <img src={coverSrc} alt={p.title} className="w-full h-full object-cover" />
                          {/* Phone mockups overlaid */}
                          {coverVideos && (
                            <div className="absolute inset-0 flex items-center justify-center gap-4">
                              {coverVideos.map((vid: string, vi: number) => (
                                <div key={vi} className="relative w-[90px] h-[190px] rounded-[20px] border-[3px] border-gray-900 bg-black shadow-xl overflow-hidden">
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36px] h-[10px] bg-black rounded-b-lg z-10" />
                                  <div className="w-full h-full rounded-[17px] overflow-hidden">
                                    <video src={vid} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                  </div>
                                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[30%] h-[2px] bg-gray-600 rounded-full" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : coverVideo ? (
                        <video src={coverVideo} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                      ) : coverSrc ? (
                        <img src={coverSrc} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${p.color}20, ${p.color}40)` }} />
                      )}

                      {/* Hover shine */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)" }} />
                    </div>

                    {/* Info below */}
                    <div className="px-1 pt-3 pb-1">
                      <div className="flex items-center gap-2 mb-1">
                        {p.logo && (
                          <img src={p.logo} alt={p.company} className="w-4 h-4 rounded-[4px] object-cover" />
                        )}
                        <span className="text-[11px] text-gray-400 font-medium">{p.company}</span>
                      </div>
                      <h3 className={`font-bold text-gray-900 ${isHero ? "text-lg" : "text-sm"}`}>{p.title}</h3>
                      {(p as any).subtitle && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{(p as any).subtitle}</p>
                      )}
                      {(p as any).tools && (
                        <div className="flex gap-1.5 mt-2">
                          {((p as any).tools as string[]).slice(0, isHero ? 5 : 3).map((t: string) => (
                            <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : project ? (
          <motion.div
            key="case-study"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Back */}
            <motion.button
              onClick={() => setSelectedProject(null)}
              whileHover={{ x: -3 }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-900 mb-10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Back
            </motion.button>

            {/* Title + subtitle */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                {project.logo && (
                  <img src={project.logo} alt={project.company} className="w-8 h-8 rounded-[8px] object-cover" />
                )}
                <span className="text-sm text-gray-400 font-medium">{project.company} · {project.period}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">{project.title}</h1>
              <p className="text-base text-gray-400">{project.subtitle}</p>
            </div>

            {/* Metadata — role pills dark, tools lighter */}
            <div className="flex flex-wrap items-center gap-2 mb-12">
              <span className="text-xs px-3 py-1.5 rounded-full bg-gray-900 text-white font-medium">{project.role}</span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-gray-900 text-white font-medium">{(project as any).team || "Product"}</span>
              {project.tools.map((t) => (
                <span key={t} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500">{t}</span>
              ))}
            </div>

            {/* Featured video */}
            {"featuredVideo" in project && (project as any).featuredVideo && (
              <div className="flex justify-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative w-[300px] h-[620px] rounded-[52px] border-[8px] border-gray-900 bg-black shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-b-2xl z-10" />
                    <div className="w-full h-full rounded-[44px] overflow-hidden bg-gray-100">
                      <video
                        src={(project as any).featuredVideo}
                        autoPlay loop muted playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-[4px] bg-gray-600 rounded-full" />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Featured image in phone */}
            {"featuredImage" in project && (project as any).featuredImage && (
              <div className="flex justify-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative w-[300px] h-[620px] rounded-[52px] border-[8px] border-gray-900 bg-black shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-b-2xl z-10" />
                    <div className="w-full h-full rounded-[44px] overflow-hidden bg-gray-100">
                      <img
                        src={(project as any).featuredImage}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-[4px] bg-gray-600 rounded-full" />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Parasoul hero — before Context, EA only */}
            {project.id === "ea" && (
              <div className="mb-10 -mx-2 rounded-2xl overflow-hidden">
                <img src="/projects/parasoul-hero.png" alt="Parasoul — Your Imagination. Infinite Canvas." className="w-full object-cover rounded-2xl" />
              </div>
            )}

            {/* Divider + Context (hidden when contentBlocks handle it) */}
            {!(project as any).hideContext && (
              <>
                {"dividerImage" in project && (project as any).dividerImage && (
                  <div className="mb-12 -mx-6 rounded-2xl overflow-hidden">
                    <img src={(project as any).dividerImage} alt="" className="w-full h-20 object-cover" />
                  </div>
                )}
                <div className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Context</h2>
                  <p className="text-sm text-gray-400 mb-6" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>
                    {project.subtitle}
                  </p>
                  <div className="bg-white rounded-2xl border border-gray-100 p-8">
                    <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-nouvelle), sans-serif", fontSize: 16 }}>
                      {project.overview}
                    </p>
                  </div>
                  {project.id === "ea" && (
                    <div className="mt-8 -mx-2 rounded-xl overflow-hidden">
                      <img src="/projects/parasoul-stories2.png" alt="Parasoul characters" className="w-full object-cover rounded-xl" />
                    </div>
                  )}
                </div>

                {/* My Role section */}
                {(project as any).roleDescription && (
                  <div className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">My Role</h2>
                    <div className="bg-white rounded-2xl border border-gray-100 p-8">
                      <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-nouvelle), sans-serif", fontSize: 16 }}>
                        {(project as any).roleDescription}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Content blocks (editorial storytelling) */}
            {"contentBlocks" in project && (project as any).contentBlocks?.map((block: any, bi: number) => {
              if (block.type === "hero-image") {
                return (
                  <motion.div key={bi} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12 -mx-6">
                    <img src={block.src} alt="" className="w-full rounded-2xl" />
                  </motion.div>
                );
              }
              if (block.type === "section") {
                return (
                  <div key={bi} className={block.body?.length > 0 ? "mb-12 mt-8" : "mb-4 mt-8"}>
                    {block.title && (
                      <h2
                        className="text-3xl font-bold mb-2"
                      >
                        {block.title.split(block.highlight || "___NOMATCH___").map((part: string, pi: number, arr: string[]) => (
                          <span key={pi}>
                            {part}
                            {pi < arr.length - 1 && (
                              <span>{block.highlight}</span>
                            )}
                          </span>
                        ))}
                      </h2>
                    )}
                    {block.subtitle && (
                      <p className="text-sm text-gray-400 mb-6">{block.subtitle}</p>
                    )}
                    {!block.subtitle && block.body?.length > 0 && (
                      <div className="mb-4" />
                    )}
                    {block.body.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-2xl mx-auto">
                        {block.body.map((line: string, li: number) => (
                          <p
                            key={li}
                            className="text-[15px] text-gray-600 leading-relaxed mb-3 last:mb-0"
                            dangerouslySetInnerHTML={{ __html: line }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (block.type === "full-image") {
                return (
                  <motion.div key={bi} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: bi * 0.1 }} className="mb-8 -mx-6">
                    <img src={block.src} alt="" className="w-full rounded-2xl" />
                  </motion.div>
                );
              }
              if (block.type === "stats") {
                return (
                  <div key={bi} className="mb-12 flex flex-col items-center gap-6">
                    {block.items.map((stat: { number: string; label: string }, si: number) => (
                      <motion.div
                        key={si}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: si * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                      >
                        <span className="text-5xl font-bold" style={{ color: block.color }}>{stat.number}</span>
                        <span className="text-5xl font-bold text-gray-900 ml-2">{stat.label}</span>
                      </motion.div>
                    ))}
                  </div>
                );
              }
              if (block.type === "side-by-side") {
                return (
                  <div key={bi} className="mb-12 flex gap-4 -mx-6">
                    {block.images.map((img: string, ii: number) => (
                      <motion.div
                        key={ii}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ii * 0.1 }}
                        className="flex-1"
                      >
                        <img src={img} alt="" className="w-full rounded-2xl" />
                      </motion.div>
                    ))}
                  </div>
                );
              }
              if (block.type === "annotated-image") {
                return (
                  <div key={bi} className="mb-28 pt-12 relative mx-auto" style={{ maxWidth: 580 }}>
                    <img src={block.src} alt="" className="w-full rounded-2xl" />
                    {block.annotations.map((ann: { label: string; x: number; y: number; rotate: number }, ai: number) => (
                      <motion.div
                        key={ai}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: ai * 0.15 + 0.3, type: "spring", stiffness: 200, damping: 15 }}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                      >
                        <p className="text-base font-normal text-gray-900 whitespace-pre-line text-center leading-tight"
                        >
                          {ann.label}
                        </p>
                        <img
                          src="/arrow.png"
                          alt=""
                          className="w-6 h-8 mt-1 opacity-80"
                          style={{ transform: `rotate(${ann.rotate}deg)${ann.x < 30 ? " scaleX(-1)" : ""}` }}
                        />
                      </motion.div>
                    ))}
                  </div>
                );
              }
              if (block.type === "three-titles") {
                return (
                  <div key={bi} className="mb-4 grid grid-cols-3 gap-5">
                    {block.titles.map((title: string, ti: number) => (
                      <p key={ti} className="text-base font-bold text-gray-900 text-center">{title}</p>
                    ))}
                  </div>
                );
              }
              if (block.type === "spacer") {
                return <div key={bi} className="h-8" />;
              }
              if (block.type === "three-cards") {
                return (
                  <div key={bi} className="mb-12 grid grid-cols-3 gap-5">
                    {block.cards.map((card: { title: string; body: string }, ci: number) => (
                      <motion.div
                        key={ci}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ci * 0.1 }}
                        className="flex flex-col"
                      >
                        {card.title && <h4 className="text-base font-bold text-gray-900 mb-3 text-center">{card.title}</h4>}
                        <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-5">
                          <p
                            className="text-[13px] text-gray-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: card.body }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              }
              if (block.type === "mid-image") {
                return (
                  <motion.div key={bi} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: bi * 0.1 }} className="mb-8 flex justify-center">
                    <img src={block.src} alt="" className="max-w-lg rounded-2xl" />
                  </motion.div>
                );
              }
              if (block.type === "small-image") {
                const isPersona = block.src.includes("user-persona");
                return (
                  <motion.div key={bi} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: bi * 0.1 }} className="mb-8 flex justify-center">
                    <img src={block.src} alt="" className={`${isPersona ? "max-w-2xl" : "max-w-md"} rounded-2xl`} />
                  </motion.div>
                );
              }
              return null;
            })}

            {/* Full-bleed images (fallback for projects without contentBlocks) */}
            {"heroImage" in project && (project as any).heroImage && (
              <div className="mb-12 -mx-6">
                <img
                  src={(project as any).heroImage}
                  alt={project.title}
                  className="w-full rounded-2xl"
                />
              </div>
            )}

            {project.images.length > 0 && !("sections" in project && (project as any).sections?.length > 0) && (
              <div className="space-y-8 mb-16">
                {project.images.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="-mx-6"
                  >
                    <img src={img} alt="" className="w-full rounded-2xl" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* divider removed from bottom */}
            {false && (
              <div></div>
            )}

            {/* Screens by section (EA style) */}
            {"sections" in project && (project as any).sections?.length > 0 && (project as any).sections?.map((section: any, si: number) => (
              <div key={si} className="mb-16">
                <div className="mb-8">
                  <h2
                    className="text-3xl font-bold text-gray-900 mb-2"
                  >
                    {section.title}
                  </h2>
                  <p className="text-sm text-gray-400 mb-4" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>
                    {section.subtitle}
                  </p>
                  {section.body && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 mt-4">
                      <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-nouvelle), sans-serif", fontSize: 16 }}>
                        {section.body}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-8">
                  {section.items.map((item: any, i: number) => {
                    const isVideo = item.src && (item.src.endsWith(".mp4") || item.src.endsWith(".mov"));

                    if (item.scroll) {
                      return <ScrollingPhone key={i} src={item.src} label={item.label} index={i} duration={item.duration || 12} />;
                    }

                    if (item.transparent) {
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex flex-col items-center"
                        >
                          <video src={item.src} autoPlay loop muted playsInline className="h-[500px] object-contain rounded-2xl" />
                          <span className="mt-3 text-xs font-medium text-gray-500">{item.label}</span>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center"
                      >
                        <div className="relative w-[200px] h-[420px] rounded-[36px] border-[6px] border-gray-900 bg-black shadow-xl overflow-hidden">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-black rounded-b-xl z-10" />
                          <div className="w-full h-full rounded-[30px] overflow-hidden bg-gray-100">
                            {isVideo ? (
                              <video src={item.src} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                            ) : item.src ? (
                              <img src={item.src} alt={item.label} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
                                <span className="text-xs text-gray-400">Coming soon</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[35%] h-[3px] bg-gray-600 rounded-full" />
                        </div>
                        <span className="mt-3 text-xs font-medium text-gray-500">{item.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Typography section — EA only */}
            {project.id === "ea" && (
              <div className="mb-16">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Typography</h2>
                  <p className="text-sm text-gray-400 mb-4" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>
                    Using type to convey personality across worlds
                  </p>
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 mt-4">
                    <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-nouvelle), sans-serif", fontSize: 16 }}>
                      Every world in Parasoul has its own identity, and typography is one of the most powerful tools to express it. Each genre — from fantasy to horror to sci-fi — gets its own typeface that sets the tone before a single word of the story is read. The type system was designed to make every world feel distinct and immersive the moment you enter it.
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <img src="/projects/parasoul-typo2.png" alt="Stories Start Here" className="max-h-[120px] object-contain" />
                  </div>
                  <div className="-mx-2 rounded-xl overflow-hidden">
                    <img src="/projects/parasoul-stories.png" alt="Parasoul stories" className="w-full object-cover rounded-xl" />
                  </div>
                  <div className="flex justify-center overflow-hidden" style={{ maxHeight: 400 }}>
                    <img src="/projects/parasoul-typo.png" alt="Genre typography" className="w-[60%] object-contain" style={{ marginTop: "-8%", marginBottom: "-8%" }} />
                  </div>
                </div>
              </div>
            )}

            {/* World CTA — bottom of page, EA only */}
            {project.id === "ea" && (
              <div className="mb-8 flex justify-center">
                <img src="/projects/parasoul-world.png" alt="Create a World of Your Own" className="w-[50%] object-contain rounded-2xl" />
              </div>
            )}

          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ───
export default function Home() {
  const [activeTab, setActiveTab] = useState("Home");
  const [aboutMode, setAboutMode] = useState<"modern" | "y2k">("modern");
  const [meMode, setMeMode] = useState<"modern" | "y2k">("modern");
  const tabs = ["Home", "Vibes", "Prototypes", "Projects", "Resume", "Contact"];

  return (
    <>
      <NavPill tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Figma-style avatar in top right */}
      {/* Avatar + Figma text box */}
      <div className="fixed top-7 right-6 z-50 hidden md:flex items-center gap-0">
        <FigmaTextBox onClick={() => setActiveTab("Contact")} />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: "spring", stiffness: 300, damping: 20 }}
          className="cursor-pointer"
          onClick={() => setActiveTab("Contact")}
        >
          <div className="w-9 h-9 rounded-full overflow-hidden shadow-md">
            <img src="/taylor.jpeg" alt="Taylor" className="w-full h-full object-cover" />
          </div>
        </motion.div>
      </div>

      {/* ─── ME TAB — full-bleed canvas, outside main ─── */}
      <AnimatePresence>
      {activeTab === "Vibes" && (
        <motion.div
          key="me-canvas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full overflow-x-hidden pt-28 pb-0 min-h-screen"
          style={{ background: "#FFFDFB" }}
        >
          {/* Mode toggle */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setMeMode("modern")}
                className="relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
              >
                {meMode === "modern" && (
                  <motion.div layoutId="me-mode" className="absolute inset-0 rounded-full bg-black" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className={`relative z-10 ${meMode === "modern" ? "text-white" : "text-gray-500"}`}>Now</span>
              </button>
              <button
                onClick={() => setMeMode("y2k")}
                className="relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
              >
                {meMode === "y2k" && (
                  <motion.div layoutId="me-mode" className="absolute inset-0 rounded-full bg-black" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className={`relative z-10 ${meMode === "y2k" ? "text-white" : "text-gray-500"}`}>Then</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
          {meMode === "modern" ? (
          <motion.div key="me-modern" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

          {/* ── Modern Canvas — Mobile ── */}
          <div className="md:hidden px-5 py-8 space-y-8" style={{ background: "#FFFDFB" }}>
            {/* Books — 2x2 tilted */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-10 mx-auto max-w-[300px]">
              <div className="rotate-[-5deg]"><InteractiveBook cover="/books/project-hail-mary-alt.jpg" title="Project Hail Mary" author="Andy Weir" /></div>
              <div className="rotate-[3deg]"><InteractiveBook cover="/books/fourth-wing.jpg" title="Fourth Wing" author="Rebecca Yarros" /></div>
              <div className="rotate-[-2deg]"><InteractiveBook cover="/books/acomaf.jpg" title="A Court of Mist and Fury" author="Sarah J. Maas" /></div>
              <div className="rotate-[4deg]"><InteractiveBook cover="/books/one-golden-summer-alt.jpg" title="One Golden Summer" author="Carley Fortune" /></div>
            </div>
            {/* Folders — scattered fun */}
            <div className="flex justify-center gap-4">
              <div className="flex flex-col items-center rotate-[-3deg]">
                <div style={{ width: 70, height: 58 }}><img src="/mac-folder.png" alt="folder" className="w-full h-full object-contain" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} /></div>
                <span className="text-[10px] font-medium text-gray-600 mt-1">notes</span>
              </div>
              <div className="flex flex-col items-center mt-3 rotate-[2deg]">
                <div style={{ width: 70, height: 58 }}><img src="/mac-folder.png" alt="folder" className="w-full h-full object-contain" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} /></div>
                <span className="text-[10px] font-medium text-gray-600 mt-1">about me</span>
              </div>
              <div className="flex flex-col items-center -mt-1 rotate-[-4deg]">
                <div style={{ width: 70, height: 58 }}><img src="/mac-folder.png" alt="folder" className="w-full h-full object-contain" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} /></div>
                <span className="text-[10px] font-medium text-gray-600 mt-1">untitled</span>
              </div>
              <div className="flex flex-col items-center mt-2 rotate-[5deg]">
                <div style={{ width: 70, height: 58 }}><img src="/mac-folder.png" alt="folder" className="w-full h-full object-contain" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} /></div>
                <span className="text-[10px] font-medium text-gray-600 mt-1">fav apps</span>
              </div>
            </div>
            {/* Focus Mode */}
            <div className="flex justify-center">
              <div className="rounded-full px-4 py-2 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.04)" }}>
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
                </div>
                <span className="text-[11px] font-medium text-gray-700">Do Not Disturb</span>
                <span className="text-[11px] text-gray-400">Designing</span>
              </div>
            </div>
            {/* Spotify — centered */}
            <div className="flex justify-center">
              <NowPlayingPill />
            </div>
            {/* AirDrop */}
            <div className="flex justify-center">
              <AirDropPopup />
            </div>
            {/* Summer Fridays */}
            <div className="flex justify-center">
              <motion.div
                whileHover={{ rotate: 0, scale: 1.1 }}
                whileTap={{ scale: 0.95, rotate: 5 }}
                style={{ rotate: -15 }}
              >
                <img src="/summer-fridays.png" alt="Summer Fridays" className="h-[200px] object-contain" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.12))" }} />
              </motion.div>
            </div>
            {/* Xcode */}
            <div className="flex justify-center"><XcodeCrash /></div>
            {/* Slack */}
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)" }}>
              <div className="w-8 h-8 rounded-[8px] overflow-hidden shrink-0"><img src="/slack-icon.png" alt="Slack" className="w-full h-full object-contain" /></div>
              <div className="flex-1"><div className="flex items-center gap-1.5"><span className="text-[11px] font-bold text-gray-900">#design-system</span><span className="text-[9px] text-gray-400">2m ago</span></div><p className="text-[11px] text-gray-600 mt-0.5"><span className="font-medium">Taylor:</span> just pushed 12 new components 🚀</p></div>
            </div>
            {/* Siri Suggestion */}
            <div className="rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.04)" }}>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">Siri Suggestion</p>
              <p className="text-[11px] font-medium text-gray-700">Walk away from the terminal and touch grass</p>
            </div>
            {/* Screen Time */}
            <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-1.5"><span className="text-[10px] font-bold text-gray-500 tracking-wide uppercase">Screen Time</span><span className="text-[10px] text-gray-400">11m ago</span></div>
              <p className="text-[12px] font-bold text-gray-900">Weekly Report Available</p>
              <p className="text-[11px] text-gray-500 mt-0.5">You averaged 29,030,230,213,023 hours on Claude Code last week.</p>
            </div>
            {/* Terminal */}
            <div className="rounded-xl overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
              <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "#2D2D2D" }}><div className="w-[10px] h-[10px] rounded-full bg-[#FF5F56]" /><div className="w-[10px] h-[10px] rounded-full bg-[#FFBD2E]" /><div className="w-[10px] h-[10px] rounded-full bg-[#27C93F]" /><span className="text-[10px] text-gray-400 ml-2">taylor — zsh</span></div>
              <div className="px-3 py-3 font-mono" style={{ background: "#1A1A1A" }}><p className="text-[10px] text-green-400">taylor@macbook <span className="text-blue-400">~/portfolio</span> $</p><p className="text-[10px] text-gray-300 mt-0.5">npx next build</p><p className="text-[10px] text-green-400 mt-1">✓ Compiled successfully</p></div>
            </div>
          </div>

          {/* ── Modern Canvas — Desktop ── */}
          <div className="relative w-full overflow-x-hidden hidden md:block" style={{ minHeight: "calc(100vh - 140px)", background: "#FFFDFB" }}>

            {/* Subtle grid dots */}
            <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle, #C0C0C0 0.5px, transparent 0.5px)", backgroundSize: "28px 28px" }} />

            {/* ── Interactive Books — top left ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -5 }}
              animate={{ opacity: 1, y: 0, rotate: -5 }}
              transition={{ delay: 0.15 }}
              className="absolute left-[4vw] top-[5%]"
            >
              <InteractiveBook cover="/books/project-hail-mary-alt.jpg" title="Project Hail Mary" author="Andy Weir" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: 3 }}
              transition={{ delay: 0.2 }}
              className="absolute left-[14vw] top-[8%]"
            >
              <InteractiveBook cover="/books/fourth-wing.jpg" title="Fourth Wing" author="Rebecca Yarros" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ delay: 0.25 }}
              className="absolute left-[3vw] top-[38%]"
            >
              <InteractiveBook cover="/books/acomaf.jpg" title="A Court of Mist and Fury" author="Sarah J. Maas" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 4 }}
              transition={{ delay: 0.3 }}
              className="absolute left-[13vw] top-[40%]"
            >
              <InteractiveBook cover="/books/one-golden-summer-alt.jpg" title="One Golden Summer" author="Carley Fortune" />
            </motion.div>

            {/* ── Find My — top right ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -3, transition: { delay: 0, duration: 0.2 } }}
              transition={{ delay: 0.3 }}
              className="absolute right-[5vw] top-[6%]"
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  width: 260,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 0 0 0.5px rgba(0,0,0,0.04)",
                }}
              >
                {/* Map area */}
                <div className="relative h-[180px]" style={{ background: "linear-gradient(135deg, #E8F4E8, #D4ECD4, #C8E0C8)" }}>
                  {/* Fake map grid — roads */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-[30%] left-0 right-0 h-[2px] bg-white" />
                    <div className="absolute top-[60%] left-0 right-0 h-[2px] bg-white" />
                    <div className="absolute top-0 bottom-0 left-[25%] w-[2px] bg-white" />
                    <div className="absolute top-0 bottom-0 left-[55%] w-[2px] bg-white" />
                    <div className="absolute top-0 bottom-0 left-[80%] w-[2px] bg-white" />
                    <div className="absolute top-[15%] left-[10%] right-[30%] h-[1px] bg-white/50 rotate-[15deg]" />
                  </div>
                  {/* Parks / blocks */}
                  <div className="absolute top-[40%] left-[15%] w-[30px] h-[20px] rounded-[3px] bg-[#A8D5A0]/40" />
                  <div className="absolute top-[20%] right-[20%] w-[40px] h-[25px] rounded-[3px] bg-[#A8D5A0]/40" />
                  {/* Location pin — iOS Find My style */}
                  <motion.div
                    className="absolute top-[28%] left-[42%]"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="flex flex-col items-center">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden border-[3px] border-white shadow-xl">
                        <img src="/taylor.jpeg" alt="Taylor" className="w-full h-full object-cover" />
                      </div>
                      {/* Pin point */}
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-white -mt-[1px]" />
                    </div>
                  </motion.div>
                  {/* Blue pulse ring */}
                  <motion.div
                    className="absolute top-[35%] left-[47%] -translate-x-1/2 w-14 h-14 rounded-full border border-blue-400/20"
                    animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Pickleball court label */}
                  <div className="absolute top-[62%] left-[35%] bg-white/90 rounded-lg px-2 py-1 shadow-sm">
                    <span className="text-[8px] text-gray-700 font-medium">🏓 Pickleball Courts</span>
                  </div>
                </div>
                {/* Info bar */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                >
                  <div>
                    <p className="text-[12px] font-bold text-gray-900">Taylor B.</p>
                    <p className="text-[10px] text-gray-400">Pickleball Courts  ·  Now</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-[12px]">📍</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-[10px] text-white">↗</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── AirDrop popup — right of profile ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -3, transition: { delay: 0, duration: 0.2 } }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
              className="absolute left-[58%] top-[35%]"
            >
              <AirDropPopup />
            </motion.div>

            {/* ── Summer Fridays lip balm — right of slack, interactive ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -15 }}
              animate={{ opacity: 1, y: 0, rotate: -15 }}
              whileHover={{ rotate: 0, scale: 1.1 }}
              whileTap={{ scale: 0.95, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="absolute left-[23vw] bottom-[24%] cursor-pointer"
              drag
              dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
              dragElastic={0.3}
            >
              <img src="/summer-fridays.png" alt="Summer Fridays Lip Butter Balm" className="h-[240px] object-contain" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.12))" }} />
            </motion.div>

            {/* ── EADEM lip gloss — next to Summer Fridays ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: 12 }}
              animate={{ opacity: 1, y: 0, rotate: 12 }}
              whileHover={{ rotate: -5, scale: 1.12, y: -5 }}
              whileTap={{ scale: 0.93, rotate: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="absolute left-[24vw] bottom-[0%] cursor-pointer"
              drag
              dragConstraints={{ left: -80, right: 80, top: -80, bottom: 80 }}
              dragElastic={0.25}
            >
              <img src="/eadem.png" alt="EADEM" className="h-[400px] object-contain" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.1))" }} />
            </motion.div>

            {/* ── Slack notification — bottom left ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -2, transition: { delay: 0, duration: 0.2 } }}
              whileTap={{ scale: 0.97, transition: { delay: 0, duration: 0.1 } }}
              transition={{ delay: 0.7 }}
              className="absolute left-[4vw] bottom-[18%]"
            >
              <div
                className="rounded-2xl px-4 py-3 flex items-start gap-3"
                style={{
                  width: 300,
                  background: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div className="w-8 h-8 rounded-[8px] overflow-hidden shrink-0">
                  <img src="/slack-icon.png" alt="Slack" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-gray-900">#design-system</span>
                    <span className="text-[9px] text-gray-400">2m ago</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5"><span className="font-medium">Taylor:</span> just pushed 12 new components 🚀</p>
                </div>
              </div>
            </motion.div>

            {/* ── Xcode crash dialog ── */}
            <XcodeCrash />

            {/* ── Terminal window — bottom right ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -3, transition: { delay: 0, duration: 0.2 } }}
              transition={{ delay: 0.65 }}
              className="absolute right-[5vw] bottom-[12%]"
            >
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  width: 300,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                }}
              >
                {/* Title bar */}
                <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "#2D2D2D" }}>
                  <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F56]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#FFBD2E]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#27C93F]" />
                  <span className="text-[10px] text-gray-400 ml-2">taylor — zsh — 80×24</span>
                </div>
                {/* Terminal content */}
                <div className="px-3 py-3 font-mono" style={{ background: "#1A1A1A" }}>
                  <p className="text-[10px] text-gray-500">Last login: Tue Apr 22 on ttys001</p>
                  <p className="text-[10px] text-green-400 mt-1">taylor@macbook <span className="text-blue-400">~/portfolio</span> $</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">npx next build</p>
                  <p className="text-[10px] text-gray-500 mt-1">▲ Next.js 16.2.4 (Turbopack)</p>
                  <p className="text-[10px] text-green-400 mt-0.5">✓ Compiled successfully in 1.2s</p>
                  <p className="text-[10px] text-green-400">✓ Generating static pages (4/4)</p>
                  <p className="text-[10px] text-gray-300 mt-1.5">
                    <span className="text-green-400">taylor@macbook</span> <span className="text-blue-400">~/portfolio</span> $
                    <motion.span
                      className="text-gray-300 ml-0.5"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >▊</motion.span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Screen Time — liquid glass, bottom ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -2, transition: { delay: 0, duration: 0.2 } }}
              whileTap={{ scale: 0.97, transition: { delay: 0, duration: 0.1 } }}
              transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 20 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-[4%] cursor-pointer"
            >
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  width: 320,
                  background: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gray-500 tracking-wide uppercase">Screen Time</span>
                  <span className="text-[10px] text-gray-400">11m ago</span>
                </div>
                <p className="text-[12px] font-bold text-gray-900">Weekly Report Available</p>
                <p className="text-[11px] text-gray-500 mt-0.5">You averaged 29,030,230,213,023 hours on Claude Code last week.</p>
                <p className="text-[10px] text-blue-500 mt-1">41 more notifications</p>
              </div>
            </motion.div>

            {/* ── Focus Mode pill — top center ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, transition: { delay: 0, duration: 0.2 } }}
              whileTap={{ scale: 0.95, transition: { delay: 0, duration: 0.1 } }}
              transition={{ delay: 0.6 }}
              className="absolute left-1/2 -translate-x-1/2 top-[3%]"
            >
              <div
                className="rounded-full px-4 py-2 flex items-center gap-2"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
                </div>
                <span className="text-[11px] font-medium text-gray-700">Do Not Disturb</span>
                <span className="text-[11px] text-gray-400">Designing</span>
              </div>
            </motion.div>

            {/* ── Apple Music Now Playing — Live Activity style ── */}
            <NowPlayingPill />

            {/* ── Siri Suggestion ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ scale: 1.04, y: -2, transition: { delay: 0, duration: 0.2 } }}
              whileTap={{ scale: 0.96 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="absolute left-[4vw] bottom-[8%]"
            >
              <div
                className="rounded-2xl px-4 py-2.5 flex items-center gap-2.5"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">Siri Suggestion</p>
                  <p className="text-[11px] font-medium text-gray-700">Walk away from the terminal and touch grass</p>
                </div>
              </div>
            </motion.div>

            {/* ── macOS Folders — interactive ── */}
            <NotesFolder x="32vw" y="8%" delay={0.3} />
            <AboutMeFolder x="42vw" y="6%" delay={0.38} />
            <ImageFolder x="48vw" y="20%" delay={0.46} label="untitled" image="/meme.webp" />
            <MacAppFolder x="37vw" y="24%" delay={0.46} />
            <WeatherApp x="68vw" y="6%" delay={0.5} />

            {/* Notes app icon — below weather */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              transition={{ delay: 0.55 }}
              className="absolute flex flex-col items-center cursor-pointer select-none"
              style={{ left: "64vw", top: "18%" }}
            >
              <img src="/notes-icon.png" alt="Notes" className="w-[56px] h-[56px] rounded-[14px] object-contain" style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.12)" }} />
              <span className="text-[10px] font-medium text-gray-600 mt-1.5 text-center">Notes</span>
            </motion.div>

          </div>

          </motion.div>
          ) : (
          <motion.div key="me-y2k" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

          {/* ── Y2K Canvas — Mobile ── */}
          <div className="md:hidden px-5 py-8 space-y-8" style={{ background: "#FFFDFB" }}>
            {/* iPod */}
            <div className="flex justify-center" style={{ transform: "scale(0.9)" }}><IPodNano /></div>
            {/* CDs under iPod */}
            <div className="flex gap-4 justify-center">
              <BigCDCase cover="/hannah.jpg" title="Hannah Montana" />
              <BigCDCase cover="/avril.jpg" title="Avril Lavigne" />
            </div>
            {/* XP Folders — fun scattered arrangement */}
            <div className="flex justify-center gap-5">
              {[
                { label: "Notes", rotate: "-3deg", mt: "0" },
                { label: "About Me", rotate: "2deg", mt: "12px" },
                { label: "Typography", rotate: "-4deg", mt: "-4px" },
                { label: "Untitled", rotate: "5deg", mt: "8px" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center" style={{ rotate: f.rotate, marginTop: f.mt }}>
                  <div className="relative" style={{ width: 42, height: 36 }}>
                    <div className="absolute top-0 left-0 w-[18px] h-[8px] rounded-t-[3px]" style={{ background: "linear-gradient(180deg, #F0DC82, #E8C840)" }} />
                    <div className="absolute bottom-0 left-0 w-full rounded-[2px] rounded-tl-none" style={{ height: 28, background: "linear-gradient(180deg, #F5E6A0, #E8CC50, #DFC040)", boxShadow: "0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)" }}>
                      <div className="absolute top-[1px] left-[2px] right-[2px] h-[1px] bg-white/30" />
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-600 mt-1">{f.label}</span>
                </div>
              ))}
            </div>
            {/* AIM with logo */}
            <div className="shadow-xl" style={{ fontFamily: "Tahoma, MS Sans Serif, sans-serif" }}>
              <div className="rounded-t-sm overflow-hidden relative" style={{ border: "2px solid #808080" }}>
                <div className="flex items-center justify-between px-1.5 py-0.5" style={{ background: "linear-gradient(90deg, #000080, #1084D0)" }}>
                  <div className="flex items-center gap-1">
                    <img src="/aim-logo.webp" alt="AIM" className="w-[12px] h-[12px] object-contain" />
                    <span className="text-[10px] font-bold text-white">Edit Away Message</span>
                  </div>
                  <button className="w-[14px] h-[12px] rounded-sm text-[8px] flex items-center justify-center text-black" style={{ background: "#C0C0C0", border: "1px outset #DFDFDF" }}>✕</button>
                </div>
                <div className="bg-[#C0C0C0] p-3 space-y-2">
                  <div className="flex items-center gap-2"><span className="text-[10px]">Enter label:</span><div className="flex-1 bg-white border border-gray-500 px-1 py-0.5"><span className="text-[10px]">Busy</span></div></div>
                  <div className="bg-white border border-gray-500 p-2 min-h-[60px]">
                    <p className="text-[11px] leading-relaxed" style={{ fontFamily: "Comic Sans MS, cursive" }}><span className="font-bold text-pink-600">**BRB**</span><br /><span className="text-purple-700">viBe cOdiNg w/ cLaUdE</span><br /><span className="text-blue-600">thEn piCkLeBaLL @ 6</span> 🏓<br /><span className="text-pink-500">dO nOt DiStUrB LoL</span> 😎</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Limewire */}
            <LimewireDownload />
            {/* MS Paint */}
            <MSPaint />
            {/* Tiger Beat + Baby Lips side by side */}
            <div className="flex items-center justify-center gap-4">
              <div className="rotate-[-8deg]">
                <img src="/tiger-beat.jpeg" alt="Tiger Beat" className="w-[150px] rounded-md shadow-lg" />
              </div>
              <img src="/baby-lips.png" alt="Baby Lips" className="h-[160px] object-contain" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.12))" }} />
            </div>
            {/* Bracelet */}
            <div className="flex justify-center gap-[3px] relative py-4">
              <div className="absolute top-1/2 left-[20%] right-[20%] h-[3px] -translate-y-1/2 z-0 rounded-full" style={{ background: "linear-gradient(90deg, transparent, #F0B0C8 8%, #E890B0 50%, #F0B0C8 92%, transparent)" }} />
              {["T", "A", "Y", "L", "O", "R"].map((letter, i) => (
                <div key={i} className="relative z-10 flex items-center justify-center shrink-0" style={{ width: 34, height: 34, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #FFFFFF, #F5F5F5 40%, #E0E0E0 80%, #D0D0D0)", boxShadow: "0 3px 8px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.04)" }}>
                  <span className="font-black select-none" style={{ fontSize: 16, color: "#2A2A2A", fontFamily: "system-ui, -apple-system, sans-serif" }}>{letter}</span>
                </div>
              ))}
            </div>
            {/* XP Dialogs — stacked vertically */}
            <div className="space-y-3 pt-4">
              {[
                { title: "Recycle Bin", message: "Are you sure you want to delete ex_boyfriend_pics.zip?", icon: "🗑️", buttons: ["Yes", "ABSOLUTELY"] },
                { title: "MSN Messenger", message: "ur crush is online. Act natural.", icon: "💬", buttons: ["OMG", "Play it cool"] },
                { title: "Webkinz", message: "Your Webkinz is starving. This is a formal warning.", icon: "⚠️", buttons: ["Feed it", "Neglect"] },
                { title: "Error", message: "Ctrl+Z cannot undo your last text.", icon: "❓", buttons: ["Cry", "OK"] },
              ].map((d) => (
                <div key={d.title} className="rounded-t-lg overflow-hidden shadow-xl" style={{ border: "1px solid #0054E3", fontFamily: "Tahoma, sans-serif" }}>
                  <div className="flex items-center justify-between px-2 py-1" style={{ background: "linear-gradient(180deg, #0A246A, #3A6EA5, #0A246A)" }}>
                    <span className="text-[11px] font-bold text-white">{d.title}</span>
                    <button className="w-[18px] h-[16px] rounded-sm text-[10px] flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(180deg, #E08070, #C84030)", border: "1px solid #993322" }}>✕</button>
                  </div>
                  <div className="bg-[#ECE9D8] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{d.icon}</span>
                      <p className="text-[12px] text-gray-800 leading-relaxed mt-0.5">{d.message}</p>
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                      {d.buttons.map((btn) => (
                        <button key={btn} className="px-5 py-1 text-[11px] rounded-sm" style={{ background: "linear-gradient(180deg, #FFFFFF, #ECE9D8, #D6D0C4)", border: "1px solid #003C74", boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset" }}>{btn}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Y2K Canvas — Desktop ── */}
          <div
            className="relative w-full overflow-hidden overflow-x-hidden hidden md:block"
            style={{
              minHeight: "calc(100vh - 140px)",
              background: "#FFFDFB",
              cursor: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M2 0L2 20L7 15L11 22L14 20.5L10 14L16 14Z' fill='white' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E\") 2 2, auto",
            }}
          >


            {/* ── Clippy — bottom left ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute right-[26vw] top-[12%] z-30"
            >
              <Clippy />
            </motion.div>

            {/* ── Winamp — center left ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.04, y: -3, transition: { delay: 0, duration: 0.2 } }}
              transition={{ delay: 0.16 }}
              className="absolute left-[22vw] top-[35%]"
            >
              <Winamp />
            </motion.div>

            {/* ── Limewire — center bottom ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              whileHover={{ scale: 1.03, y: -3, transition: { delay: 0, duration: 0.2 } }}
              transition={{ delay: 0.22 }}
              className="absolute right-[32vw] top-[28%]"
            >
              <LimewireDownload />
            </motion.div>

            {/* ── Sparkle cursor trail ── */}
            <SparkleTrail />

            {/* ── iPod — far top-left ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -6 }}
              animate={{ opacity: 1, y: 0, rotate: -6 }}
              whileHover={{ scale: 1.04, y: -4, transition: { delay: 0, duration: 0.2 } }}
              transition={{ delay: 0.05 }}
              className="absolute left-[3vw] top-[4%] origin-top-left"
              style={{ transform: "scale(0.6) rotate(-6deg)" }}
            >
              <IPodNano />
            </motion.div>

            {/* ── MS Paint — right side, below AIM ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: 2 }}
              animate={{ opacity: 1, y: 0, rotate: 2 }}
              whileHover={{ scale: 1.03, y: -3, transition: { delay: 0, duration: 0.2 } }}
              transition={{ delay: 0.12 }}
              className="absolute right-[6vw] top-[52%]"
            >
              <MSPaint />
            </motion.div>

            {/* ── AIM Away Message — center area ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -3, transition: { delay: 0, duration: 0.2 } }}
              transition={{ delay: 0.08 }}
              className="absolute right-[6vw] top-[3%]"
            >
              <div className="shadow-xl" style={{ width: 280, fontFamily: "Tahoma, MS Sans Serif, sans-serif" }}>
                {/* AIM window behind */}
                <div className="absolute -left-[60px] top-[20px] w-[80px] rounded-t-sm overflow-hidden" style={{ border: "2px solid #808080" }}>
                  <div className="flex items-center justify-between px-1 py-0.5" style={{ background: "linear-gradient(90deg, #000080, #1084D0)" }}>
                    <span className="text-[7px] font-bold text-white">SaMsAThE...</span>
                  </div>
                  <div className="bg-[#C0C0C0] p-1">
                    <div className="text-[6px] text-gray-600">My AIM People Help</div>
                    <div className="flex items-center justify-center py-2">
                      <img src="/aim-logo.webp" alt="AIM" className="w-[30px] h-[30px] object-contain" />
                    </div>
                    <div className="text-[7px] space-y-0.5 px-1">
                      <div className="flex items-center gap-1"><span className="text-[6px]">📂</span> <span className="font-bold">Buddies (0)</span></div>
                      <div className="flex items-center gap-1"><span className="text-[6px]">📂</span> <span>Family (0)</span></div>
                      <div className="flex items-center gap-1"><span className="text-[6px]">📂</span> <span>Co-Workers</span></div>
                      <div className="flex items-center gap-1"><span className="text-[6px]">📂</span> <span>Offline (0)</span></div>
                    </div>
                  </div>
                </div>

                {/* Edit Away Message window */}
                <div className="rounded-t-sm overflow-hidden relative z-10" style={{ border: "2px solid #808080" }}>
                  {/* Title bar */}
                  <div className="flex items-center justify-between px-1.5 py-0.5" style={{ background: "linear-gradient(90deg, #000080, #1084D0)" }}>
                    <span className="text-[10px] font-bold text-white">Edit Away Message</span>
                    <button className="w-[14px] h-[12px] rounded-sm text-[8px] flex items-center justify-center text-black" style={{ background: "#C0C0C0", border: "1px outset #DFDFDF" }}>✕</button>
                  </div>

                  <div className="bg-[#C0C0C0] p-3 space-y-2">
                    {/* Label field */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]">Enter label:</span>
                      <div className="flex-1 bg-white border border-gray-500 px-1 py-0.5">
                        <span className="text-[10px]">Busy</span>
                      </div>
                    </div>

                    {/* Message area */}
                    <div>
                      <span className="text-[9px]">Enter new Away message:</span>
                      {/* Toolbar */}
                      <div className="flex items-center gap-0.5 mt-1 mb-1 px-1 py-0.5 bg-[#D4D0C8] border border-gray-400">
                        {["A", "𝐀", "ᴬ", "A", "𝔸", "B", "𝐼", "U", "link", "☺"].map((t, i) => (
                          <span key={i} className="text-[8px] px-0.5 text-gray-700">{t}</span>
                        ))}
                      </div>
                      {/* Message content */}
                      <div className="bg-white border border-gray-500 p-2 min-h-[70px]">
                        <p className="text-[11px] leading-relaxed" style={{ fontFamily: "Comic Sans MS, cursive" }}>
                          <span className="font-bold text-pink-600">**BRB**</span><br />
                          <span className="text-purple-700">viBe cOdiNg w/ cLaUdE</span><br />
                          <span className="text-blue-600">thEn piCkLeBaLL @ 6</span> 🏓<br />
                          <span className="text-pink-500">dO nOt DiStUrB LoL</span> 😎
                        </p>
                      </div>
                    </div>

                    {/* Special characters */}
                    <div className="text-[8px] text-gray-600 space-y-0.5">
                      <p>Special Characters:</p>
                      <p>&nbsp;&nbsp;%n = Screen Name of Buddy</p>
                      <p>&nbsp;&nbsp;%d = Current date</p>
                      <p>&nbsp;&nbsp;%t = Current time</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 pt-1">
                      <div className="flex items-center gap-1 text-[8px] text-gray-600 mr-auto">
                        Save for later use <div className="w-[10px] h-[10px] border border-gray-500 bg-white" />
                      </div>
                      <button className="px-3 py-0.5 text-[10px] active:border-inset active:translate-y-[1px]" style={{ background: "#D4D0C8", border: "2px outset #DFDFDF" }} onClick={() => {}}>I&apos;m Away</button>
                      <button className="px-3 py-0.5 text-[10px] active:translate-y-[1px]" style={{ background: "#D4D0C8", border: "2px outset #DFDFDF" }} onClick={() => {}}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Internet Explorer — opens Webkinz ── */}
            <IEBrowser />

            {/* ── XP Desktop Folders ── */}
            <XPFolders />

            {/* ── Big CD Cases — under iPod, left side ── */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -6 }}
              animate={{ opacity: 1, y: 0, rotate: -6 }}
              whileHover={{ scale: 1.06, y: -4, rotate: 0, transition: { delay: 0, duration: 0.2 } }}
              whileTap={{ scale: 0.95, transition: { delay: 0, duration: 0.1 } }}
              transition={{ delay: 0.1 }}
              className="absolute left-[4vw] top-[58%] cursor-pointer"
            >
              <BigCDCase cover="/hannah.jpg" title="Hannah Montana" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 4 }}
              whileHover={{ scale: 1.06, y: -4, rotate: 0, transition: { delay: 0, duration: 0.2 } }}
              whileTap={{ scale: 0.95, transition: { delay: 0, duration: 0.1 } }}
              transition={{ delay: 0.14 }}
              className="absolute left-[16vw] top-[66%] cursor-pointer"
            >
              <BigCDCase cover="/avril.jpg" title="Avril Lavigne - Let Go" />
            </motion.div>

            {/* ── Tiger Beat Magazine ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -8 }}
              whileHover={{ rotate: -2, scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 0.18 }}
              className="absolute right-[34vw] top-[55%] cursor-pointer"
            >
              <div className="relative" style={{ width: 150 }}>
                <img
                  src="/tiger-beat.jpeg"
                  alt="Tiger Beat Magazine"
                  className="w-full rounded-[4px]"
                  style={{
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)",
                  }}
                />
                {/* Magazine gloss */}
                <div className="absolute inset-0 rounded-[4px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(255,255,255,0.05) 60%, transparent 100%)" }} />
                {/* Subtle page edge on the right */}
                <div className="absolute top-[2px] right-0 bottom-[2px] w-[3px] rounded-r-[2px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.05))" }} />
              </div>
            </motion.div>

            {/* ── Baby Lips — physical object, corner ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: 12 }}
              animate={{ opacity: 1, y: 0, rotate: 12 }}
              whileHover={{ rotate: 0, scale: 1.1 }}
              whileTap={{ scale: 0.95, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="absolute right-[28vw] top-[55%] cursor-pointer"
            >
              <img src="/baby-lips.png" alt="Maybelline Baby Lips" className="h-[220px] object-contain" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.12))" }} />
            </motion.div>


            {/* ── Friendship bracelet beads ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.06, y: -3, transition: { delay: 0, duration: 0.2 } }}
              transition={{ delay: 0.2 }}
              className="absolute right-[28vw] top-[82%] rotate-[-6deg]"
            >
              <div className="flex items-center gap-[3px] relative">
                {/* Elastic string */}
                <div className="absolute top-1/2 left-[4px] right-[4px] h-[3px] -translate-y-1/2 z-0 rounded-full" style={{ background: "linear-gradient(90deg, transparent, #F0B0C8 8%, #E890B0 50%, #F0B0C8 92%, transparent)" }} />
                {["T", "A", "Y", "L", "O", "R"].map((letter, i) => {
                  const isCharm = false;
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: Math.random() * 20 - 10 }}
                      animate={{ scale: 1, rotate: (i % 2 === 0 ? -2 : 3) }}
                      transition={{ delay: 0.25 + i * 0.04, type: "spring", stiffness: 400, damping: 12 }}
                      className="relative z-10 flex items-center justify-center shrink-0"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: isCharm
                          ? letter === "♡" ? "linear-gradient(145deg, #FF85C0, #FF3399, #CC1177)" : "linear-gradient(145deg, #FFE44D, #FFB800, #CC9400)"
                          : "radial-gradient(circle at 35% 30%, #FFFFFF, #F5F5F5 40%, #E0E0E0 80%, #D0D0D0)",
                        boxShadow: isCharm
                          ? "0 3px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)"
                          : "0 3px 8px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* Hole through bead */}
                      {!isCharm && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[6px] h-[6px] rounded-full absolute" style={{ background: "radial-gradient(circle, rgba(0,0,0,0.06) 0%, transparent 70%)", top: 2 }} />
                        </div>
                      )}
                      <span
                        className="font-black select-none"
                        style={{
                          fontSize: isCharm ? 14 : 16,
                          color: isCharm ? "white" : "#2A2A2A",
                          fontFamily: "system-ui, -apple-system, sans-serif",
                          textShadow: isCharm ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
                          letterSpacing: "-0.5px",
                        }}
                      >{letter}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Chrome Dino running across bottom ── */}
            <div className="absolute bottom-[6px] left-0 right-0 h-[80px] z-30 pointer-events-none">
              {/* Ground line */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-400/30" />
              {/* Dino */}
              <motion.div
                className="absolute bottom-[2px]"
                animate={{ x: ["-80px", "calc(100vw + 80px)"] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <img src="/dino.png" alt="dino" style={{ width: 60, height: 60, objectFit: "contain", imageRendering: "pixelated" }} />
              </motion.div>
            </div>

            {/* ── XP Dialog Stack — bottom center ── */}
            <div className="absolute left-[35vw] bottom-[8%] w-[380px] h-[300px]" style={{ position: "absolute" }}>
              <XPDialogStack />
            </div>

          </div>

          </motion.div>
          )}
          </AnimatePresence>


        </motion.div>
      )}
      </AnimatePresence>

      <main className={`mx-auto max-w-3xl px-6 pt-28 pb-16 ${activeTab === "Vibes" ? "hidden" : ""}`}>
        <AnimatePresence mode="wait">
          {/* ─── HOME TAB ─── */}
          {activeTab === "Home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <section className="relative mb-32 flex min-h-[60vh] flex-col items-center justify-center text-center">
                {/* Floating cursor labels — each moves independently */}
                <CursorLabel
                  label="Design"
                  color="#D46CB3"
                  flip
                  initialX={typeof window !== "undefined" && window.innerWidth < 768 ? -140 : -380}
                  initialY={-120}
                  enterDelay={1.5}
                  driftDurationX={11}
                  driftDurationY={7}
                  driftRangeX={[0, 20, -8, 12]}
                  driftRangeY={[0, -15, 8, -4]}
                />
                <CursorLabel
                  label="Engineering"
                  color="#D46CB3"
                  initialX={typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 340}
                  initialY={30}
                  enterDelay={3.0}
                  driftDurationX={9}
                  driftDurationY={13}
                  driftRangeX={[0, -12, 18, -6]}
                  driftRangeY={[0, 10, -18, 6]}
                />
                <CursorLabel
                  label="Product"
                  color="#D46CB3"
                  initialX={typeof window !== "undefined" && window.innerWidth < 768 ? 110 : 300}
                  initialY={150}
                  enterDelay={4.5}
                  driftDurationX={14}
                  driftDurationY={9}
                  driftRangeX={[0, -10, 6, -14]}
                  driftRangeY={[0, -8, 14, -10]}
                />

                <TypewriterHeadline />

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 2.5 }}
                  className="mt-8 max-w-lg text-xl text-gray-400 leading-relaxed"
                  style={{ fontFamily: "var(--font-abhaya), Georgia, serif", fontWeight: 500 }}
                >
                  Bridging people and technology through{" "}
                  <span className="text-gray-900 font-semibold">thoughtful design</span>
                </motion.p>
              </section>

              {/* Figma "Let's work together" — bottom left */}
              <div className="flex justify-start mb-16 -mt-16 md:mt-0">
                <FigmaWorkTogether />
              </div>
            </motion.div>
          )}

          {/* ─── PROJECTS TAB ─── */}
          {activeTab === "Projects" && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectsView />
            </motion.div>
          )}

          {/* ─── PROTOTYPES TAB ─── */}
          {activeTab === "Prototypes" && (
            <motion.div
              key="prototypes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PrototypesView />
            </motion.div>
          )}

          {/* ─── RESUME TAB ─── */}
          {activeTab === "Resume" && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Download resume — far left */}
              <div className="md:absolute md:left-[-24vw] md:top-[30%] mb-6 md:mb-0">
                <ComicalResumeRow />
              </div>

              {/* Bio tagline — far right */}
              <div className="md:absolute md:right-[-20vw] md:top-[30%] mb-6 md:mb-0 w-[280px]">
                <ResumeTagline />
              </div>

              <IDBadgeCoverflow />
              <div className="space-y-4">
                {experiences.map((exp, i) => (
                  <ExpCard key={exp.company} {...exp} index={i} />
                ))}
              </div>

              {/* Skills pills */}
              <div className="mt-12">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Skills & Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "SwiftUI", "Swift", "iOS", "UIKit", "Design Systems",
                    "Figma", "Prototyping", "Interaction Design", "Motion Design",
                    "AI-Assisted Development", "Claude", "MCP Integrations",
                    "Accessibility", "WCAG", "Design Tokens", "Component Libraries",
                    "API Design", "Metal", "Flutter", "React", "TypeScript", "Next.js",
                    "Design Engineering", "Product Design", "Git",
                  ].map((skill) => (
                    <span key={skill} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500">{skill}</span>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* ─── ABOUT TAB (removed) ─── */}
          {false && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Mode toggle */}
              <div className="flex justify-center mb-12">
                <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
                  <button
                    onClick={() => setAboutMode("modern")}
                    className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors`}
                  >
                    {aboutMode === "modern" && (
                      <motion.div layoutId="about-mode" className="absolute inset-0 rounded-full bg-black" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <span className={`relative z-10 ${aboutMode === "modern" ? "text-white" : "text-gray-500"}`}>Modern</span>
                  </button>
                  <button
                    onClick={() => setAboutMode("y2k")}
                    className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors`}
                  >
                    {aboutMode === "y2k" && (
                      <motion.div layoutId="about-mode" className="absolute inset-0 rounded-full bg-black" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <span className={`relative z-10 ${aboutMode === "y2k" ? "text-white" : "text-gray-500"}`}>Y2K</span>
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
              {aboutMode === "modern" ? (
              <motion.div key="modern" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

              {/* Bookshelf */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">What I&apos;m reading</h3>
              <p className="text-sm text-gray-400 mb-8">My current bookshelf</p>

              <div className="relative">
                {/* Books */}
                <div className="flex gap-4 items-end pb-4 overflow-x-auto">
                  {books.map((book, i) => (
                    <motion.div
                      key={book.title}
                      initial={{ opacity: 0, y: 20, rotateZ: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
                      whileHover={{ y: -12, rotateZ: -2, transition: { duration: 0.2 } }}
                      className="relative cursor-pointer shrink-0 group"
                    >
                      {/* Book cover */}
                      <div
                        className="w-[120px] rounded-lg shadow-lg overflow-hidden transition-shadow group-hover:shadow-xl"
                        style={{
                          height: 170 + (i % 3) * 10,
                          background: book.cover ? "none" : book.color,
                        }}
                      >
                        {book.cover ? (
                          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent w-[6px]" />
                            <div className="h-full flex flex-col justify-end p-3">
                              <p className="text-[10px] font-bold text-white/90 leading-tight">{book.title}</p>
                              <p className="text-[8px] text-white/60 mt-1">{book.author}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Shelf */}
                <div className="h-[6px] bg-gray-200 rounded-full shadow-inner" />
                <div className="h-[2px] bg-gray-300/50 mt-[1px] rounded-full" />
              </div>

              {/* Coverflow Music */}
              <div className="mt-16 mb-16">
                <h3 className="text-xl font-bold text-gray-900 mb-2">What I&apos;m listening to</h3>
                <p className="text-sm text-gray-400 mb-8">On repeat lately</p>
                <CoverFlow />
              </div>


              {/* Photos */}
              <div className="mt-16">
                <h3 className="text-xl font-bold text-gray-900 mb-2">A few moments</h3>
                <p className="text-sm text-gray-400 mb-8">Life outside of work</p>
                <div className="columns-3 gap-3 space-y-3 -mx-6">
                  {lifePhotos.map((photo, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="break-inside-avoid rounded-xl overflow-hidden"
                    >
                      <img src={photo} alt="" className="w-full object-cover hover:scale-105 transition-transform duration-500" />
                    </motion.div>
                  ))}
                  {lifePhotos.length === 0 && (
                    <p className="text-sm text-gray-300 col-span-3">Drop photos in /public/life/</p>
                  )}
                </div>
              </div>

              </motion.div>
              ) : (
              <motion.div key="y2k" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

                {/* Y2K Music — iPod Nano */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Now Playing</h3>
                <p className="text-sm text-gray-400 mb-8 text-center">Scroll the click wheel to browse</p>
                <IPodNano />

                {/* Y2K Books — CD Jewel Cases with disc */}
                <div className="mt-16">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">On my shelf</h3>
                  <p className="text-sm text-gray-400 mb-8">Click to eject the disc</p>
                  <div className="flex gap-6 overflow-x-auto pb-4">
                    {books.map((book, i) => (
                      <CDCase key={book.title} book={book} index={i} />
                    ))}
                  </div>
                </div>

                {/* Y2K UIs that raised me */}
                <div className="mt-16">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">UI&apos;s that raised me</h3>
                  <p className="text-sm text-gray-400 mb-8">The screens I grew up on</p>
                  <div className="grid grid-cols-3 gap-5">
                    {y2kUIs.map((ui, i) => (
                      <motion.div
                        key={ui.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ y: -4 }}
                        className="cursor-pointer"
                      >
                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                          {ui.src ? (
                            <img src={ui.src} alt={ui.label} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-300">Drop screenshot</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-700 mt-2 text-center">{ui.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

              </motion.div>
              )}
              </AnimatePresence>

            </motion.div>
          )}


          {/* ─── CONTACT TAB ─── */}
          {activeTab === "Contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative min-h-[70vh] flex flex-col md:block"
            >
              {/* Left — contact info, absolutely positioned on desktop, inline on mobile */}
              <div className="md:absolute md:left-[-24vw] md:bottom-[-8%] flex flex-col gap-5 mb-8 md:mb-0">
                <ContactInfoRow
                  icon="/linkedin-icon.png"
                  text="/in/taylor-breitzman"
                  href="https://www.linkedin.com/in/taylor-breitzman-778925152/"
                  delay={1.5}
                />
                <ContactInfoRow
                  icon="/mail-icon.png"
                  text="tbreitz16@gmail.com"
                  href="mailto:tbreitz16@gmail.com"
                  delay={3}
                />
                <ContactInfoRow
                  emoji="📍"
                  text="San Francisco, CA"
                  delay={4.5}
                />
              </div>

              {/* Center — photo + typewriter, unchanged */}
              <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <div className="mb-10">
                  <ContactPhotoFrame />
                </div>
                <div className="h-[100px]">
                  <ContactTypewriter />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
