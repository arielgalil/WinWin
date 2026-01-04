/**
 * Iris Geometry Utilities
 *
 * This module provides functions for calculating and calibrating iris reveal patterns
 * within rounded-rectangle containers, using Monte Carlo sampling for area estimation.
 */

export interface IrisConfig {
    cx: number; // Center X (0-1 normalized)
    cy: number; // Center Y (0-1 normalized)
    weight: number; // Size multiplier
    delay: number; // Animation delay
}

// Number of sample points for Monte Carlo integration
const MONTE_CARLO_SAMPLES = 2000;

/**
 * Check if a point (x, y) falls within a rounded rectangle.
 * All coordinates are normalized (0-1).
 *
 * @param x - X coordinate (0-1)
 * @param y - Y coordinate (0-1)
 * @param cornerRadius - Corner radius as fraction (0-0.5)
 * @returns true if point is inside the rounded rectangle
 */
export function isPointInRoundedRect(
    x: number,
    y: number,
    cornerRadius: number,
): boolean {
    // Clamp corner radius to valid range
    const r = Math.min(Math.max(cornerRadius, 0), 0.5);

    // Quick rejection for points outside the bounding box
    if (x < 0 || x > 1 || y < 0 || y > 1) return false;

    // Check if point is in the center cross (always inside)
    if (x >= r && x <= 1 - r) return true;
    if (y >= r && y <= 1 - r) return true;

    // Check corners
    const corners = [
        { cx: r, cy: r }, // top-left
        { cx: 1 - r, cy: r }, // top-right
        { cx: r, cy: 1 - r }, // bottom-left
        { cx: 1 - r, cy: 1 - r }, // bottom-right
    ];

    for (const corner of corners) {
        const dx = x - corner.cx;
        const dy = y - corner.cy;
        const distSq = dx * dx + dy * dy;

        // Check if in the corner region and within the arc
        const isInCornerQuadrant = (x < r || x > 1 - r) && (y < r || y > 1 - r);

        if (isInCornerQuadrant) {
            // Must be within the corner's arc
            return distSq <= r * r;
        }
    }

    return true;
}

/**
 * Check if a point is covered by any of the irises.
 *
 * @param x - X coordinate (0-1)
 * @param y - Y coordinate (0-1)
 * @param irises - Array of iris configurations
 * @param scale - Scale factor K applied to all iris radii
 * @returns true if point is covered by at least one iris
 */
export function isPointCoveredByIrises(
    x: number,
    y: number,
    irises: IrisConfig[],
    scale: number,
): boolean {
    for (const iris of irises) {
        const r = scale * iris.weight;
        const dx = x - iris.cx;
        const dy = y - iris.cy;
        if (dx * dx + dy * dy <= r * r) {
            return true;
        }
    }
    return false;
}

/**
 * Calculate the effective coverage fraction using Monte Carlo sampling.
 * Only counts area that is both:
 * 1. Inside the rounded rectangle
 * 2. Covered by at least one iris
 *
 * @param irises - Array of iris configurations
 * @param scale - Scale factor K applied to all iris radii
 * @param cornerRadius - Corner radius as fraction (0-0.5)
 * @returns Fraction of the rounded rect that is revealed (0-1)
 */
export function calculateEffectiveCoverage(
    irises: IrisConfig[],
    scale: number,
    cornerRadius: number,
): number {
    if (irises.length === 0 || scale <= 0) return 0;

    let coveredPoints = 0;
    let validPoints = 0;

    // Use deterministic sampling for consistency
    for (let i = 0; i < MONTE_CARLO_SAMPLES; i++) {
        // Use a quasi-random Halton sequence for better coverage
        const x = haltonSequence(i, 2);
        const y = haltonSequence(i, 3);

        if (isPointInRoundedRect(x, y, cornerRadius)) {
            validPoints++;
            if (isPointCoveredByIrises(x, y, irises, scale)) {
                coveredPoints++;
            }
        }
    }

    return validPoints > 0 ? coveredPoints / validPoints : 0;
}

/**
 * Halton sequence for quasi-random sampling (better than pseudo-random for Monte Carlo)
 */
function haltonSequence(index: number, base: number): number {
    let result = 0;
    let f = 1;
    let i = index + 1; // Start from 1 to avoid 0

    while (i > 0) {
        f = f / base;
        result = result + f * (i % base);
        i = Math.floor(i / base);
    }

    return result;
}

/**
 * Find the scale factor K that achieves a target coverage percentage.
 * Uses binary search for efficiency.
 *
 * @param irises - Array of iris configurations
 * @param targetCoverage - Desired coverage (0-1)
 * @param cornerRadius - Corner radius as fraction (0-0.5)
 * @returns Scale factor K
 */
export function calibrateIrisScale(
    irises: IrisConfig[],
    targetCoverage: number,
    cornerRadius: number,
): number {
    if (irises.length === 0) return 0;
    if (targetCoverage <= 0) return 0;
    if (targetCoverage >= 1) return 2.0; // Full coverage

    let low = 0;
    let high = 2.0;
    const tolerance = 0.005; // 0.5% accuracy
    const maxIterations = 20;

    for (let i = 0; i < maxIterations; i++) {
        const mid = (low + high) / 2;
        const coverage = calculateEffectiveCoverage(irises, mid, cornerRadius);

        if (Math.abs(coverage - targetCoverage) < tolerance) {
            return mid;
        }

        if (coverage < targetCoverage) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return (low + high) / 2;
}

/**
 * Generate an optimized iris pattern that provides good coverage.
 * Positions irises to maximize efficiency within the rounded rect.
 *
 * @param numIrises - Number of irises to generate (default 3)
 * @param cornerRadius - Corner radius as fraction (0-0.5)
 * @returns Array of iris configurations
 */
export function generateOptimizedIrisPattern(
    numIrises: number = 3,
    cornerRadius: number = 0.0625,
): IrisConfig[] {
    const irises: IrisConfig[] = [];
    const minDistance = 0.3; // Minimum distance between iris centers
    const margin = cornerRadius + 0.1; // Keep centers away from rounded corners

    let attempts = 0;
    const maxAttempts = 100;

    while (irises.length < numIrises && attempts < maxAttempts) {
        // Generate candidate position avoiding edges
        const cx = margin + Math.random() * (1 - 2 * margin);
        const cy = margin + Math.random() * (1 - 2 * margin);

        // Check if position is valid (inside rounded rect and not too close to others)
        if (!isPointInRoundedRect(cx, cy, cornerRadius)) {
            attempts++;
            continue;
        }

        const isTooClose = irises.some((iris) => {
            const dx = iris.cx - cx;
            const dy = iris.cy - cy;
            return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });

        if (!isTooClose) {
            irises.push({
                cx,
                cy,
                weight: 0.8 + Math.random() * 0.4, // 0.8 - 1.2
                delay: irises.length * 0.15 + Math.random() * 0.1,
            });
        }

        attempts++;
    }

    // Fallback: if we couldn't place enough irises, use center
    while (irises.length < numIrises) {
        irises.push({
            cx: 0.5,
            cy: 0.5,
            weight: 1,
            delay: irises.length * 0.15,
        });
    }

    return irises;
}

/**
 * Get the corner radius as a fraction for a container with CSS --radius-container.
 * Assumes a 240px container with 16px (1rem) radius = 16/240 ≈ 0.0667
 */
export const DEFAULT_CORNER_RADIUS = 0.0667;
