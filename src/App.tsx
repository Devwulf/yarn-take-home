import './App.css';
import VideoItem from "./VideoItem.tsx";
import {VIDEOS} from "./videos.ts";
import {useRef, useState} from "react";
import {animationDriver, clamp, getVideoWidth, mapRangeClamped} from "./helpers.ts";
import {
    SCROLL_DELAYED_RESET_THRESHOLD, SCROLL_DELTA_MULTIPLIER,
    SCROLL_IMMEDIATE_RESET_THRESHOLD,
    SCROLL_RESET_DELAY_MS,
    SWIPE_UP_VELOCITY_THRESHOLD,
    VIDEO_ASPECT_RATIO,
    VIDEO_ROTATE_BACK_DURATION_MS
} from "./constants.ts";
import {useRotateVideosAnim, useScrollVideosAnim} from "./animations";

// Needed to prevent gestures from triggering
window.addEventListener('wheel', event => {
    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    if (absX > absY) {
        event.preventDefault();
    }
}, { passive: false });

function App() {
    const videoRefs = useRef<Array<HTMLDivElement | null>>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const timeout = useRef<number | null>(null);
    const scrollingTimeout = useRef<number | null>(null);

    const isAnimating = useRef(false);
    const isTouching = useRef(false);
    const isScrolling = useRef(false);
    const shouldFinishImmediately = useRef(false);

    const defaultScrollYRef = useRef(0);
    const carouselScrollYRef = useRef(window.innerHeight / 2);

    const [clickedIndex, setClickedIndex] = useState<number | null>(null);
    const isHorizontal = clickedIndex != null;

    const {
        animateRotateVideosEnd,
        dragVideosAnimationBuilder,
        runRotateVideosAnimation
    } = useRotateVideosAnim({
        videoRefs,
        containerRef,
        defaultScrollYRef,
        isAnimating,
        shouldFinishImmediately,
    });
    const {
        onStart,
        onUpdate,
    } = dragVideosAnimationBuilder(clickedIndex)

    const {
        runScrollVideosAnimation,
    } = useScrollVideosAnim({
        containerRef,
        isAnimating,
        clickedIndex,
        setClickedIndex,
    });

    async function handleClickVideo(index: number) {
        if (isAnimating.current) return;
        isAnimating.current = true;

        const newClickedIndex = clickedIndex != null ? null : index;
        const isHorizontal = newClickedIndex != null;
        setClickedIndex(newClickedIndex);

        const parent = containerRef.current?.parentElement;
        if (parent) {
            defaultScrollYRef.current = parent.scrollTop;
        }

        await runRotateVideosAnimation(index, newClickedIndex, isHorizontal);
    }

    function handleScrollX(isScrollLeft = false) {
        if (isAnimating.current) return;
        runScrollVideosAnimation(isScrollLeft);
    }

    function handleWheel(event: React.WheelEvent) {
        if (!isHorizontal || clickedIndex == null || isAnimating.current || onStart == null || onUpdate == null) return;

        const velocityY = event.deltaY * SCROLL_DELTA_MULTIPLIER;
        if (event.shiftKey) {
            handleScrollX(velocityY < 0);
            return;
        }

        const absX = Math.abs(event.deltaX);
        const absY = Math.abs(event.deltaY);
        // Needed so the inertia when scrolling sideways on carousel doesn't trigger multiple scrolls
        if (absX > absY) {
            if (!isScrolling.current) {
                handleScrollX(event.deltaX < 0);
                isScrolling.current = true;
            }
            if (scrollingTimeout.current != null) clearTimeout(scrollingTimeout.current);
            scrollingTimeout.current = setTimeout(() => {
                isScrolling.current = false;
            }, 100);
            return;
        }

        const fromY = window.innerHeight / 2;
        const toY = 0;
        const newY = carouselScrollYRef.current - velocityY;
        const clampedY = clamp(newY, toY, fromY);

        carouselScrollYRef.current = clampedY;
        const progress = mapRangeClamped(clampedY, fromY, toY, 0, 1);

        if (!isTouching.current) {
            isTouching.current = true;
            onStart();
        }

        shouldFinishImmediately.current = Math.abs(velocityY) >= SWIPE_UP_VELOCITY_THRESHOLD || progress > SCROLL_IMMEDIATE_RESET_THRESHOLD;
        if (timeout.current != null) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
            isAnimating.current = true;
            const shouldFinish = progress > SCROLL_DELAYED_RESET_THRESHOLD || shouldFinishImmediately.current;
            animationDriver({
                from: progress,
                to: shouldFinish ? 1 : 0,
                duration: VIDEO_ROTATE_BACK_DURATION_MS,
                onUpdate,
                onComplete() {
                    if (shouldFinish) {
                        setClickedIndex(null);
                        animateRotateVideosEnd(0, false);
                    }
                    isAnimating.current = false;
                    carouselScrollYRef.current = window.innerHeight / 2;
                    isTouching.current = false;
                }
            });
        }, shouldFinishImmediately.current ? 0 : SCROLL_RESET_DELAY_MS);

        if (!isAnimating.current) onUpdate(progress);
    }

    return (
        <div
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: isHorizontal ? 'center' : 'start',
                overflowY: isHorizontal ? 'hidden' : 'auto',
                overflowX: 'hidden',
            }}
            onWheel={handleWheel}
        >
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    display: 'flex',
                    flexDirection: 'column',
                    width: 'fit-content',
                    height: 'fit-content',
                    gap: '1rem',
                }}
            >
                {VIDEOS.map((src, index) => (
                    <div
                        ref={el => videoRefs.current[index] = el}
                        style={{
                            width: `${getVideoWidth(isHorizontal)}px`,
                            height: `${getVideoWidth(isHorizontal) / VIDEO_ASPECT_RATIO}px`,
                            cursor: 'pointer',
                        }}
                        onClick={() => {
                            if (isHorizontal) return;
                            handleClickVideo(index);
                        }}
                    >
                        <VideoItem
                            key={`${index}`}
                            src={src}
                            isHorizontal={isHorizontal}
                            index={index}
                            clickedIndex={clickedIndex}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App
