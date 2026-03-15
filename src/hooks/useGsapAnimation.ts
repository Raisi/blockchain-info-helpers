"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";

export function useGsapAnimation(
  animationFn: (ctx: gsap.Context) => void,
  deps: unknown[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      animationFn(ctx);
    }, containerRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}
