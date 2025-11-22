import './App.css';
import VideoItem from "./VideoItem.tsx";
import {VIDEOS} from "./videos.ts";
import {useRef, useState} from "react";
import {animationDriver, clamp, getVideoWidth, mapRangeClamped} from "./helpers.ts";
import {
    SCROLL_DELAYED_RESET_THRESHOLD,
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
    const isAnimating = useRef(false);
    const timeout = useRef<number | null>(null);
    const scrollingTimeout = useRef<number | null>(null);
    const isTouching = useRef(false);
    const isScrolling = useRef(false);
    const scrollYRef = useRef(window.innerHeight / 2);

    const [clickedIndex, setClickedIndex] = useState<number | null>(null);
    const isHorizontal = clickedIndex != null;

    const {
        animateRotateVideoEnd,
        dragVideosAnimationBuilder,
        runRotateVideosAnimation
    } = useRotateVideosAnim({
        videoRefs,
        containerRef,
        isAnimating,
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

        await runRotateVideosAnimation(index, newClickedIndex, isHorizontal);
    }

    function handleScrollX(isScrollLeft = false) {
        if (isAnimating.current) return;
        runScrollVideosAnimation(isScrollLeft);
    }

    return (
        <div
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflowY: isHorizontal ? 'hidden' : 'auto',
                overflowX: 'hidden',
            }}
            onWheel={(event) => {
                if (!isHorizontal || clickedIndex == null || onStart == null || onUpdate == null) return;

                const velocityY = event.deltaY;
                if (event.shiftKey) {
                    handleScrollX(velocityY < 0);
                    return;
                }

                const absX = Math.abs(event.deltaX);
                const absY = Math.abs(velocityY);
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
                const newY = scrollYRef.current - velocityY;
                const clampedY = clamp(newY, toY, fromY);

                scrollYRef.current = clampedY;
                const progress = mapRangeClamped(clampedY, fromY, toY, 0, 1);

                if (!isTouching.current) {
                    isTouching.current = true;
                    onStart();
                }

                const shouldFinish = Math.abs(velocityY) >= SWIPE_UP_VELOCITY_THRESHOLD || progress > SCROLL_IMMEDIATE_RESET_THRESHOLD;
                if (timeout.current != null) clearTimeout(timeout.current);
                timeout.current = setTimeout(() => {
                    isAnimating.current = true;
                    animationDriver({
                        from: progress,
                        to: progress > SCROLL_DELAYED_RESET_THRESHOLD || shouldFinish ? 1 : 0,
                        duration: VIDEO_ROTATE_BACK_DURATION_MS,
                        onUpdate,
                        onComplete() {
                            if (shouldFinish || progress > SCROLL_DELAYED_RESET_THRESHOLD) {
                                setClickedIndex(null);

                                const containerDiv = containerRef.current;
                                if (containerDiv == null) return;

                                containerDiv.style.display = 'flex';
                                containerDiv.style.flexDirection = 'column';
                                containerDiv.style.left = '';

                                VIDEOS.forEach((_, i) => {
                                    animateRotateVideoEnd(i, false);
                                });
                            }
                            isAnimating.current = false;
                            scrollYRef.current = window.innerHeight / 2;
                            isTouching.current = false;
                        }
                    });
                }, shouldFinish ? 0 : SCROLL_RESET_DELAY_MS);

                if (!isAnimating.current) onUpdate(progress);
            }}
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
