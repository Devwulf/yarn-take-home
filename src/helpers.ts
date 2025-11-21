import {animate} from "popmotion";
import type {AnimationOptions} from "./types.ts";
import {DEFAULT_WIDTH, FULL_SCREEN_PADDING, GAP} from "./constants.ts";

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function reverseLerp(a: number, b: number, value: number): number {
    return (value - a) / (b - a);
}

export function mapRangeClamped(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number {
    const t = (value - inMin) / (inMax - inMin);
    const clamped = Math.min(Math.max(t, 0), 1);
    return outMin + clamped * (outMax - outMin);
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function getVideoWidth(isHorizontal = false) {
    return isHorizontal ? window.innerWidth - FULL_SCREEN_PADDING * 2 : DEFAULT_WIDTH;
}

export function getCarouselLeft(index: number) {
    return `${-(getVideoWidth(true) + GAP) * index + FULL_SCREEN_PADDING}px`;
}

export function animationDriver(options: AnimationOptions<number>) {
    return new Promise(resolve => {
        animate<number>({
            from: 0,
            to: 1,
            ...options,
            onComplete() {
                if (options.onComplete) options.onComplete();
                resolve();
            },
        });
    });
}
