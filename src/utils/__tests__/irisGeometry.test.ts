import { describe, expect, it } from "vitest";
import {
    calculateEffectiveCoverage,
    calibrateIrisScale,
    DEFAULT_CORNER_RADIUS,
    generateOptimizedIrisPattern,
    IrisConfig,
    isPointCoveredByIrises,
    isPointInRoundedRect,
} from "../irisGeometry";

describe("irisGeometry", () => {
    describe("isPointInRoundedRect", () => {
        it("should return true for points in the center", () => {
            expect(isPointInRoundedRect(0.5, 0.5, 0.1)).toBe(true);
        });

        it("should return true for points on the edges (not corners)", () => {
            expect(isPointInRoundedRect(0.5, 0.01, 0.1)).toBe(true);
            expect(isPointInRoundedRect(0.99, 0.5, 0.1)).toBe(true);
        });

        it("should return false for points outside the bounding box", () => {
            expect(isPointInRoundedRect(1.1, 0.5, 0.1)).toBe(false);
            expect(isPointInRoundedRect(-0.1, 0.5, 0.1)).toBe(false);
        });

        it("should return false for points in the corner region outside the arc", () => {
            // Point at extreme top-left corner (outside the rounded corner arc)
            expect(isPointInRoundedRect(0.01, 0.01, 0.1)).toBe(false);
        });

        it("should return true for points inside the corner arc", () => {
            // Point just inside the top-left corner arc
            expect(isPointInRoundedRect(0.08, 0.08, 0.1)).toBe(true);
        });
    });

    describe("isPointCoveredByIrises", () => {
        const irises: IrisConfig[] = [
            { cx: 0.5, cy: 0.5, weight: 1, delay: 0 },
        ];

        it("should return true for points inside an iris", () => {
            expect(isPointCoveredByIrises(0.5, 0.5, irises, 0.2)).toBe(true);
            expect(isPointCoveredByIrises(0.55, 0.55, irises, 0.2)).toBe(true);
        });

        it("should return false for points outside all irises", () => {
            expect(isPointCoveredByIrises(0.1, 0.1, irises, 0.1)).toBe(false);
        });

        it("should handle multiple irises", () => {
            const multiIrises: IrisConfig[] = [
                { cx: 0.2, cy: 0.2, weight: 1, delay: 0 },
                { cx: 0.8, cy: 0.8, weight: 1, delay: 0 },
            ];
            expect(isPointCoveredByIrises(0.2, 0.2, multiIrises, 0.1)).toBe(
                true,
            );
            expect(isPointCoveredByIrises(0.8, 0.8, multiIrises, 0.1)).toBe(
                true,
            );
            expect(isPointCoveredByIrises(0.5, 0.5, multiIrises, 0.1)).toBe(
                false,
            );
        });
    });

    describe("calculateEffectiveCoverage", () => {
        it("should return 0 for empty irises array", () => {
            expect(calculateEffectiveCoverage([], 0.5, 0.1)).toBe(0);
        });

        it("should return 0 for zero scale", () => {
            const irises: IrisConfig[] = [{
                cx: 0.5,
                cy: 0.5,
                weight: 1,
                delay: 0,
            }];
            expect(calculateEffectiveCoverage(irises, 0, 0.1)).toBe(0);
        });

        it("should return higher coverage for larger scale", () => {
            const irises: IrisConfig[] = [{
                cx: 0.5,
                cy: 0.5,
                weight: 1,
                delay: 0,
            }];
            const smallCoverage = calculateEffectiveCoverage(irises, 0.1, 0.1);
            const largeCoverage = calculateEffectiveCoverage(irises, 0.5, 0.1);
            expect(largeCoverage).toBeGreaterThan(smallCoverage);
        });

        it("should approach 1.0 for very large scale", () => {
            const irises: IrisConfig[] = [{
                cx: 0.5,
                cy: 0.5,
                weight: 1,
                delay: 0,
            }];
            const coverage = calculateEffectiveCoverage(
                irises,
                2.0,
                DEFAULT_CORNER_RADIUS,
            );
            expect(coverage).toBeGreaterThan(0.95);
        });
    });

    describe("calibrateIrisScale", () => {
        const irises: IrisConfig[] = [
            { cx: 0.5, cy: 0.5, weight: 1, delay: 0 },
        ];

        it("should return 0 for empty irises", () => {
            expect(calibrateIrisScale([], 0.5, 0.1)).toBe(0);
        });

        it("should return 0 for zero target coverage", () => {
            expect(calibrateIrisScale(irises, 0, 0.1)).toBe(0);
        });

        it("should return 2.0 for full coverage", () => {
            expect(calibrateIrisScale(irises, 1, 0.1)).toBe(2.0);
        });

        it("should return scale that achieves approximately the target coverage", () => {
            const targetCoverage = 0.3;
            const scale = calibrateIrisScale(
                irises,
                targetCoverage,
                DEFAULT_CORNER_RADIUS,
            );
            const actualCoverage = calculateEffectiveCoverage(
                irises,
                scale,
                DEFAULT_CORNER_RADIUS,
            );

            // Should be within 5% of target (0.005 tolerance + some Monte Carlo variance)
            expect(Math.abs(actualCoverage - targetCoverage)).toBeLessThan(
                0.05,
            );
        });

        it("should work with multiple irises", () => {
            const multiIrises: IrisConfig[] = [
                { cx: 0.3, cy: 0.3, weight: 1, delay: 0 },
                { cx: 0.7, cy: 0.7, weight: 0.9, delay: 0 },
                { cx: 0.5, cy: 0.5, weight: 1.1, delay: 0 },
            ];
            const targetCoverage = 0.5;
            const scale = calibrateIrisScale(
                multiIrises,
                targetCoverage,
                DEFAULT_CORNER_RADIUS,
            );
            const actualCoverage = calculateEffectiveCoverage(
                multiIrises,
                scale,
                DEFAULT_CORNER_RADIUS,
            );

            expect(Math.abs(actualCoverage - targetCoverage)).toBeLessThan(0.1);
        });
    });

    describe("generateOptimizedIrisPattern", () => {
        it("should generate the requested number of irises", () => {
            const pattern = generateOptimizedIrisPattern(
                3,
                DEFAULT_CORNER_RADIUS,
            );
            expect(pattern).toHaveLength(3);
        });

        it("should generate irises with valid coordinates", () => {
            const pattern = generateOptimizedIrisPattern(
                3,
                DEFAULT_CORNER_RADIUS,
            );
            for (const iris of pattern) {
                expect(iris.cx).toBeGreaterThanOrEqual(0);
                expect(iris.cx).toBeLessThanOrEqual(1);
                expect(iris.cy).toBeGreaterThanOrEqual(0);
                expect(iris.cy).toBeLessThanOrEqual(1);
                expect(iris.weight).toBeGreaterThanOrEqual(0.8);
                expect(iris.weight).toBeLessThanOrEqual(1.2);
                expect(iris.delay).toBeGreaterThanOrEqual(0);
            }
        });

        it("should generate irises with sufficient spacing", () => {
            const pattern = generateOptimizedIrisPattern(
                3,
                DEFAULT_CORNER_RADIUS,
            );
            // Check that no two irises are too close
            for (let i = 0; i < pattern.length; i++) {
                for (let j = i + 1; j < pattern.length; j++) {
                    const dx = pattern[i].cx - pattern[j].cx;
                    const dy = pattern[i].cy - pattern[j].cy;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    // Either all irises are the fallback (0.5, 0.5) or properly spaced
                    expect(
                        distance >= 0.25 ||
                            (pattern[i].cx === 0.5 && pattern[i].cy === 0.5),
                    ).toBe(true);
                }
            }
        });
    });
});
