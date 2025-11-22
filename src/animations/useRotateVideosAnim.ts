import {degreesToRadians, easeInOut, linear} from "popmotion";
import {animationDriver, getCarouselLeft, getVideoWidth, lerp, mapRangeClamped} from "../helpers.ts";
import {VIDEOS} from "../videos.ts";
import {useRef} from "react";
import {
    SCROLL_DELAYED_RESET_THRESHOLD,
    VIDEO_ASPECT_RATIO,
    VIDEO_GAP_CAROUSEL_PX,
    VIDEO_GAP_DEFAULT_PX,
    VIDEO_ROTATE_BACK_DURATION_MS,
    VIDEO_ROTATE_DURATION_MS,
    VIDEO_STAGGER_DURATION_MS
} from "../constants.ts";
import type {AnimationOptions} from "../types.ts";

type UseRotateVideosAnimProps = {
    videoRefs: React.RefObject<Array<HTMLDivElement | null>>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    defaultScrollYRef: React.RefObject<number>;
    isAnimating: React.RefObject<boolean>;
}

export default function useRotateVideosAnim({
    videoRefs,
    containerRef,
    defaultScrollYRef,
    isAnimating,
}: UseRotateVideosAnimProps) {
    const videoRects = useRef<Array<DOMRect | null>>([]);

    function animateRotateVideoStart(index: number) {
        const videoDiv = videoRefs.current.at(index);
        if (videoDiv == null) return;

        const rect = videoDiv.getBoundingClientRect();

        videoDiv.style.position = 'fixed';
        videoDiv.style.top = `${rect.top}px`;
        videoDiv.style.left = `${rect.left}px`;
        videoDiv.style.width = `${rect.width}px`;
        videoDiv.style.height = `${rect.height}px`;
    }

    function animateRotateVideosStart() {
        VIDEOS.forEach((_, i) => {
            animateRotateVideoStart(i);
        });
    }

    function animateRotateVideoEnd(index: number, isHorizontal = false) {
        const videoDiv = videoRefs.current.at(index);
        if (videoDiv == null) return;

        videoDiv.style.position = '';
        videoDiv.style.top = '';
        videoDiv.style.left = '';
        videoDiv.style.width = `${getVideoWidth(isHorizontal)}px`;
        videoDiv.style.height = `${getVideoWidth(isHorizontal) / VIDEO_ASPECT_RATIO}px}`;
    }

    function animateRotateVideosEnd(index: number, isHorizontal = false) {
        const containerDiv = containerRef.current;
        if (containerDiv == null) return;

        containerDiv.style.display = 'flex';
        containerDiv.style.flexDirection = isHorizontal ? 'row' : 'column';
        containerDiv.style.left = isHorizontal ? getCarouselLeft(index) : '';

        VIDEOS.forEach((_, i) => {
            animateRotateVideoEnd(i, isHorizontal);
        });

        if (!isHorizontal) {
            const parent = containerDiv.parentElement;
            if (parent) {
                parent.style.overflowY = 'auto';
                parent.scrollTo({ top: defaultScrollYRef.current, behavior: 'instant' });
            }
        }
    }

    function rotateVideoAnimationBuilder(index: number, clicked: number, isReverse = false): AnimationOptions<number> | undefined {
        const videoDiv = videoRefs.current.at(index);
        const clickedVideoDiv = videoRefs.current.at(clicked);
        if (videoDiv == null || clickedVideoDiv == null) return;

        const clickedRect = videoRects.current.at(clicked);
        if (clickedRect == null) return;

        const clickedVideoRect = clickedRect ?? clickedVideoDiv.getBoundingClientRect();
        const indexOffset = index - clicked;
        const onUpdate = getOnUpdate({
            easingFn: easeInOut,
            indexOffset,
            clickedVideoRect,
            videoDiv,
            isReverse,
        });

        const DURATION = isReverse ? VIDEO_ROTATE_BACK_DURATION_MS : VIDEO_ROTATE_DURATION_MS;
        return {
            duration: DURATION + Math.abs(indexOffset) * VIDEO_STAGGER_DURATION_MS,
            onUpdate,
        }
    }

    function dragVideosAnimationBuilder(clicked: number | null): Partial<AnimationOptions<number>> {
        if (clicked == null) return {};

        const videoDivs = videoRefs.current.map((v => v)).filter(v => v != null) as HTMLDivElement[];
        const clickedVideoRect = videoRects.current.at(clicked) ?? videoDivs.at(clicked)?.getBoundingClientRect();
        if (clickedVideoRect == null) return {};

        const fromTheta = 0;
        const toTheta = degreesToRadians(90);

        const onUpdateFns = videoDivs.map((videoDiv, index) => {
            return getOnUpdate({
                easingFn: linear,
                indexOffset: index - clicked,
                clickedVideoRect,
                videoDiv,
                isReverse: true,
                processTheta(progress) {
                    const ease = linear(progress);
                    const isRotating = progress > SCROLL_DELAYED_RESET_THRESHOLD;
                    const mappedEase = mapRangeClamped(ease, SCROLL_DELAYED_RESET_THRESHOLD, 1, 0, 1)
                    return isRotating
                        ? lerp(toTheta, fromTheta, mappedEase)
                        : toTheta;
                }
            })
        });

        return {
            onStart: () => {
                animateRotateVideosStart();
            },
            onUpdate(progress) {
                onUpdateFns.forEach((onUpdate, index) => {
                    onUpdate(progress);
                });
            },
        }
    }

    function animateRotateVideo(index: number, clicked: number, isReverse = false) {
        const animationOptions = rotateVideoAnimationBuilder(index, clicked, isReverse);
        if (animationOptions == null) return;

        return animationDriver(animationOptions);
    }

    async function runRotateVideosAnimation(index: number, newClickedIndex: number | null, isHorizontal = false) {
        if (isHorizontal) {
            videoRects.current = videoRefs.current.map(videoDiv => {
                if (videoDiv == null) return null;
                return videoDiv.getBoundingClientRect();
            }).filter(rect => rect != null) as DOMRect[];
        }

        const containerDiv = containerRef.current;
        if (containerDiv == null) return;

        animateRotateVideosStart();
        containerDiv.style.display = 'block';

        const rotateActions = VIDEOS.map((_, i) => animateRotateVideo(i, index, newClickedIndex == null))
        await Promise.allSettled(rotateActions);

        animateRotateVideosEnd(index, isHorizontal);
        isAnimating.current = false;
    }

    return {
        animateRotateVideosEnd,
        dragVideosAnimationBuilder,
        runRotateVideosAnimation,
    };
}

