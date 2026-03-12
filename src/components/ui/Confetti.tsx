
import React, { useEffect, useRef } from 'react';

export const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const isMobile = window.innerWidth < 768;
    const numberOfPieces = isMobile ? 60 : 120;
    const colors = ['#fde130', '#e91e63', '#00b0ff', '#76ff03', '#ffffff'];

    const pieces = Array.from({ length: numberOfPieces }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      speed: Math.random() * 2.5 + 1.5,
      drift: Math.random() * 1.5 - 0.75,
      active: true,
    }));

    let animationId: number;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyActive = false;
      for (const p of pieces) {
        if (!p.active) continue;
        anyActive = true;

        ctx.save();
        ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        p.y += p.speed;
        p.x += p.drift;
        p.rotation += 1.5;

        if (p.y > canvas.height) {
          p.active = false;
        }
      }

      if (anyActive) {
        animationId = requestAnimationFrame(update);
      }
    };

    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[200]"
    />
  );
};
