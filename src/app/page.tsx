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
  const [screen, setScreen] = useState<"menu" | "coverflow" | "playing">("menu");
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
    else if (screen === "coverflow") setScreen("menu");
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
        <div className="mx-4 mt-4 w-[188px] h-[155px] rounded-[4px] overflow-hidden bg-white">
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
                {/* Mini coverflow */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ perspective: 200 }}>
                  {albums.map((album, i) => {
                    const offset = i - coverIndex;
                    const absOffset = Math.abs(offset);
                    const isActive = offset === 0;
                    return (
                      <motion.div
                        key={album.title + i}
                        className="absolute"
                        animate={{
                          x: isActive ? 0 : offset * 28 + (offset > 0 ? 15 : -15),
                          rotateY: isActive ? 0 : offset > 0 ? -60 : 60,
                          scale: isActive ? 1 : 0.6,
                          opacity: absOffset > 2 ? 0 : 1 - absOffset * 0.3,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{ zIndex: 50 - absOffset, transformStyle: "preserve-3d" }}
                      >
                        <div
                          className="w-[55px] h-[55px] rounded-[2px] overflow-hidden"
                          style={{
                            background: album.gradient,
                            boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.5)" : "0 2px 6px rgba(0,0,0,0.3)",
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-[5px] text-white/80 font-bold text-center px-1">{album.artist}</p>
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-[55px] h-[15px] mt-[1px] opacity-20" style={{ background: album.gradient, transform: "scaleY(-1)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)" }} />
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
  { company: "Sidework", role: "Design Engineer", period: "2024-2025", color: "#FFFFFF", accent: "#3DC1B8", logo: "/logos/sidework.png", darkText: true },
  { company: "Electronic Arts", role: "Design Engineer", period: "2025", color: "#2D5BE3", accent: "#1A3FC7", logo: "/logos/ea.jpg" },
];

function IDBadgeCoverflow() {
  const [active, setActive] = useState(0);

  return (
    <div className="relative py-4 mb-12">
      <div className="flex items-center justify-center" style={{ perspective: 1000, height: 380 }}>
        {badgeData.map((badge, i) => {
          const offset = i - active;
          const absOffset = Math.abs(offset);
          const isActive = offset === 0;

          return (
            <motion.div
              key={badge.company}
              onClick={() => setActive(i)}
              className="absolute cursor-pointer"
              animate={{
                x: isActive ? 0 : offset * 90 + (offset > 0 ? 50 : -50),
                rotateY: isActive ? 0 : offset > 0 ? -40 : 40,
                scale: isActive ? 1 : 0.7,
                opacity: absOffset > 2 ? 0 : 1 - absOffset * 0.25,
              }}
              transition={{ type: "spring", stiffness: 250, damping: 22 }}
              style={{ zIndex: 100 - absOffset, transformStyle: "preserve-3d" }}
            >
              {/* Lanyard — drops in and dangles */}
              <motion.div
                className="flex flex-col items-center"
                style={{ transformOrigin: "top center" }}
                initial={{ y: -300, rotateZ: -15 + i * 8 }}
                animate={{
                  y: 0,
                  rotateZ: [-3 + i * 2, -1 + i * 1.5, -3 + i * 2],
                }}
                transition={{
                  y: { delay: i * 0.2, type: "spring", stiffness: 80, damping: 10, mass: 1.2 },
                  rotateZ: {
                    delay: 1.5 + i * 0.2,
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatType: "mirror",
                  },
                }}
              >
                {/* Strap — thick black lanyard with company logo */}
                <div className="w-[32px] relative overflow-hidden rounded-[2px]" style={{ height: 180, marginTop: -100, background: "#1A1A1A" }}>
                  {/* Subtle fabric texture */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px)" }} />
                  {/* Company logo on strap — repeated */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
                    {badge.logo && (
                      <>
                        <img src={badge.logo} alt="" className="w-[16px] h-[16px] object-contain opacity-40 brightness-0 invert" />
                        <img src={badge.logo} alt="" className="w-[16px] h-[16px] object-contain opacity-40 brightness-0 invert" />
                      </>
                    )}
                  </div>
                  {/* Edge highlights */}
                  <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-white/5" />
                  <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-white/5" />
                </div>
                {/* Metal clasp */}
                <div className="relative w-[24px] h-[22px] mb-[3px]">
                  {/* Clasp body */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[20px] h-[16px] rounded-b-[4px]" style={{ background: "linear-gradient(180deg, #3A3A3A, #2A2A2A)", boxShadow: "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }} />
                  {/* Hook ring */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full border-[2px]" style={{ borderColor: "#3A3A3A", background: "linear-gradient(135deg, #4A4A4A, #2A2A2A)" }} />
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
              </motion.div>
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

        // Italicize
        setPhase("italic");
        await sleep(3000);
        if (cancelled) return;

        // Reset
        setPhase("done");
        await sleep(8000);
        if (cancelled) return;

        // Clear and restart
        setText("");
        setPhase("hidden");
        await sleep(1000);
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
  const [view, setView] = useState<"carousel" | "grid">("grid");
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
  { title: "SOS", artist: "SZA", color: "#1a1a2e", gradient: "linear-gradient(135deg, #1a1a2e, #4a2c6e)" },
  { title: "Ctrl", artist: "SZA", color: "#8B6914", gradient: "linear-gradient(135deg, #8B6914, #C4A34A)" },
  { title: "RENAISSANCE", artist: "Beyoncé", color: "#C0C0C0", gradient: "linear-gradient(135deg, #888, #CCC)" },
  { title: "Midnights", artist: "Taylor Swift", color: "#1B365D", gradient: "linear-gradient(135deg, #1B365D, #4A6B8A)" },
  { title: "Blonde", artist: "Frank Ocean", color: "#E8E0D0", gradient: "linear-gradient(135deg, #E8E0D0, #F5F0E5)" },
  { title: "good kid, m.A.A.d city", artist: "Kendrick Lamar", color: "#2C1810", gradient: "linear-gradient(135deg, #2C1810, #5A3A2A)" },
  { title: "After Hours", artist: "The Weeknd", color: "#8B0000", gradient: "linear-gradient(135deg, #8B0000, #DC143C)" },
  { title: "IGOR", artist: "Tyler, The Creator", color: "#FFB6C1", gradient: "linear-gradient(135deg, #FFB6C1, #FF69B4)" },
  { title: "Happier Than Ever", artist: "Billie Eilish", color: "#D4C5A9", gradient: "linear-gradient(135deg, #B8A88A, #D4C5A9)" },
];

const books = [
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", color: "#2D3436" },
  { title: "Don't Make Me Think", author: "Steve Krug", color: "#E17055" },
  { title: "The Design of Everyday Things", author: "Don Norman", color: "#0984E3" },
  { title: "Atomic Habits", author: "James Clear", color: "#00B894" },
  { title: "Creative Selection", author: "Ken Kocienda", color: "#6C5CE7" },
  { title: "Hooked", author: "Nir Eyal", color: "#E84393" },
  { title: "Refactoring UI", author: "Wathan & Schoger", color: "#FDCB6E" },
  { title: "Sprint", author: "Jake Knapp", color: "#00CEC9" },
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
          { label: "World Profile", src: "/projects/world-profile.png", scroll: false },
          { label: "Character Profile", src: "/projects/character-profile-scroll.mp4", scroll: false },
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
        title: "Design Engineering Prototypes",
        subtitle: "Interactive prototypes and custom interactions built in SwiftUI",
        body: "",
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
    coverImage: "/projects/sidework/pos-cover.png",
    title: "Point of Sale Coffee Machine",
    subtitle: "Designing to Empower Baristas and Redefine Coffee-Making",
    role: "Product Design Engineer",
    period: "2024 — 2025",
    color: "#3DC1B8",
    overview: "",
    impact: [],
    tools: ["Flutter", "Figma", "Dart"],
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
    tools: ["Flutter", "Figma", "Dart"],
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
    subtitle: "A running app designed for people who don't run yet",
    role: "iOS Engineer",
    period: "2021 — 2022",
    color: "#111111",
    overview: "",
    impact: [],
    hideContext: true,
    tools: ["Swift", "SwiftUI", "UIKit"],
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
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-nouvelle), sans-serif" }}>{(project as any).team || "Product"}</p>
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
                </div>
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
  const [aboutMode, setAboutMode] = useState<"modern" | "y2k">("modern");
  const tabs = ["Home", "Projects", "Prototypes", "Resume", "About", "Contact"];

  return (
    <>
      <NavPill tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Figma-style avatar in top right */}
      {/* Avatar + Figma text box */}
      <div className="fixed top-7 right-6 z-50 flex items-center gap-0">
        <FigmaTextBox onClick={() => setActiveTab("Contact")} />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: "spring", stiffness: 300, damping: 20 }}
          className="cursor-pointer"
          onClick={() => setActiveTab("Contact")}
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md">
            <img src="/taylor.jpeg" alt="Taylor" className="w-full h-full object-cover" />
          </div>
        </motion.div>
      </div>

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
              <IDBadgeCoverflow />
              <div className="space-y-4">
                {experiences.map((exp, i) => (
                  <ExpCard key={exp.company} {...exp} index={i} />
                ))}
              </div>

              <JourneyTimeline />
            </motion.div>
          )}

          {/* ─── ABOUT TAB ─── */}
          {activeTab === "About" && (
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
                      {/* Book spine + cover */}
                      <div
                        className="w-[120px] rounded-lg shadow-lg overflow-hidden transition-shadow group-hover:shadow-xl"
                        style={{
                          height: 170 + (i % 3) * 10,
                          background: book.color,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent w-[6px]" />
                        <div className="h-full flex flex-col justify-end p-3">
                          <p className="text-[10px] font-bold text-white/90 leading-tight">{book.title}</p>
                          <p className="text-[8px] text-white/60 mt-1">{book.author}</p>
                        </div>
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
