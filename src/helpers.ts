import {animate} from "popmotion";
import type {AnimationOptions} from "./types.ts";
import {VIDEO_DEFAULT_WIDTH_PX, VIDEO_FULLSCREEN_PADDING_PX, VIDEO_GAP_CAROUSEL_PX} from "./constants.ts";

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
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
    return isHorizontal ? window.innerWidth - VIDEO_FULLSCREEN_PADDING_PX * 2 : VIDEO_DEFAULT_WIDTH_PX;
}

export function getCarouselLeft(index: number) {
    return `${-(getVideoWidth(true) + VIDEO_GAP_CAROUSEL_PX) * index + VIDEO_FULLSCREEN_PADDING_PX}px`;
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
