"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
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

// ─── Contact Typewriter ───
function ContactTypewriter() {
  const phrases = [
    { text: "Contact me", link: "", subtitle: "" },
    { text: "Email me", link: "mailto:tbreitz16@gmail.com", subtitle: "tbreitz16@gmail.com" },
    { text: "Connect with me", link: "https://linkedin.com/in/taylorbreitzman", subtitle: "linkedin.com/in/taylorbreitzman" },
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
function CarouselPhone({ src, isVideo, title }: { src: string; isVideo: boolean; title: string }) {
  const [ready, setReady] = useState(!isVideo); // images are ready immediately

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative w-[280px] h-[580px] rounded-[48px] border-[8px] border-gray-900 bg-black shadow-2xl overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-b-2xl z-10" />
      <div className="w-full h-full rounded-[40px] overflow-hidden bg-gray-100">
        {isVideo ? (
          <video
            src={src}
            autoPlay loop muted playsInline
            onLoadedData={() => setReady(true)}
            className="w-full h-full object-cover"
          />
        ) : src ? (
          <img src={src} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
            <span className="text-sm text-gray-400 font-medium">Add media</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-[4px] bg-gray-600 rounded-full" />
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

                {/* Preload all videos hidden */}
                <div className="hidden">
                  {prototypes.map((p, i) => p.videoSrc && (
                    <video key={i} src={p.videoSrc} preload="auto" muted />
                  ))}
                </div>

                {/* Phone — entire device swaps */}
                <AnimatePresence mode="wait">
                  <CarouselPhone
                    key={current}
                    src={prototypes[current].videoSrc || prototypes[current].gifSrc || ""}
                    isVideo={!!prototypes[current].videoSrc}
                    title={prototypes[current].title}
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
                    videoSrc={p.videoSrc}
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
    logo: "/logos/ea.jpg",
    role: "Design Engineer — Parasoul (iOS)",
    period: "Mar 2025 — Present",
    description:
      "Building and owning the design system for Parasoul, a generative AI social platform. Bridging design and engineering across SwiftUI components, interactive prototypes, and real-time AI features.",
    highlights: [
      "Architected and maintained a 92+ component design system (SwiftUI) with tokens for color, typography, spacing, icons, gradients, and corner radius",
      "Built a comprehensive Figma-to-code component catalog with 1:1 mapping, enabling product teams to self-serve without designer involvement",
      "Developed interactive AI features including real-time character chat, generative storylines, and AI-driven world creation flows",
      "Created custom animations and micro-interactions — spring physics buttons, chat bubble transitions, parallax scroll effects, and gesture-driven interfaces",
      "Implemented custom squircle corner smoothing algorithm matching Figma's 100% smoothing spec for pixel-perfect design fidelity",
      "Built avatar system (Creator, Character, World) with 8 size tokens, gradient fallbacks, and transparent video compositing via Metal shaders",
      "Migrated legacy component library (Air*) to new MetaLab design language (ML*) while maintaining backwards compatibility across 90+ production screens",
      "Collaborated directly with MetaLab design agency, translating Figma specs to production Swift and identifying documentation gaps",
    ],
    color: "#0071E3",
  },
  {
    company: "Sidework",
    logo: "/logos/sidework.png",
    role: "Product Design Engineer",
    period: "Mar 2024 — Mar 2025",
    description:
      "Drove 0→1 product development in a fast-paced startup, combining user research, design, prototyping, and engineering to transform abstract concepts into production-ready features.",
    highlights: [
      "Built high-fidelity, interactive prototypes in Figma to validate new product ideas and complex user flows, accelerating alignment and decision-making",
      "Spearheaded a UX redesign informed by behavioral analysis, reducing user errors and support tickets by 40%",
      "Engineered redesigned UI components and flows in Flutter with pixel-perfect fidelity and accessibility compliance",
      "Developed a scalable design system to unify visual language and interaction patterns, streamlining development and ensuring consistency",
      "Iterated rapidly on prototypes based on qualitative and quantitative feedback, improving usability and adoption before engineering implementation",
    ],
    color: "#3DC1B8",
  },
  {
    company: "Spotify",
    logo: "/logos/spotify.png",
    role: "iOS Engineer",
    period: "Oct 2022 — Mar 2024",
    description:
      "Developed a new Ads UI that delivered a 61% increase in click-through rates and a 120% surge in global video click-through rates.",
    highlights: [
      "Delivered 61% increase in overall ad click-through rates and 120% surge in global video CTR",
      "Designed an accessibility-first color-extraction algorithm that dynamically adjusted hue, brightness, and contrast for compliance",
      "Co-created a modular iOS design system for ad formats, enabling scalability and consistency across teams",
      "Collaborated cross-functionally with designers, PMs, and engineers to align on user needs, brand guidelines, and feasibility",
    ],
    color: "#1DB954",
  },
  {
    company: "Nike",
    logo: "/logos/nike.svg",
    role: "iOS Engineer",
    period: "Aug 2021 — Oct 2022",
    description:
      "Worked on the Activity & Innovation team (Valiant Labs) to develop a running app targeting first-time female runners, with emphasis on inclusive design and supportive UX.",
    highlights: [
      "Contributed to design and development of an inclusive running experience for underserved users",
      "Prioritized user-centered approach to foster a supportive running community",
      "Contributed to a design system fitting Nike's brand and UX standards, ensuring consistency and scalability",
      "Focused on usability, aesthetics, and accessible design patterns throughout the app",
    ],
    color: "#111111",
  },
];

const prototypes: { title: string; description: string; tag: string; gifSrc?: string; videoSrc?: string }[] = [
  { title: "World Profile", description: "Immersive world profile with avatar, feed, and floating menu", tag: "SwiftUI", gifSrc: "/projects/world-profile.png" },
  { title: "Character Chat", description: "Interactive AI character conversation with real-time responses", tag: "SwiftUI", videoSrc: "/projects/parasoul-chat.mp4" },
  { title: "Character Portal", description: "Animated portal avatar with transparent video compositing", tag: "Metal + SwiftUI", videoSrc: "/projects/character-portal.mp4" },
  { title: "Galaxy Canvas", description: "Interactive particle canvas with gesture-driven star field", tag: "SwiftUI", videoSrc: "/projects/galaxy-canvas.mp4" },
  { title: "Chat Bubble Animation", description: "Spring-driven message bubbles with staggered entrance transitions", tag: "SwiftUI", videoSrc: "/projects/chat-bubble-anim.mp4" },
  { title: "Navigation Bar", description: "Custom tab bar with diamond divot indicator and fluid transitions", tag: "SwiftUI", videoSrc: "/projects/nav-bar.mp4" },
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
    subtitle: "Design system and product engineering for a generative AI social platform",
    role: "Design Engineer",
    period: "2025",
    color: "#0071E3",
    overview: "Parasoul is EA's generative AI social app where users create characters, build worlds, and interact through AI-driven storylines. I joined as the sole design engineer responsible for the component library, working directly with MetaLab's design team to translate their Figma specs into production SwiftUI. I built and maintained 92+ components, established the design token system, and created a visual catalog ensuring 1:1 parity between design and code.",
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
        body: "The feed is the heart of Parasoul — a TikTok-style vertical scroll of AI-generated storylines. Each card features looping video, character avatars, and engagement actions. Discovery lets users explore new worlds, genres, and creators through a visual grid that adapts to their interests.",
        items: [
          { label: "Feed", src: "/projects/Notifications.png", scroll: false },
          { label: "Discovery", src: "/projects/discover-video.mp4", scroll: false },
          { label: "Feed", src: "/projects/feed-vid1.mp4", scroll: false },
        ],
      },
      {
        title: "Profiles",
        subtitle: "World, Character, and Creator profile experiences",
        body: "Parasoul has three distinct profile types — worlds, characters, and creators — each with their own avatar system, content layout, and interaction patterns. World profiles showcase lore, characters, and storylines. Character profiles feature animated portal avatars with transparent video compositing via Metal shaders. Creator profiles display a portfolio of their worlds and followers.",
        items: [
          { label: "World Profile", src: "/projects/world-profile.png", scroll: false },
          { label: "Character Profile", src: "/projects/character-profile-scroll.mp4", scroll: false },
          { label: "Creator Profile", src: "/projects/creator-profile-scroll.mp4", scroll: false },
        ],
      },
      {
        title: "Chat",
        subtitle: "AI character messaging and group conversations",
        body: "Chat in Parasoul isn't just messaging — it's interactive storytelling. Users can have 1:1 conversations with AI characters that respond in-character, join group chats where multiple characters interact, and message creators directly. I built the chat bubble system with spring-driven entrance animations, typing indicators, and image attachments.",
        items: [
          { label: "Messages", src: "/projects/char-1.png", scroll: false },
          { label: "Group Chat", src: "/projects/group-chat.png", scroll: false },
          { label: "Creator Chat", src: "/projects/creator-chat.png", scroll: false },
          { label: "Chat Profile", src: "/projects/chat-profile.mp4", scroll: false },
        ],
      },
      {
        title: "Design Engineering Prototypes",
        subtitle: "Interactive prototypes and custom interactions built in SwiftUI",
        body: "Beyond the design system, I built custom interactions that pushed SwiftUI's capabilities — from character portal avatars using Metal shader transparency to spring-physics chat animations and gesture-driven split pane navigation. These prototypes were used to align with design on interaction feel before committing to production implementation.",
        items: [
          { label: "Character Chat", src: "/projects/parasoul-chat.mp4", scroll: false },
        ],
      },
    ],
  },
  {
    id: "sidework-pos",
    company: "Sidework",
    logo: "/logos/sidework.png",
    coverImage: "/projects/sidework/Drinks-tab.png",
    title: "Point of Sale Coffee Machine",
    subtitle: "The barista and manager interface for automated beverage dispensing",
    role: "Product Design Engineer",
    period: "2024 — 2025",
    color: "#3DC1B8",
    overview: "Sidework's beverage dispenser needed a POS interface that untrained staff could operate on day one. I designed and built the drink management, dispensing flow, order history, and reporting dashboard in Flutter. The key constraint: no barista training required. The machine handles recipe logic, so the UI just needs to be fast, clear, and error-proof.",
    impact: [
      "Streamlined barista workflow for faster drink preparation",
      "Manager dashboard with real-time sales and inventory data",
      "Audit and reporting tools reducing operational overhead",
    ],
    tools: ["Flutter", "Figma", "Dart"],
    images: [
      "/projects/sidework/pos-cover.png",
      "/projects/sidework/Drinks-tab.png",
      "/projects/sidework/Dispensing-tab.png",
      "/projects/sidework/history-tab.png",
      "/projects/sidework/Modify-drinks.png",
      "/projects/sidework/Data.png",
      "/projects/sidework/Monthly-drinks.png",
      "/projects/sidework/Report-drinks.png",
      "/projects/sidework/Audit.png",
      "/projects/sidework/gregs.png",
    ],
  },
  {
    id: "sidework",
    company: "Sidework",
    logo: "/logos/sidework.png",
    coverImage: "/projects/self-serve-cover.png",
    title: "Self Serve Kiosk",
    subtitle: "Customer-facing ordering for automated beverage dispensing",
    role: "Product Design Engineer",
    period: "2024 — 2025",
    color: "#3DC1B8",
    overview: "I designed the self-serve kiosk interface for locations without trained staff — think office lobbies and convenience stores. Users browse drinks by category, customize modifications (milk, syrup, ice), and dispense directly. My prototype reframed the machine's value proposition, leading Insomnia Cookies to greenlight a pilot. That pilot turned into a storytelling tool for meetings with Coke, Starbucks, Dutch Bros, Pepsi, and Inspire Brands.",
    impact: [
      "40% reduction in user errors and support tickets",
      "High-fidelity interactive prototypes accelerating stakeholder alignment",
      "Scalable design system unifying visual language across the product",
      "Pixel-perfect Flutter implementation with accessibility compliance",
    ],
    tools: ["Flutter", "Figma", "Dart"],
    images: [
      "/projects/sidework/kiosk.png",
      "/projects/sidework/Drink-selection.png",
      "/projects/sidework/Drink-details.png",
      "/projects/sidework/kiosk2.png",
      "/projects/sidework/kiosk3.png",
    ],
  },
  {
    id: "spotify",
    company: "Spotify",
    logo: "/logos/spotify.png",
    title: "Ads UI Redesign",
    subtitle: "Interactive ad formats that increased click-through rates by 61%",
    role: "iOS Engineer",
    period: "2022 — 2024",
    color: "#1DB954",
    overview: "I redesigned Spotify's ad experience on iOS, focusing on making ads feel native to the listening experience rather than interruptive. I built an accessibility-first color extraction algorithm that dynamically adjusted ad backgrounds for contrast compliance, and co-created a modular design system so ad formats could scale across teams without custom engineering per campaign. The result was a 61% increase in overall CTR and 120% surge in global video click-through rates.",
    impact: [
      "61% increase in overall ad click-through rates",
      "120% surge in global video click-through rates",
      "Accessibility-first color extraction algorithm for dynamic contrast",
      "Modular iOS design system for scalable ad formats",
    ],
    tools: ["Swift", "UIKit", "Accessibility", "Core Image"],
    coverImage: "/projects/spotify/chd-phone.png",
    coverVideo: "/projects/spotify/ad-formats.mp4",
    images: [
      "/projects/spotify/spotify1.png",
      "/projects/spotify/spotify2.png",
      "/projects/spotify/spotify3.png",
      "/projects/spotify/spotify-chd.png",
    ],
  },
  {
    id: "nike",
    company: "Nike",
    logo: "/logos/nike.svg",
    title: "Momentum",
    subtitle: "A running app designed for people who don't run yet",
    role: "iOS Engineer",
    period: "2021 — 2022",
    color: "#111111",
    overview: "On Nike's Valiant Labs team, I helped build Momentum — a running app targeting first-time female runners. The challenge wasn't performance tracking (Nike Run Club already did that), it was creating an experience that felt welcoming rather than intimidating. I contributed to the design system, built team-based features, and focused on inclusive UX that made starting a running habit feel achievable.",
    impact: [
      "User-centered design approach for underserved runner demographic",
      "Design system maintaining Nike's brand and UX standards",
      "Emphasis on accessibility, inclusivity, and supportive community features",
    ],
    tools: ["Swift", "SwiftUI", "UIKit"],
    images: [
      "/projects/nike/Momentum1.png",
      "/projects/nike/momentum2.png",
      "/projects/nike/momentum3.png",
    ],
    coverImage: "/projects/nike/nike-cover.png",
    heroImage: "/projects/nike/momentum-header.avif",
    dividerImage: "/projects/nike/momentum-divider.png",
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
            <h2 className="mb-2 text-sm font-medium tracking-wide text-gray-400 uppercase">
              Case Studies
            </h2>
            <p className="mb-10 text-3xl font-semibold tracking-tight text-gray-900">
              Selected Projects
            </p>

            <div className="grid grid-cols-2 gap-5">
              {projects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  whileHover={{ y: -3 }}
                  onClick={() => setSelectedProject(p.id)}
                  className="cursor-pointer rounded-3xl p-5 transition-shadow hover:shadow-lg"
                  style={{
                    background: "rgba(255, 255, 255, 0.75)",
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  {/* Thumbnail */}
                  <div className="mb-4 rounded-xl overflow-hidden bg-white">
                    {(p as any).coverVideo ? (
                      <video
                        src={(p as any).coverVideo}
                        autoPlay loop muted playsInline
                        className="w-full aspect-[4/3] object-cover"
                      />
                    ) : (p as any).coverVideos && (p as any).coverImage ? (
                      <div className="relative w-full aspect-[4/3]">
                        <img src={(p as any).coverImage} alt={p.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center gap-4">
                          {(p as any).coverVideos.map((vid: string, vi: number) => (
                            <div key={vi} className="relative w-[90px] h-[190px] rounded-[20px] border-[3px] border-gray-900 bg-black shadow-xl overflow-hidden">
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36px] h-[10px] bg-black rounded-b-lg z-10" />
                              <div className="w-full h-full rounded-[17px] overflow-hidden">
                                <video src={vid} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[30%] h-[2px] bg-gray-600 rounded-full" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (p as any).coverImage ? (
                      <img src={(p as any).coverImage} alt={p.title} className="w-full aspect-[4/3] object-contain" />
                    ) : (p as any).heroImage ? (
                      <img src={(p as any).heroImage} alt={p.title} className="w-full aspect-[4/3] object-contain" />
                    ) : p.images.length > 0 ? (
                      <img src={p.images[0]} alt={p.title} className="w-full aspect-[4/3] object-contain" />
                    ) : p.logo ? (
                      <div className="w-full aspect-[4/3] flex items-center justify-center">
                        <img src={p.logo} alt={p.company} className="h-16 w-16 rounded-xl object-cover opacity-40" />
                      </div>
                    ) : (
                      <div className="w-full aspect-[4/3] flex items-center justify-center bg-gray-100">
                        <span className="text-sm text-gray-300">Thumbnail</span>
                      </div>
                    )}
                  </div>

                  {/* Company + Title */}
                  <p className="text-xs text-gray-400 mt-1">{p.company}</p>
                  <h3 className="text-sm font-semibold text-gray-900">{p.title}</h3>
                </motion.div>
              ))}
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

            {/* Divider — intentionally removed from top, placed before Context */}

            {/* Title */}
            <h1
              className="text-4xl font-bold tracking-tight text-gray-900 mb-3"
            >
              {project.title}
            </h1>
            <p className="text-lg text-gray-400 mb-10">
              {project.subtitle}
            </p>

            {/* Metadata card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-16">
              <div className="grid grid-cols-5 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Role</p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>{project.role}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Company</p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>{project.company}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Team</p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>Product</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Timeline</p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>{project.period}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Tools & Technologies</p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>{project.tools.join("\n")}</p>
                </div>
              </div>
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

            {/* Divider before context */}
            {"dividerImage" in project && (project as any).dividerImage && (
              <div className="mb-12 -mx-6 rounded-2xl overflow-hidden">
                <img src={(project as any).dividerImage} alt="" className="w-full h-20 object-cover" />
              </div>
            )}

            {/* Context */}
            <div className="mb-16">
              <h2
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                Context
              </h2>
              <p className="text-sm text-gray-400 mb-6" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>
                {project.subtitle}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 p-8">
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontFamily: "var(--font-nouvelle), sans-serif", fontSize: 16 }}
                >
                  {project.overview}
                </p>
              </div>
            </div>

            {/* Full-bleed images (Nike style) */}
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
                    <p className="text-[15px] text-gray-600 leading-relaxed max-w-2xl mt-4" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>
                      {section.body}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-8">
                  {section.items.map((item: any, i: number) => {
                    const isVideo = item.src && (item.src.endsWith(".mp4") || item.src.endsWith(".mov"));

                    if (item.scroll) {
                      return <ScrollingPhone key={i} src={item.src} label={item.label} index={i} duration={item.duration || 12} />;
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ───
export default function Home() {
  const [activeTab, setActiveTab] = useState("Home");
  const tabs = ["Home", "Projects", "Prototypes", "Resume", "Life", "Contact"];

  return (
    <>
      <NavPill tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Figma-style avatar in top right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300, damping: 20 }}
        className="fixed top-7 right-6 z-50 cursor-pointer"
        onClick={() => setActiveTab("Contact")}
      >
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-green-400">
          <img src="/taylor.jpeg" alt="Taylor" className="w-full h-full object-cover" />
        </div>
      </motion.div>

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
                  className="mt-8 max-w-lg text-xl text-gray-400 leading-relaxed"
                  style={{ fontFamily: "var(--font-abhaya), Georgia, serif", fontWeight: 500 }}
                >
                  Bridging people and technology through{" "}
                  <span className="text-gray-900 font-semibold">thoughtful design</span>
                </motion.p>
              </section>
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
              className="-mx-6"
            >
              <div className="columns-3 gap-3 space-y-3">
                {lifePhotos.map((photo, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="break-inside-avoid rounded-xl overflow-hidden"
                  >
                    <img
                      src={photo}
                      alt=""
                      className="w-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </motion.div>
                ))}
              </div>
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
              className="flex flex-col items-center justify-center min-h-[70vh]"
            >
              {/* Photo on top, fixed position */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                className="w-36 h-36 rounded-full overflow-hidden shadow-xl mb-10"
              >
                <img src="/taylor.jpeg" alt="Taylor" className="w-full h-full object-cover" />
              </motion.div>

              {/* Typewriter below — fixed height container prevents shifting */}
              <div className="h-[100px]">
                <ContactTypewriter />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
