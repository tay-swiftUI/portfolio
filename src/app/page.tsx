"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

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
        style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}
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
      className={`absolute hidden md:flex flex-col pointer-events-none ${flip ? "items-end" : "items-start"}`}
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
          className="self-end mr-1 mt-1"
          style={{ transform: "scaleX(-1)" }}
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
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
      className="fixed top-6 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="glass-heavy flex items-center gap-1 rounded-full px-2 py-1.5">
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
                active === tab ? "text-white" : "text-gray-600 hover:text-black"
              }`}
            >
              {tab}
            </span>
          </button>
        ))}
      </div>
    </motion.nav>
  );
}

// ─── Experience Card ───
function ExpCard({
  company,
  role,
  period,
  description,
  highlights,
  color,
  index,
}: {
  company: string;
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
      className="cursor-pointer glass-card rounded-2xl p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-sm font-bold"
            style={{ background: color }}
          >
            {company[0]}
          </div>
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
}: {
  title: string;
  description: string;
  tag: string;
  index: number;
  gifSrc?: string;
  videoSrc?: string;
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
        <div className="w-full h-full rounded-[26px] overflow-hidden bg-gray-100">
          {videoSrc ? (
            <video src={videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : gifSrc ? (
            <img src={gifSrc} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
              <span className="text-xs text-gray-400 font-medium px-4 text-center">Add media</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[40%] h-[4px] bg-gray-600 rounded-full" />
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        <span className="mt-2 inline-block rounded-full bg-white/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-gray-500 border border-white/50">{tag}</span>
      </div>
    </motion.div>
  );
}

// ─── Prototypes View (Carousel + Grid toggle) ───
function PrototypesView() {
  const [view, setView] = useState<"carousel" | "grid">("carousel");
  const [current, setCurrent] = useState(0);

  const [direction, setDirection] = useState(0);
  const goNext = () => { setDirection(1); setCurrent((c) => (c + 1) % prototypes.length); };
  const goPrev = () => { setDirection(-1); setCurrent((c) => (c - 1 + prototypes.length) % prototypes.length); };

  return (
    <div>
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="mb-2 text-sm font-medium tracking-wide text-gray-400 uppercase">
            iOS Prototypes
          </h2>
          <p className="text-3xl font-semibold tracking-tight text-gray-900">
            Built for iPhone
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
          <button
            onClick={() => setView("carousel")}
            className={`relative rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              view === "carousel" ? "text-white" : "text-gray-500"
            }`}
          >
            {view === "carousel" && (
              <motion.div
                layoutId="view-toggle"
                className="absolute inset-0 rounded-full bg-black"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Carousel</span>
          </button>
          <button
            onClick={() => setView("grid")}
            className={`relative rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              view === "grid" ? "text-white" : "text-gray-500"
            }`}
          >
            {view === "grid" && (
              <motion.div
                layoutId="view-toggle"
                className="absolute inset-0 rounded-full bg-black"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Grid</span>
          </button>
        </div>
      </div>

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

                {/* Phone */}
                <motion.div
                  whileHover={{ rotateX: -2, rotateY: 3, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  style={{ perspective: 800, transformStyle: "preserve-3d" }}
                  className="relative w-[280px] h-[580px] rounded-[48px] border-[8px] border-gray-900 bg-black shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-b-2xl z-10" />
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={current}
                      custom={direction}
                      initial={(d: number) => ({ opacity: 0, x: d * 120, scale: 0.92, rotateY: d * 15 })}
                      animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                      exit={(d: number) => ({ opacity: 0, x: d * -120, scale: 0.92, rotateY: d * -15 })}
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                      className="w-full h-full rounded-[40px] overflow-hidden bg-gray-100"
                      style={{ perspective: 1000 }}
                    >
                      {prototypes[current].videoSrc ? (
                        <video
                          key={prototypes[current].videoSrc}
                          src={prototypes[current].videoSrc}
                          autoPlay loop muted playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : prototypes[current].gifSrc ? (
                        <img
                          src={prototypes[current].gifSrc}
                          alt={prototypes[current].title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
                          <span className="text-sm text-gray-400 font-medium">
                            Add media
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-[4px] bg-gray-600 rounded-full" />
                </motion.div>
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
            <div className="grid grid-cols-3 gap-8">
              {prototypes.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => { setCurrent(i); setView("carousel"); }}
                  className="cursor-pointer"
                >
                  <IPhoneMockup
                    title={p.title}
                    description={p.description}
                    tag={p.tag}
                    index={i}
                    gifSrc={p.gifSrc}
                  />
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
    role: "Design Engineer",
    period: "2024 — Present",
    description:
      "Building and owning the ML design system for Parasoul — a social iOS app. Architected 92+ SwiftUI components, design tokens, and a comprehensive Figma catalog with 1:1 code mapping.",
    highlights: [
      "Architected design token system (color, typography, spacing, icons, gradients)",
      "Built component library adopted across 90+ production screens",
      "Created Figma-to-code documentation bridging design and engineering",
      "Migrated legacy component system to new design language",
    ],
    color: "#0071E3",
  },
  {
    company: "Spotify",
    role: "iOS Engineer",
    period: "Previous",
    description:
      "Contributed to the Spotify iOS app, working on user-facing features and performance improvements at massive scale.",
    highlights: [
      "Built features reaching millions of daily active users",
      "Worked with Swift and UIKit in a large-scale codebase",
      "Collaborated with cross-functional design and product teams",
    ],
    color: "#1DB954",
  },
  {
    company: "Nike",
    role: "iOS Engineer",
    period: "Previous",
    description:
      "Developed iOS experiences for Nike's digital ecosystem, focusing on interactive and motion-driven interfaces.",
    highlights: [
      "Built interactive UI components with custom animations",
      "Contributed to Nike's iOS design system",
      "Worked on performance-critical rendering and smooth 60fps interactions",
    ],
    color: "#111111",
  },
];

const prototypes: { title: string; description: string; tag: string; gifSrc?: string; videoSrc?: string }[] = [
  { title: "Design System Catalog", description: "92+ components with 1:1 Figma-to-code mapping", tag: "SwiftUI" },
  { title: "Avatar System", description: "Creator, Character & World with gradient fallbacks", tag: "SwiftUI" },
  { title: "Squircle Corners", description: "Figma's 100% corner smoothing in Swift", tag: "SwiftUI" },
  { title: "Spring Animations", description: "Physics-based button interactions with haptics", tag: "UIKit" },
  { title: "Chat Bubble System", description: "Adaptive bubbles with image and reaction variants", tag: "SwiftUI" },
  { title: "Floating Menu", description: "Toolbar with drawing tools, mentions, and color picker", tag: "SwiftUI" },
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

const bentoItems = [
  { label: "Travel", span: "col-span-2 row-span-2" },
  { label: "Music" },
  { label: "Photography" },
  { label: "Cooking", span: "col-span-2" },
  { label: "Reading" },
  { label: "Hiking" },
  { label: "Design Inspiration", span: "col-span-2" },
];

// ─── Page ───
export default function Home() {
  const [activeTab, setActiveTab] = useState("Home");
  const tabs = ["Home", "Prototypes", "Playground", "Resume", "Life"];

  return (
    <>
      <NavPill tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <main className="mx-auto max-w-3xl px-6 pt-28 pb-16">
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
                  initialX={-380}
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
                  initialX={340}
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
                  initialX={300}
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
                  className="mt-8 max-w-lg text-xl text-gray-400 leading-relaxed font-light"
                  style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}
                >
                  Bridging people and technology through{" "}
                  <span className="text-gray-900 font-medium">thoughtful design</span>
                </motion.p>
              </section>
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

          {/* ─── PLAYGROUND TAB ─── */}
          {activeTab === "Playground" && (
            <motion.div
              key="playground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="mb-2 text-sm font-medium tracking-wide text-gray-400 uppercase">
                Experiments
              </h2>
              <p className="mb-10 text-3xl font-semibold tracking-tight text-gray-900">
                Playground
              </p>
              <div className="grid grid-cols-3 gap-4 auto-rows-[200px]">
                {playgroundItems.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.02 }}
                    className={`group relative cursor-pointer overflow-hidden glass-card rounded-2xl p-6 ${item.span || ""}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 text-6xl">
                      {item.emoji}
                    </div>
                    <div className="relative z-10 flex h-full flex-col justify-end">
                      <span className="mb-1 inline-block w-fit rounded-full bg-white/60 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-gray-500 border border-white/50">
                        {item.tag}
                      </span>
                      <h3 className="text-[15px] font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
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
            >
              <h2 className="mb-2 text-sm font-medium tracking-wide text-gray-400 uppercase">
                Experience
              </h2>
              <p className="mb-8 text-3xl font-semibold tracking-tight text-gray-900">
                Where I&apos;ve worked
              </p>
              <div className="space-y-4">
                {experiences.map((exp, i) => (
                  <ExpCard key={exp.company} {...exp} index={i} />
                ))}
              </div>

              <div className="mt-12 text-center">
                <a
                  href="mailto:projectairtaylor@gmail.com"
                  className="inline-block rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
                >
                  Get in touch
                </a>
              </div>
            </motion.div>
          )}

          {/* ─── LIFE TAB ─── */}
          {activeTab === "Life" && (
            <motion.div
              key="life"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="mb-2 text-sm font-medium tracking-wide text-gray-400 uppercase">
                Beyond the screen
              </h2>
              <p className="mb-8 text-3xl font-semibold tracking-tight text-gray-900">
                Life outside of work
              </p>
              <div className="grid grid-cols-3 gap-3 auto-rows-[160px]">
                {bentoItems.map((item, i) => (
                  <BentoCard key={item.label} {...item} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