type GetOnUpdateProps = {
    easingFn: (t: number) => number;
    indexOffset: number;
    clickedVideoRect: DOMRect;
    videoDiv: HTMLDivElement;

    isReverse?: boolean;
    processTheta?: (t: number) => number;
};
function getOnUpdate({
    easingFn,
    indexOffset,
    clickedVideoRect,
    videoDiv,
    isReverse = false,
    processTheta,
                     }: GetOnUpdateProps) {
    const fromTheta = 0;
    const toTheta = degreesToRadians(90);
    const fromWidth = getVideoWidth();
    const toWidth = getVideoWidth(true);

    const fromCenterX = clickedVideoRect.left + clickedVideoRect.width / 2;
    const fromCenterY = clickedVideoRect.top + clickedVideoRect.height / 2;
    const toCenterX = window.innerWidth / 2;
    const toCenterY = window.innerHeight / 2;

    const GAP = isReverse ? VIDEO_GAP_CAROUSEL_PX : VIDEO_GAP_DEFAULT_PX;

    return (progress: number) => {
        const ease = easingFn(progress);
        const width = isReverse
            ? lerp(toWidth, fromWidth, ease)
            : lerp(fromWidth, toWidth, ease);
        const height = width / VIDEO_ASPECT_RATIO;

        const centerX = isReverse
            ? lerp(toCenterX, fromCenterX, ease)
            : lerp(fromCenterX, toCenterX, ease);
        const centerY = isReverse
            ? lerp(toCenterY, fromCenterY, ease)
            : lerp(fromCenterY, toCenterY, ease);

        const theta = processTheta ? processTheta(progress) : (isReverse
            ? lerp(toTheta, fromTheta, ease)
            : lerp(fromTheta, toTheta, ease));

        const ovalHalfWidth = (width + GAP) * indexOffset;
        const ovalHalfHeight = (width / VIDEO_ASPECT_RATIO + GAP) * indexOffset;

        const ovalX = ovalHalfWidth * Math.sin(theta);
        const ovalY = ovalHalfHeight * Math.cos(theta);

        videoDiv.style.width = `${width}px`;
        videoDiv.style.height = `${height}px`;
        videoDiv.style.top = `${ovalY + centerY - height / 2}px`;
        videoDiv.style.left = `${ovalX + centerX - width / 2}px`;
    }
}
