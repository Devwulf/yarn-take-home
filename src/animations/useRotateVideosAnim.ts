import {degreesToRadians, easeInOut, linear} from "popmotion";
import {animationDriver, getCarouselLeft, getVideoWidth, lerp, mapRangeClamped} from "../helpers.ts";
import {VIDEOS} from "../videos.ts";
import {useRef} from "react";
import {ASPECT_RATIO, DURATION, GAP} from "../constants.ts";
import type {AnimationOptions} from "../types.ts";

type UseRotateVideosAnimProps = {
    videoRefs: React.RefObject<Array<HTMLDivElement | null>>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    isAnimating: React.RefObject<boolean>;
}

export default function useRotateVideosAnim({
    videoRefs,
    containerRef,
    isAnimating,
}: UseRotateVideosAnimProps) {
    const videoRects = useRef<Array<DOMRect | null>>([]);

    function animateRotateVideoStart(index: number) {
        const videoDiv = videoRefs.current.at(index);
        if (videoDiv == null) return;

        const rect = videoDiv.getBoundingClientRect();
        console.log('>RECT', index, rect);

        videoDiv.style.position = 'fixed';
        videoDiv.style.top = `${rect.top}px`;
        videoDiv.style.left = `${rect.left}px`;
        videoDiv.style.width = `${rect.width}px`;
        videoDiv.style.height = `${rect.height}px`;
    }

    function animateRotateVideoEnd(index: number, isHorizontal = false) {
        const videoDiv = videoRefs.current.at(index);
        if (videoDiv == null) return;

        videoDiv.style.position = '';
        videoDiv.style.top = '';
        videoDiv.style.left = '';
        videoDiv.style.width = `${getVideoWidth(isHorizontal)}px`;
        videoDiv.style.height = `${getVideoWidth(isHorizontal) / ASPECT_RATIO}px}`;
    }

    function rotateVideoAnimationBuilder(index: number, clicked: number, isReverse = false): AnimationOptions<number> | undefined {
        const videoDiv = videoRefs.current.at(index);
        const clickedVideoDiv = videoRefs.current.at(clicked);
        if (videoDiv == null || clickedVideoDiv == null) return;

        const clickedRect = videoRects.current.at(clicked);
        if (clickedRect == null) return;

        const clickedVideoRect = clickedRect ?? clickedVideoDiv.getBoundingClientRect();
        const indexOffset = index - clicked;

        const fromTheta = 0;
        const toTheta = degreesToRadians(90);
        const fromWidth = getVideoWidth();
        const toWidth = getVideoWidth(true);

        const fromCenterX = clickedVideoRect.left + clickedVideoRect.width / 2;
        const fromCenterY = clickedVideoRect.top + clickedVideoRect.height / 2;
        const toCenterX = window.innerWidth / 2;
        const toCenterY = window.innerHeight / 2;
        return {
            duration: DURATION + Math.abs(indexOffset) * 50,
            onUpdate: (progress: number) => {
                const ease = easeInOut(progress);
                const width = isReverse
                    ? lerp(toWidth, fromWidth, ease)
                    : lerp(fromWidth, toWidth, ease);
                const height = width / ASPECT_RATIO;

                const centerX = isReverse
                    ? lerp(toCenterX, fromCenterX, ease)
                    : lerp(fromCenterX, toCenterX, ease);
                const centerY = isReverse
                    ? lerp(toCenterY, fromCenterY, ease)
                    : lerp(fromCenterY, toCenterY, ease);

                const theta = isReverse
                    ? lerp(toTheta, fromTheta, ease)
                    : lerp(fromTheta, toTheta, ease);

                const ovalHalfWidth = (width + GAP) * indexOffset;
                const ovalHalfHeight = (width / ASPECT_RATIO + GAP) * indexOffset;

                const ovalX = ovalHalfWidth * Math.sin(theta);
                const ovalY = ovalHalfHeight * Math.cos(theta);

                videoDiv.style.width = `${width}px`;
                videoDiv.style.height = `${height}px`;
                videoDiv.style.top = `${ovalY + centerY - height / 2}px`;
                videoDiv.style.left = `${ovalX + centerX - width / 2}px`;
            }
        }
    }

    function dragVideosAnimationBuilder(clicked: number | null): Partial<AnimationOptions<number>> {
        if (clicked == null) return {};

        const videoDivs = videoRefs.current.map((v => v)).filter(v => v != null) as HTMLDivElement[];
        const clickedVideoRect = videoRects.current.at(clicked) ?? videoDivs.at(clicked)?.getBoundingClientRect();
        if (clickedVideoRect == null) return {};

        const fromTheta = 0;
        const toTheta = degreesToRadians(90);
        const fromWidth = getVideoWidth();
        const toWidth = getVideoWidth(true);

        const fromCenterX = clickedVideoRect.left + clickedVideoRect.width / 2;
        const fromCenterY = clickedVideoRect.top + clickedVideoRect.height / 2;
        const toCenterX = window.innerWidth / 2;
        const toCenterY = window.innerHeight / 2;

        function onUpdateVideo(index: number, videoDiv: HTMLDivElement, progress: number, isReverse = true) {
            const ease = linear(progress);

            const rotateThreshold = 0.5;
            const isRotating = progress > rotateThreshold;
            const indexOffset = index - clicked;

            const width = isReverse
                ? lerp(toWidth, fromWidth, ease)
                : lerp(fromWidth, toWidth, ease);
            const height = width / ASPECT_RATIO;

            const centerX = isReverse
                ? lerp(toCenterX, fromCenterX, ease)
                : lerp(fromCenterX, toCenterX, ease);
            const centerY = isReverse
                ? lerp(toCenterY, fromCenterY, ease)
                : lerp(fromCenterY, toCenterY, ease);

            const mappedEase = mapRangeClamped(ease, rotateThreshold, 1, 0, 1)
            const theta = isRotating
                ? (isReverse ? lerp(toTheta, fromTheta, mappedEase) : lerp(fromTheta, toTheta, mappedEase))
                : isReverse ? toTheta : fromTheta;

            const ovalHalfWidth = (width + GAP) * indexOffset;
            const ovalHalfHeight = (width / ASPECT_RATIO + GAP) * indexOffset;

            const ovalX = ovalHalfWidth * Math.sin(theta);
            const ovalY = ovalHalfHeight * Math.cos(theta);

            videoDiv.style.width = `${width}px`;
            videoDiv.style.height = `${height}px`;
            videoDiv.style.top = `${ovalY + centerY - height / 2}px`;
            videoDiv.style.left = `${ovalX + centerX - width / 2}px`;
        }

        return {
            from: 0,
            to: 1,
            duration: 500,
            onStart: () => {
                VIDEOS.forEach((_, i) => {
                    animateRotateVideoStart(i);
                });
            },
            onUpdate(progress) {
                videoDivs.forEach((videoDiv, index) => {
                    onUpdateVideo(index, videoDiv, progress);
                });
            },
            onComplete() {

            }
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

        VIDEOS.forEach((_, i) => {
            animateRotateVideoStart(i);
        });

        containerDiv.style.display = 'block';

        const rotateActions = VIDEOS.map((_, i) => animateRotateVideo(i, index, newClickedIndex == null))
        await Promise.allSettled(rotateActions);

        containerDiv.style.display = 'flex';
        containerDiv.style.flexDirection = isHorizontal ? 'row' : 'column';
        containerDiv.style.left = isHorizontal ? getCarouselLeft(index) : '';

        VIDEOS.forEach((_, i) => {
            animateRotateVideoEnd(i, isHorizontal);
        });
        isAnimating.current = false;
    }

    return {
        rotateVideoAnimationBuilder,
        dragVideosAnimationBuilder,
        runRotateVideosAnimation
    };
}
