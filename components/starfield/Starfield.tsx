'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface Star {
  x: number;
  y: number;
  baseSpeed: number;
  currentSpeed: number;
  size: number;
  opacity: number;
  baseY: number;
  targetX?: number;
  targetY?: number;
}

interface StarfieldProps {
  density?: number;
  color?: string;
  baseSpeed?: number;
  hoverSpeedMultiplier?: number;
  glowIntensity?: number;
  className?: string;
}

export default function Starfield({
  density = 200,
  color = 'rgba(163, 163, 163, 1)',
  baseSpeed = 0.5,
  hoverSpeedMultiplier = 3,
  glowIntensity = 0.8,
  className = '',
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();
  const isHoveringRef = useRef(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const mouseYRef = useRef(0);

  const parseColor = (colorString: string): { r: number; g: number; b: number } => {
    const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    return { r: 163, g: 163, b: 163 };
  };

  const initializeStars = useCallback(
    (width: number, height: number) => {
      return Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        baseY: Math.random() * height,
        baseSpeed: baseSpeed * (0.5 + Math.random() * 1.5),
        currentSpeed: baseSpeed * (0.5 + Math.random() * 1.5),
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
      }));
    },
    [density, baseSpeed]
  );

  const throttledResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (offscreenCanvasRef.current) {
        offscreenCanvasRef.current.width = canvas.width;
        offscreenCanvasRef.current.height = canvas.height;
      }

      starsRef.current = initializeStars(canvas.width, canvas.height);
    }, 150);
  }, [initializeStars]);

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (prefersReducedMotion) return;
      isHoveringRef.current = true;
      mouseYRef.current = event.clientY;
    },
    [prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (typeof document !== 'undefined') {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = canvas.width;
      offscreenCanvasRef.current.height = canvas.height;
      offscreenCtxRef.current = offscreenCanvasRef.current.getContext('2d', { alpha: true });
    }

    starsRef.current = initializeStars(canvas.width, canvas.height);

    window.addEventListener('resize', throttledResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const colorRGB = parseColor(color);
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (!canvas || !ctx) return;

      const deltaTime = Math.min((currentTime - lastTime) / 16, 2);
      lastTime = currentTime;

      const offscreenCtx = offscreenCtxRef.current;
      const drawCtx = offscreenCtx || ctx;
      const drawCanvas = offscreenCtx ? offscreenCanvasRef.current! : canvas;

      drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

      const isHovering = isHoveringRef.current;
      const targetHorizontalY = mouseYRef.current || canvas.height / 2;

      starsRef.current.forEach((star) => {
        const speedMultiplier = prefersReducedMotion ? 0.1 : 1;

        if (isHovering) {
          star.currentSpeed = star.baseSpeed * hoverSpeedMultiplier * speedMultiplier;
          
          if (!star.targetY) {
            star.targetY = targetHorizontalY + (Math.random() - 0.5) * 100;
            star.targetX = star.x;
          }

          const dy = star.targetY - star.y;
          const easing = easeInOutCubic(0.05);
          star.y += dy * easing * deltaTime;
        } else {
          star.currentSpeed = star.baseSpeed * speedMultiplier;
          star.targetY = undefined;
          star.targetX = undefined;
          
          star.y -= star.currentSpeed * deltaTime;

          if (star.y < -10) {
            star.y = canvas.height + 10;
            star.x = Math.random() * canvas.width;
          }
        }

        const gradient = drawCtx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2);
        gradient.addColorStop(
          0,
          `rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${star.opacity * glowIntensity})`
        );
        gradient.addColorStop(
          0.5,
          `rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${star.opacity * glowIntensity * 0.5})`
        );
        gradient.addColorStop(
          1,
          `rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, 0)`
        );

        drawCtx.fillStyle = gradient;
        drawCtx.beginPath();
        drawCtx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
        drawCtx.fill();

        drawCtx.fillStyle = `rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${star.opacity})`;
        drawCtx.beginPath();
        drawCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        drawCtx.fill();
      });

      if (offscreenCtx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenCanvasRef.current!, 0, 0);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', throttledResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [
    density,
    color,
    baseSpeed,
    hoverSpeedMultiplier,
    glowIntensity,
    initializeStars,
    throttledResize,
    handleMouseMove,
    handleMouseLeave,
    prefersReducedMotion,
  ]);

  if (prefersReducedMotion) {
    return (
      <div
        className={`fixed inset-0 -z-10 pointer-events-none ${className}`}
        style={{
          background: `radial-gradient(ellipse at center, rgba(163, 163, 163, 0.03) 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 pointer-events-none ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}
