"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  size = 200,
  duration = 15,
  delay = 0,
  colorFrom = "#4169E1", // Royal blue - nebula color
  colorTo = "#FFD700",   // Gold - star color
  borderWidth = 1.5,
}) => {
  // Additional cosmic colors for enhanced effect
  const colorMid = "#87CEEB"; // Sky blue

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        padding: borderWidth,
        overflow: "hidden",
        pointerEvents: "none",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
      className={cn(className)}
    >
      {/* Primary beam - larger, slower */}
      <motion.div
        style={{
          position: "absolute",
          width: size,
          height: size,
          background: `linear-gradient(to left, ${colorFrom}, ${colorMid}, ${colorTo}, transparent)`,
          borderRadius: "50%",
          filter: "blur(6px)",
          opacity: 0.9,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
        }}
        initial={{
          top: "-50%",
          left: "-50%",
        }}
      />
      {/* Secondary beam - counter-rotating */}
      <motion.div
        style={{
          position: "absolute",
          width: size * 0.6,
          height: size * 0.6,
          background: `linear-gradient(to left, ${colorTo}, ${colorFrom}, transparent)`,
          borderRadius: "50%",
          filter: "blur(3px)",
          opacity: 0.8,
        }}
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: duration * 0.8,
          delay: delay + 0.5,
          repeat: Infinity,
          ease: "linear",
        }}
        initial={{
          bottom: "-30%",
          right: "-30%",
        }}
      />
      {/* Tertiary accent beam - small, fast, bright */}
      <motion.div
        style={{
          position: "absolute",
          width: size * 0.3,
          height: size * 0.3,
          background: `radial-gradient(circle, #ffffff 0%, ${colorMid} 50%, transparent 100%)`,
          borderRadius: "50%",
          filter: "blur(2px)",
          opacity: 0.7,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: duration * 0.5,
          delay: delay + 1,
          repeat: Infinity,
          ease: "linear",
        }}
        initial={{
          top: "50%",
          left: "-20%",
        }}
      />
    </div>
  );
};

export default BorderBeam;
