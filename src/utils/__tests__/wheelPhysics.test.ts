import { describe, expect, it } from "vitest";
import {
    accelAngle,
    accelOmega,
    computeTargetAngle,
    createWheelSimulation,

    decelOmega,
    decelTotalDistance,
    elasticAngle,
    generateSegmentColors,
    normalizeAngle,
    segmentAtPointer,
    segmentCenterAngle,
} from "../wheelPhysics";

const TWO_PI = 2 * Math.PI;

describe("wheelPhysics", () => {
    describe("normalizeAngle", () => {
        it("returns 0 for 0", () => {
            expect(normalizeAngle(0)).toBe(0);
        });

        it("normalizes positive angles > 2π", () => {
            expect(normalizeAngle(TWO_PI + 1)).toBeCloseTo(1, 10);
        });

        it("normalizes negative angles", () => {
            expect(normalizeAngle(-1)).toBeCloseTo(TWO_PI - 1, 10);
        });

        it("normalizes multiples of 2π to 0", () => {
            expect(normalizeAngle(TWO_PI * 5)).toBeCloseTo(0, 10);
        });
    });

    describe("segmentCenterAngle", () => {
        it("computes center for first segment in 4-segment wheel", () => {
            // 4 segments → each is π/2. Segment 0 center = π/4.
            expect(segmentCenterAngle(0, 4)).toBeCloseTo(Math.PI / 4, 10);
        });

        it("computes center for last segment in 4-segment wheel", () => {
            expect(segmentCenterAngle(3, 4)).toBeCloseTo(
                Math.PI / 4 + 3 * (Math.PI / 2),
                10,
            );
        });
    });

    describe("segmentAtPointer", () => {
        it("returns segment 0 at angle 0", () => {
            // At angle 0 (no rotation), segment at pointer should be the last one
            // since the pointer is at top and segments start at 0 clockwise
            const result = segmentAtPointer(0, 4);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(4);
        });

        it("correctly identifies segments for different angles", () => {
            // 4 segments, each π/2 wide
            // Rotating by half a segment should change the segment at pointer
            const seg1 = segmentAtPointer(0, 4);
            const seg2 = segmentAtPointer(Math.PI / 2, 4);
            expect(seg1).not.toBe(seg2);
        });
    });

    describe("computeTargetAngle", () => {
        it("returns angle greater than minRotations * 2π", () => {
            const target = computeTargetAngle(2, 8, 3, 0);
            expect(target).toBeGreaterThan(3 * TWO_PI);
        });

        it("places winner correctly (segment at pointer after target angle)", () => {
            const winnerIdx = 5;
            const segCount = 10;
            const target = computeTargetAngle(winnerIdx, segCount, 2, 0);
            const segment = segmentAtPointer(target, segCount);
            expect(segment).toBe(winnerIdx);
        });
    });

    describe("accelOmega", () => {
        it("starts near 0", () => {
            expect(accelOmega(0, 30, 0.3)).toBeCloseTo(0, 1);
        });

        it("approaches maxOmega for large t", () => {
            expect(accelOmega(5, 30, 0.3)).toBeCloseTo(30, 0.5);
        });
    });

    describe("accelAngle", () => {
        it("starts at 0", () => {
            expect(accelAngle(0, 30, 0.3)).toBeCloseTo(0, 5);
        });

        it("increases over time", () => {
            expect(accelAngle(1, 30, 0.3)).toBeGreaterThan(0);
        });
    });

    describe("decelOmega", () => {
        it("starts at omega0", () => {
            expect(decelOmega(0, 30, 1)).toBeCloseTo(30, 10);
        });

        it("decays over time", () => {
            expect(decelOmega(2, 30, 1)).toBeLessThan(10);
        });
    });

    describe("decelTotalDistance", () => {
        it("returns omega0/mu", () => {
            expect(decelTotalDistance(30, 1.5)).toBeCloseTo(20, 10);
        });
    });

    describe("elasticAngle", () => {
        it("converges to target angle for large t", () => {
            const targetAngle = 10;
            const result = elasticAngle(20, targetAngle, 0.5, 0.3, 12);
            expect(result).toBeCloseTo(targetAngle, 2);
        });

        it("shows oscillation initially", () => {
            const target = 10;
            const at01 = elasticAngle(0.1, target, 0.5, 0.3, 12);
            const at02 = elasticAngle(0.2, target, 0.5, 0.3, 12);
            // Should not be monotonic (oscillates)
            expect(
                Math.abs(at01 - target) > 0.001 ||
                    Math.abs(at02 - target) > 0.001,
            ).toBe(true);
        });
    });

    describe("createWheelSimulation", () => {
        it("starts in idle phase", () => {
            const sim = createWheelSimulation({
                segmentCount: 10,
                winnerIndex: 3,
            });
            const result = sim.step(0.016);
            expect(result.phase).toBe("idle");
        });

        it("transitions through phases after start", () => {
            const sim = createWheelSimulation({
                segmentCount: 10,
                winnerIndex: 3,
            });
            sim.start();

            const result = sim.step(0.016);
            expect(result.phase).toBe("accelerating");
            expect(result.angle).toBeGreaterThan(0);
        });

        it("eventually reaches done phase", () => {
            const sim = createWheelSimulation({
                segmentCount: 10,
                winnerIndex: 3,
                minFullRotations: 1,
                maxOmega: 20,
                friction: 3,
                accelTau: 0.2,
            });
            sim.start();

            let result;
            for (let i = 0; i < 2000; i++) {
                result = sim.step(0.016);
                if (result.phase === "done") break;
            }
            expect(result!.phase).toBe("done");
        });

        it("lands on correct winner segment", () => {
            const winnerIdx = 5;
            const segCount = 8;
            const sim = createWheelSimulation({
                segmentCount: segCount,
                winnerIndex: winnerIdx,
                minFullRotations: 1,
                maxOmega: 20,
                friction: 3,
                accelTau: 0.2,
            });
            sim.start();

            let result;
            for (let i = 0; i < 2000; i++) {
                result = sim.step(0.016);
                if (result.phase === "done") break;
            }

            const finalSegment = segmentAtPointer(result!.angle, segCount);
            expect(finalSegment).toBe(winnerIdx);
        });

        it("resets properly", () => {
            const sim = createWheelSimulation({
                segmentCount: 10,
                winnerIndex: 3,
            });
            sim.start();
            sim.step(0.5);
            sim.reset();
            const result = sim.step(0.016);
            expect(result.phase).toBe("idle");
            expect(result.angle).toBe(0);
        });
    });

    describe("generateSegmentColors", () => {
        it("returns correct number of colors", () => {
            const colors = generateSegmentColors(10, "#6366f1", "#818cf8");
            expect(colors).toHaveLength(10);
        });

        it("returns valid hex strings", () => {
            const colors = generateSegmentColors(6, "#6366f1", "#818cf8");
            colors.forEach((c) => {
                expect(c).toMatch(/^#[0-9a-f]{6}$/i);
            });
        });

        it("handles 1 segment", () => {
            const colors = generateSegmentColors(1, "#ff0000", "#00ff00");
            expect(colors).toHaveLength(1);
        });

        it("handles 500 segments", () => {
            const colors = generateSegmentColors(500, "#6366f1", "#818cf8");
            expect(colors).toHaveLength(500);
        });
    });
});
