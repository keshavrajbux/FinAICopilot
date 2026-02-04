"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MeteorStyle extends React.CSSProperties {
  color: string;
  tailLength: number;
  size: number;
}

interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

// Cosmic nebula colors - blues, whites, golds like in the reference image
const METEOR_COLORS = [
  { head: "#ffffff", tail: "rgba(255, 255, 255, 0.8)" },      // Bright white
  { head: "#87CEEB", tail: "rgba(135, 206, 235, 0.8)" },      // Sky blue
  { head: "#4169E1", tail: "rgba(65, 105, 225, 0.7)" },       // Royal blue
  { head: "#FFD700", tail: "rgba(255, 215, 0, 0.7)" },        // Gold
  { head: "#FFA500", tail: "rgba(255, 165, 0, 0.6)" },        // Orange/amber
  { head: "#E0FFFF", tail: "rgba(224, 255, 255, 0.8)" },      // Light cyan
];

export const Meteors: React.FC<MeteorsProps> = ({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}) => {
  const [meteorStyles, setMeteorStyles] = useState<Array<MeteorStyle>>([]);

  useEffect(() => {
    const styles = [...new Array(number)].map(() => {
      const colorSet = METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)];
      return {
        top: "-5%",
        left: `${Math.floor(Math.random() * 100)}%`,
        animationDelay: Math.random() * (maxDelay - minDelay) + minDelay + "s",
        animationDuration:
          Math.floor(Math.random() * (maxDuration - minDuration) + minDuration) + "s",
        color: colorSet.head,
        tailLength: Math.floor(Math.random() * 60) + 40, // 40-100px tail
        size: Math.random() * 2 + 1, // 1-3px head
      } as MeteorStyle;
    });
    setMeteorStyles(styles);
  }, [number, minDelay, maxDelay, minDuration, maxDuration]);

  return (
    <>
      {meteorStyles.map((style, idx) => {
        const colorSet = METEOR_COLORS.find(c => c.head === style.color) || METEOR_COLORS[0];
        return (
          <span
            key={idx}
            style={{
              ...style,
              position: "absolute",
              width: `${style.size}px`,
              height: `${style.size}px`,
              borderRadius: "50%",
              backgroundColor: style.color,
              boxShadow: `0 0 6px 2px ${style.color}, 0 0 12px 4px ${colorSet.tail}`,
              transform: `rotate(${-angle}deg)`,
              animation: `meteor ${style.animationDuration} linear infinite`,
            }}
            className={cn("pointer-events-none", className)}
          >
            {/* Meteor tail with gradient */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                width: `${style.tailLength}px`,
                height: `${Math.max(1, style.size * 0.5)}px`,
                background: `linear-gradient(to right, ${colorSet.tail}, ${colorSet.tail.replace('0.8', '0.3').replace('0.7', '0.2').replace('0.6', '0.1')}, transparent)`,
                borderRadius: "2px",
              }}
            />
            {/* Secondary glow trail */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                width: `${style.tailLength * 0.6}px`,
                height: `${style.size * 2}px`,
                background: `linear-gradient(to right, ${style.color}40, transparent)`,
                filter: "blur(2px)",
                borderRadius: "4px",
              }}
            />
          </span>
        );
      })}
      <style jsx>{`
        @keyframes meteor {
          0% {
            transform: rotate(${-angle}deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(${-angle}deg) translateX(-600px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default Meteors;
