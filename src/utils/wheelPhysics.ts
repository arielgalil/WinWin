/**
 * wheelPhysics.ts - Smooth easing-based physics engine for the Lucky Wheel.
 *
 * Three-phase motion model with cosine ease-in/out:
 *  1. Acceleration  — cosine ease-in (0 → peak velocity)
 *  2. Cruising      — constant peak velocity
 *  3. Deceleration  — cosine ease-out (peak velocity → 0, stops EXACTLY on target)
 *
 * The angle is computed analytically as a function of total elapsed time.
 * This guarantees C¹ continuity everywhere (no position or velocity jumps),
 * and the wheel always lands precisely on the winner segment.
 *
 * All angles are in RADIANS. Positive = clockwise.
 */

// ── Phase fractions (must sum to 1.0) ────────────────────────────
const ACCEL_FRAC = 0.15;                              // 15% — ramp up
const DECEL_FRAC = 0.40;                              // 40% — slow down (viewers see it landing)
const CRUISE_FRAC = 1 - ACCEL_FRAC - DECEL_FRAC;     // 45% — full speed

// Normalized peak velocity (angle/time units) so ∫₀¹ v(u) du = 1.
//   Accel contributes:  V_NORM × 2·ACCEL_FRAC/π
//   Cruise contributes: V_NORM × CRUISE_FRAC
//   Decel contributes:  V_NORM × 2·DECEL_FRAC/π
const V_NORM = 1 / (2 * (ACCEL_FRAC + DECEL_FRAC) / Math.PI + CRUISE_FRAC);

// Target peak angular velocity in rad/s (≈ 2 rev/s — fast enough to be exciting,
// slow enough that segments remain visible during cruise).
const PEAK_OMEGA = 13; // rad/s

// ── Config ──────────────────────────────────────────────────────

export interface WheelPhysicsConfig {
    /** Number of segments on the wheel */
    segmentCount: number;
    /** Index of the winning segment (0-based) */
    winnerIndex: number;
    /** Minimum full rotations before deceleration */
    minFullRotations?: number;
    // Legacy params kept for API compatibility — ignored by the new engine
    accelTau?: number;
    maxOmega?: number;
    friction?: number;
    dampingRatio?: number;
    springFreq?: number;
}

const DEFAULTS = {
    minFullRotations: 8, // enough rotations for an exciting spin (~4-5 s)
};

// ── Phase types ──────────────────────────────────────────────────

export type WheelPhase =
    | "idle"
    | "accelerating"
    | "cruising"
    | "decelerating"
    | "settling"   // kept for API compatibility — maps to "decelerating" internally
    | "done";

export interface WheelState {
    angle: number;
    omega: number;
    phase: WheelPhase;
    elapsed: number;
}

// ── Pure math helpers ────────────────────────────────────────────

const TWO_PI = 2 * Math.PI;

export function normalizeAngle(angle: number): number {
    const mod = angle % TWO_PI;
    return mod < 0 ? mod + TWO_PI : mod;
}

export function segmentCenterAngle(
    index: number,
    segmentCount: number,
): number {
    const segmentArc = TWO_PI / segmentCount;
    return segmentArc * index;
}

/**
 * Given a current wheel angle, determine which segment is at the pointer (6 o'clock).
 */
export function segmentAtPointer(angle: number, segmentCount: number): number {
    const segmentArc = TWO_PI / segmentCount;
    const normalised = normalizeAngle(angle);
    const pointerAngle = normalizeAngle(Math.PI / 2 - normalised);
    return Math.round(pointerAngle / segmentArc) % segmentCount;
}

/**
 * Compute the target angle that places the winner segment at the pointer (6 o'clock).
 * Includes enough full rotations to feel like a real spin.
 */
export function computeTargetAngle(
    winnerIndex: number,
    segmentCount: number,
    minRotations: number,
    currentAngle: number,
): number {
    const segmentArc = TWO_PI / segmentCount;
    const winnerCenter = segmentArc * winnerIndex;
    const baseTarget = normalizeAngle(Math.PI / 2 - winnerCenter);

    const minAngle = currentAngle + minRotations * TWO_PI;
    const rotationsNeeded = Math.ceil((minAngle - baseTarget) / TWO_PI);
    return baseTarget + rotationsNeeded * TWO_PI;
}

// ── Legacy math helpers (kept for backward-compat with tests) ────

export function accelOmega(t: number, maxOmega: number, tau: number): number {
    return maxOmega * (1 - Math.exp(-t / tau));
}

export function accelAngle(t: number, maxOmega: number, tau: number): number {
    return maxOmega * (t + tau * Math.exp(-t / tau) - tau);
}

export function decelOmega(t: number, omega0: number, mu: number): number {
    return omega0 * Math.exp(-mu * t);
}

export function decelAngle(t: number, omega0: number, mu: number): number {
    return (omega0 / mu) * (1 - Math.exp(-mu * t));
}

export function decelTotalDistance(omega0: number, mu: number): number {
    return omega0 / mu;
}

export function elasticAngle(
    t: number,
    targetAngle: number,
    amplitude: number,
    zeta: number,
    omegaN: number,
): number {
    const omegaD = omegaN * Math.sqrt(1 - zeta * zeta);
    return targetAngle +
        amplitude * Math.exp(-zeta * omegaN * t) * Math.sin(omegaD * t);
}

