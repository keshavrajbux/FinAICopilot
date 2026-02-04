"use client";

import React, { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#87CEEB", // Sky blue shimmer
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "linear-gradient(135deg, #1e3a5f 0%, #2d4a7c 50%, #3d5a9f 100%)", // Deep space blue
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 text-white font-bold",
          "[background:var(--bg)] [border-radius:var(--radius)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          "hover:scale-105 hover:shadow-[0_0_40px_12px_rgba(65,105,225,0.5)]",
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Multi-color cosmic shimmer effect */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: "inherit" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, #FFD700 5deg, ${shimmerColor} 15deg, #ffffff 25deg, transparent 40deg)`,
              animation: `shimmer-spin ${shimmerDuration} linear infinite`,
            }}
          />
        </div>

        {/* Secondary shimmer - counter-rotating */}
        <div
          className="absolute inset-0 overflow-hidden opacity-50"
          style={{ borderRadius: "inherit" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from 180deg, transparent 0deg, #4169E1 8deg, transparent 30deg)`,
              animation: `shimmer-spin-reverse ${parseFloat(shimmerDuration) * 1.5}s linear infinite`,
            }}
          />
        </div>

        {/* Inner content background */}
        <div
          className="absolute inset-[2px] z-10"
          style={{
            background: "var(--bg)",
            borderRadius: `calc(var(--radius) - 2px)`,
          }}
        />

        {/* Button content */}
        <span className="relative z-20 flex items-center gap-2">{children}</span>

        {/* Highlight effect - cosmic glow */}
        <div
          className="absolute inset-0 z-30"
          style={{
            borderRadius: "inherit",
            boxShadow: "inset 0 -8px 15px rgba(135,206,235,0.2), inset 0 2px 10px rgba(255,215,0,0.1)",
            transition: "box-shadow 0.3s ease",
          }}
        />

        <style jsx>{`
          @keyframes shimmer-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes shimmer-spin-reverse {
            from {
              transform: rotate(360deg);
            }
            to {
              transform: rotate(0deg);
            }
          }
        `}</style>
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";

export default ShimmerButton;
