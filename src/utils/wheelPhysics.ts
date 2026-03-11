/**
 * wheelPhysics.ts - Pure-function physics engine for the Lucky Wheel.
 *
 * Three-phase motion model:
 *  1. Acceleration  — exponential ramp-up to max angular velocity
 *  2. Cruising+Friction — constant speed then exponential decay
 *  3. Elastic settle — damped spring oscillation locking onto target segment
 *
 * All angles are in RADIANS. Positive = clockwise.
 */

// ── Config ──────────────────────────────────────────────────────

export interface WheelPhysicsConfig {
    /** Number of segments on the wheel */
    segmentCount: number;
    /** Index of the winning segment (0-based) */
    winnerIndex: number;
    /** Minimum full rotations before deceleration */
    minFullRotations?: number;
    /** Acceleration time constant (seconds) */
    accelTau?: number;
    /** Max angular velocity (radians/second) */
    maxOmega?: number;
    /** Friction coefficient for deceleration */
    friction?: number;
    /** Spring damping ratio (< 1 = underdamped = bouncy) */
    dampingRatio?: number;
    /** Spring natural frequency */
    springFreq?: number;
}

const DEFAULTS = {
    minFullRotations: 3,
    accelTau: 0.35,
    maxOmega: 35, // ~5.5 revolutions/sec
    friction: 1.2,
    dampingRatio: 0.25,
    springFreq: 12,
};

// ── Phase types ──────────────────────────────────────────────────

export type WheelPhase =
    | "idle"
    | "accelerating"
    | "cruising"
    | "decelerating"
    | "settling"
    | "done";

export interface WheelState {
    angle: number; // current angle in radians
    omega: number; // current angular velocity
    phase: WheelPhase;
    elapsed: number; // total elapsed since spin started
}

// ── Pure math helpers ────────────────────────────────────────────

const TWO_PI = 2 * Math.PI;

/**
 * Normalise angle to [0, 2π).
 */
export function normalizeAngle(angle: number): number {
    const mod = angle % TWO_PI;
    return mod < 0 ? mod + TWO_PI : mod;
}

/**
 * Compute the center angle of a given segment index.
 * Segments are equally spaced; index 0 is at top (12-o'clock after rotation offset).
 */
export function segmentCenterAngle(
    index: number,
    segmentCount: number,
): number {
    const segmentArc = TWO_PI / segmentCount;
    // index 0 center is at 0 rad (3 o'clock)
    return segmentArc * index;
}

/**
 * Given a current angle, determine which segment is at the "pointer" position.
 * Pointer is at the top (angle 0 after normalisation, but wheel rotates CW
 * so the segment at pointer is at (2π - normalizedAngle)).
 */
export function segmentAtPointer(angle: number, segmentCount: number): number {
    const segmentArc = TWO_PI / segmentCount;
    const normalised = normalizeAngle(angle);
    // Pointer is at 0 rad (3 o'clock).
    // Wheel rotates CW (positive angle).
    // The segment 'i' that is at 0 rad is the one where (angle + i*arc) % 2PI = 0.
    // So i = (2PI - angle) / arc.
    const pointerAngle = normalizeAngle(TWO_PI - normalised);
    return Math.round(pointerAngle / segmentArc) % segmentCount;
}

/**
 * Compute the target angle that places the winner segment center at the pointer.
 * The result includes the minimum rotations offset.
 */
export function computeTargetAngle(
    winnerIndex: number,
    segmentCount: number,
    minRotations: number,
    currentAngle: number,
): number {
    const segmentArc = TWO_PI / segmentCount;
    // Winner center must end up at pointer (3 o'clock = 0 rad).
    // Since wheel is CW, target distance:
    const winnerCenter = segmentArc * winnerIndex;
    const baseTarget = TWO_PI - winnerCenter;

    // Add full rotations so target > currentAngle + minRotations * 2π
    const minAngle = currentAngle + minRotations * TWO_PI;
    const rotationsNeeded = Math.ceil((minAngle - baseTarget) / TWO_PI);
    return baseTarget + rotationsNeeded * TWO_PI;
}

// ── Phase computations (pure) ────────────────────────────────────

/**
 * Acceleration phase: exponential ramp to maxOmega.
 * Returns angular velocity at time t.
 */