export function elasticOmega(
    t: number,
    amplitude: number,
    zeta: number,
    omegaN: number,
): number {
    const omegaD = omegaN * Math.sqrt(1 - zeta * zeta);
    const expTerm = Math.exp(-zeta * omegaN * t);
    return amplitude * expTerm * (
        omegaD * Math.cos(omegaD * t) - zeta * omegaN * Math.sin(omegaD * t)
    );
}

// ── Simulation result ────────────────────────────────────────────

export interface SimulationResult {
    angle: number;
    omega: number;
    phase: WheelPhase;
}

// ── Easing helpers (internal) ─────────────────────────────────────

/**
 * Maps normalized time u ∈ [0,1] to normalized distance ∈ [0,1].
 * Cosine ease-in → linear cruise → cosine ease-out.
 * Continuously differentiable at all transition points.
 */
function easeProgress(u: number): number {
    if (u <= ACCEL_FRAC) {
        // Cosine ease-in: v(u) = V_NORM · sin(π·u / (2·ACCEL_FRAC))
        // Integrated: V_NORM · (2·ACCEL_FRAC/π) · (1 − cos(π·u / (2·ACCEL_FRAC)))
        return V_NORM * (2 * ACCEL_FRAC / Math.PI) *
            (1 - Math.cos(Math.PI * u / (2 * ACCEL_FRAC)));
    }
    const accelEnd = V_NORM * (2 * ACCEL_FRAC / Math.PI);
    if (u <= 1 - DECEL_FRAC) {
        // Linear cruise
        return accelEnd + V_NORM * (u - ACCEL_FRAC);
    }
    // Cosine ease-out: v(u) = V_NORM · cos(π·(u−decelStart) / (2·DECEL_FRAC))
    // Integrated from decelStart: V_NORM · (2·DECEL_FRAC/π) · sin(π·t / (2·DECEL_FRAC))
    const cruiseEnd = accelEnd + V_NORM * CRUISE_FRAC;
    const decelU = u - (1 - DECEL_FRAC);
    return cruiseEnd + V_NORM * (2 * DECEL_FRAC / Math.PI) *
        Math.sin(Math.PI * decelU / (2 * DECEL_FRAC));
}

/** Normalized angular velocity at u ∈ [0,1] (in totalAngle/totalDuration units). */
function easeVelocityNorm(u: number): number {
    if (u <= ACCEL_FRAC) {
        return V_NORM * Math.sin(Math.PI * u / (2 * ACCEL_FRAC));
    } else if (u <= 1 - DECEL_FRAC) {
        return V_NORM;
    } else {
        const decelU = u - (1 - DECEL_FRAC);
        return V_NORM * Math.cos(Math.PI * decelU / (2 * DECEL_FRAC));
    }
}

// ── Simulation factory ───────────────────────────────────────────

export function createWheelSimulation(config: WheelPhysicsConfig) {
    const {
        segmentCount,
        winnerIndex,
        minFullRotations = DEFAULTS.minFullRotations,
    } = config;

    // Exact angle the wheel must rotate to land winner at pointer (6 o'clock).
    // currentAngle=0 since we always start from rest.
    const targetAngle = computeTargetAngle(
        winnerIndex,
        segmentCount,
        minFullRotations,
        0,
    );

    // Total duration derived from desired peak angular velocity.
    //   peak ω = V_NORM · totalAngle / totalDuration  →  totalDuration = V_NORM · totalAngle / PEAK_OMEGA
    const totalDuration = (V_NORM * targetAngle) / PEAK_OMEGA;

    let started = false;

    function step(realElapsed: number): SimulationResult {
        if (!started) {
            return { angle: 0, omega: 0, phase: "idle" };
        }

        const u = Math.min(1, realElapsed / totalDuration);
        const angle = targetAngle * easeProgress(u);
        const omega = u < 1
            ? (targetAngle / totalDuration) * easeVelocityNorm(u)
            : 0;

        let phase: WheelPhase;
        if (u < ACCEL_FRAC) phase = "accelerating";
        else if (u < 1 - DECEL_FRAC) phase = "cruising";
        else if (u < 1) phase = "decelerating";
        else phase = "done";

        return { angle, omega, phase };
    }

    function start() {
        started = true;
    }

    function reset() {
        started = false;
    }

    return {
        step,
        start,
        reset,
        getTargetAngle: () => targetAngle,
        getDuration: () => totalDuration,
    };
}

/**
 * Generate an array of alternating segment colors from campaign palette.
 */
export function generateSegmentColors(
    count: number,
    primaryHex: string,
    secondaryHex: string,
): string[] {
    const colors: string[] = [];
    const palette = [
        primaryHex || "#6366f1",
        secondaryHex || "#818cf8",
        lighten(primaryHex || "#6366f1", 20),
        lighten(secondaryHex || "#818cf8", 15),
        darken(primaryHex || "#6366f1", 10),
        darken(secondaryHex || "#818cf8", 10),
    ];
    for (let i = 0; i < count; i++) {
        colors.push(palette[i % palette.length]);
    }
    return colors;
}

function lighten(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    const factor = percent / 100;
    return rgbToHex(
        Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
        Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
        Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor)),
    );
}

function darken(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    const factor = 1 - percent / 100;
    return rgbToHex(
        Math.round(rgb.r * factor),
        Math.round(rgb.g * factor),
        Math.round(rgb.b * factor),
    );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace("#", "");
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
