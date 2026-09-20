import { motion, useReducedMotion } from "motion/react";
import { MOTION } from "../../config/motion";

/** Brass police badge that slams down from close to the camera. */
export function Badge({ label }: { label: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="mx-auto h-44 w-44 drop-shadow-[0_8px_10px_rgb(0_0_0/0.5)]"
      initial={reduced ? false : { scale: 3.2, opacity: 0, rotate: -18 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: MOTION.policeBadge.slamSec, ease: [0.2, 0.9, 0.25, 1] }}
      role="img"
      aria-label={label}
    >
      <polygon
        points="100,6 121,36 156,28 158,64 194,74 172,104 194,134 158,144 156,180 121,172 100,200 79,172 44,180 42,144 6,134 28,104 6,74 42,64 44,28 79,36"
        fill="#d4a72c" stroke="#8a6a12" strokeWidth="5" strokeLinejoin="round"
      />
      <circle cx="100" cy="103" r="56" fill="#e9c24a" stroke="#8a6a12" strokeWidth="4" />
      <circle cx="100" cy="103" r="46" fill="none" stroke="#8a6a12" strokeWidth="2" strokeDasharray="3 4" />
      <text x="100" y="112" textAnchor="middle" fontFamily="Baloo Chettan 2, sans-serif" fontWeight="700" fontSize="27" fill="#5a4308">
        {label}
      </text>
    </motion.svg>
  );
}
