
import { useEffect, useRef } from 'react';

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
    // Fewer particles for smoother experience on weak devices
    const numberOfPieces = isMobile ? 45 : 90;
    const colors = ['#fde130', '#e91e63', '#00b0ff', '#76ff03', '#ffffff', '#ff9800'];

    const pieces = Array.from({ length: numberOfPieces }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 7 + 4,
      speed: Math.random() * 2.5 + 1.5,
      drift: Math.random() * 1.4 - 0.7,
      active: true,
    }));

    let animationId: number;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyActive = false;
      for (const p of pieces) {
        if (!p.active) continue;
        anyActive = true;

        // Avoid save/restore — faster to set transform directly
        ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        // Reset transform (cheaper than save/restore)
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        p.y += p.speed;
        p.x += p.drift;
        p.rotation += 1.5;

        if (p.y > canvas.height) p.active = false;
      }

      if (anyActive) animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[200]"
    />
  );
};