export function accelOmega(t: number, maxOmega: number, tau: number): number {
    return maxOmega * (1 - Math.exp(-t / tau));
}

/**
 * Integrated angle during acceleration phase [0..t].
 */
export function accelAngle(t: number, maxOmega: number, tau: number): number {
    // integral of maxOmega * (1 - e^(-t/τ)) dt = maxOmega * (t + τ*e^(-t/τ) - τ)
    return maxOmega * (t + tau * Math.exp(-t / tau) - tau);
}

/**
 * Deceleration phase: exponential friction.
 * omega(t) = omega0 * e^(-μt)
 */
export function decelOmega(t: number, omega0: number, mu: number): number {
    return omega0 * Math.exp(-mu * t);
}

/**
 * Integrated angle during deceleration phase [0..t].
 */
export function decelAngle(t: number, omega0: number, mu: number): number {
    // integral of omega0 * e^(-μt) dt = (omega0/μ) * (1 - e^(-μt))
    return (omega0 / mu) * (1 - Math.exp(-mu * t));
}

/**
 * Total distance the deceleration phase covers (t→∞).
 */
export function decelTotalDistance(omega0: number, mu: number): number {
    return omega0 / mu;
}

/**
 * Elastic settle phase: damped spring oscillation around target angle.
 * θ(t) = θ_target + A * e^(-ζωnt) * sin(ωd*t)
 */
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

/**
 * Angular velocity during elastic settle (derivative of elasticAngle).
 */
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

// ── Simulation stepper ───────────────────────────────────────────

export interface SimulationResult {
    angle: number;
    omega: number;
    phase: WheelPhase;
}

/**
 * Creates a wheel simulation given config. Returns a `step(dt)` function
 * that advances the simulation by dt seconds and returns current state.
 *
 * This is designed to work with requestAnimationFrame — call step(dt)
 * each frame where dt is the time delta in seconds.
 */
