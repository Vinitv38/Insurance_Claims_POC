"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ComplexityGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score <= 30) return "#22C55E";
  if (score <= 60) return "#F59E0B";
  if (score <= 80) return "#E8792B";
  return "#EF4444";
}

function getScoreLabel(score: number): string {
  if (score <= 30) return "LOW";
  if (score <= 60) return "MODERATE";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

export default function ComplexityGauge({ score, size = 220, label }: ComplexityGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="flex flex-col items-center">
      <div className="gauge-container" style={{ width: size, height: size / 2 + 30 }}>
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Background arc */}
          <path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none"
            stroke="#1E293B"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <motion.path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
          {/* Score text */}
          <text
            x={size / 2}
            y={size / 2 - 5}
            textAnchor="middle"
            fill={color}
            fontSize="42"
            fontWeight="800"
            fontFamily="Inter, sans-serif"
          >
            {animatedScore}
          </text>
          <text
            x={size / 2}
            y={size / 2 + 18}
            textAnchor="middle"
            fill="#64748B"
            fontSize="11"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
            letterSpacing="2"
          >
            {scoreLabel}
          </text>
        </svg>
      </div>
      {label && <p className="text-xs text-acme-muted mt-1">{label}</p>}
    </div>
  );
}