export function createWheelSimulation(config: WheelPhysicsConfig) {
    const {
        segmentCount,
        winnerIndex,
        minFullRotations = DEFAULTS.minFullRotations,
        accelTau = DEFAULTS.accelTau,
        maxOmega = DEFAULTS.maxOmega,
        friction = DEFAULTS.friction,
        dampingRatio = DEFAULTS.dampingRatio,
        springFreq = DEFAULTS.springFreq,
    } = config;

    // Pre-compute phase thresholds
    const accelDuration = accelTau * 5; // ~99.3% of max velocity
    const cruiseOmega = accelOmega(accelDuration, maxOmega, accelTau);
    const accelDistance = accelAngle(accelDuration, maxOmega, accelTau);

    // We need to figure out how long to cruise + decel to land on the target.
    // Target angle = distance from angle-after-accel that lands winner at pointer.
    const targetAngle = computeTargetAngle(
        winnerIndex,
        segmentCount,
        minFullRotations,
        accelDistance,
    );
    const totalNeededAfterAccel = targetAngle - accelDistance;

    // Decel covers omega0/mu total distance. We cruise the remainder.
    const decelDistance = decelTotalDistance(cruiseOmega, friction);
    const cruiseDistance = Math.max(0, totalNeededAfterAccel - decelDistance);
    const cruiseDuration = cruiseDistance / cruiseOmega;

    // Phase boundaries (cumulative time)
    const t1_accel = accelDuration;
    const t2_cruise = t1_accel + cruiseDuration;
    // Decel has no hard boundary; we switch to settle when velocity is low enough
    const decelVelocityThreshold = 0.5; // rad/s

    // Elastic settle state
    const settleAmplitude = TWO_PI / segmentCount * 0.6; // overshoot ~60% of a segment

    // Pre-calculate full exact timings requires simulating it once fast since decel is not closed-form on time
    function calculateDuration(): number {
        let simElapsed = 0;
        let simOmega = 0;
        let simPhase = "accelerating";
        let decelStartPhaseElapsed = 0;
        let settleStartElapsed = 0;

        // Skip to end of cruise
        simElapsed = t2_cruise;
        simOmega = cruiseOmega;
        simPhase = "decelerating";
        decelStartPhaseElapsed = simElapsed;

        // Simulate deceleration purely mathematically
        // omega(t) = cruiseOmega * e^(-friction * t)
        // We want t where omega(t) = decelVelocityThreshold
        // decelVelocityThreshold / cruiseOmega = e^(-friction * t)
        // ln(decelVelocityThreshold / cruiseOmega) = -friction * t
        // t = ln(cruiseOmega / decelVelocityThreshold) / friction
        const timeToReachThreshold =
            Math.log(cruiseOmega / decelVelocityThreshold) / friction;

        simElapsed += timeToReachThreshold;
        settleStartElapsed = simElapsed;

        // Settle done when envelope < 0.001
        // envelope = settleAmplitude * exp(-dampingRatio * springFreq * t);
        // 0.001 / settleAmplitude = exp(-dampingRatio * springFreq * t)
        // t = ln(settleAmplitude / 0.001) / (dampingRatio * springFreq)
        const timeToSettle = Math.log(settleAmplitude / 0.001) /
            (dampingRatio * springFreq);

        return simElapsed + timeToSettle;
    }

    let currentAngle = 0;
    let currentPhase: WheelPhase = "idle";
    let phaseStartTime = 0;
    let elapsed = 0;

    // Phase-local accumulators
    let decelStartAngle = 0;
    let settleStartTime = 0;

    function step(realElapsed: number): SimulationResult {
        if (currentPhase === "idle" || currentPhase === "done") {
            return { angle: currentAngle, omega: 0, phase: currentPhase };
        }

        elapsed = realElapsed;
        let omega = 0;

        if (currentPhase === "accelerating") {
            const t = elapsed;
            if (t >= t1_accel) {
                currentAngle = accelDistance;
                currentPhase = cruiseDuration > 0 ? "cruising" : "decelerating";
                phaseStartTime = elapsed;
                if (currentPhase === "decelerating") {
                    decelStartAngle = currentAngle;
                }
                omega = cruiseOmega;
            } else {
                currentAngle = accelAngle(t, maxOmega, accelTau);
                omega = accelOmega(t, maxOmega, accelTau);
            }
        }

        if (currentPhase === "cruising") {
            const t = elapsed - phaseStartTime;
            if (t >= cruiseDuration) {
                currentAngle = accelDistance + cruiseDistance;
                currentPhase = "decelerating";
                phaseStartTime = elapsed;
                decelStartAngle = currentAngle;
                omega = cruiseOmega;
            } else {
                currentAngle = accelDistance + cruiseOmega * t;
                omega = cruiseOmega;
            }
        }

        if (currentPhase === "decelerating") {
            const t = elapsed - phaseStartTime;
            omega = decelOmega(t, cruiseOmega, friction);
            currentAngle = decelStartAngle +
                decelAngle(t, cruiseOmega, friction);

            if (omega < decelVelocityThreshold) {
                currentPhase = "settling";
                settleStartTime = elapsed;
            }
        }

        if (currentPhase === "settling") {
            const t = elapsed - settleStartTime;
            currentAngle = elasticAngle(
                t,
                targetAngle,
                settleAmplitude,
                dampingRatio,
                springFreq,
            );
            omega = elasticOmega(t, settleAmplitude, dampingRatio, springFreq);

            // Done when amplitude is negligible
            const envelopeAmplitude = settleAmplitude *
                Math.exp(-dampingRatio * springFreq * t);
            if (envelopeAmplitude < 0.001) {
                currentAngle = targetAngle;
                currentPhase = "done";
                omega = 0;
            }
        }

        return { angle: currentAngle, omega, phase: currentPhase };
    }

    function start() {
        currentAngle = 0;
        currentPhase = "accelerating";
        phaseStartTime = 0;
        elapsed = 0;
        decelStartAngle = 0;
        settleStartTime = 0;
    }

    function reset() {
        currentAngle = 0;
        currentPhase = "idle";
        phaseStartTime = 0;
        elapsed = 0;
    }

    return {
        step,
        start,
        reset,
        getTargetAngle: () => targetAngle,
        getDuration: calculateDuration,
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

/** Lighten a hex color by a percentage */
function lighten(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    const factor = percent / 100;
    return rgbToHex(
        Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
        Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
        Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor)),
    );
}

/** Darken a hex color by a percentage */
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
