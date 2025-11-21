import './App.css';
import VideoItem from "./VideoItem.tsx";
import {VIDEOS} from "./videos.ts";
import {useRef, useState} from "react";
import {animationDriver, clamp, getVideoWidth, mapRangeClamped} from "./helpers.ts";
import {ASPECT_RATIO} from "./constants.ts";
import {useRotateVideosAnim, useScrollVideosAnim} from "./animations";

function App() {
    const videoRefs = useRef<Array<HTMLDivElement | null>>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const trackerRef = useRef<HTMLDivElement | null>(null);
    const isAnimating = useRef(false);
    const timeout = useRef<number | null>(null);
    const isTouching = useRef(false);
    const scrollYRef = useRef(window.innerHeight / 2);

    const [clickedIndex, setClickedIndex] = useState<number | null>(null);
    const isHorizontal = clickedIndex != null;

    const {
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

                const trackerDiv = trackerRef.current;
                if (trackerDiv == null) return;

                const trackerRect = trackerDiv.getBoundingClientRect();
                const velocityY = event.deltaY;
                const fromY = window.innerHeight / 2;
                const toY = 0;
                const newY = scrollYRef.current - velocityY;
                const clampedY = clamp(newY, toY, fromY);

                trackerDiv.style.top = `${clampedY - trackerRect.height / 2}px`;
                scrollYRef.current = clampedY;
                const progress = mapRangeClamped(clampedY, fromY, toY, 0, 1);
                console.log('>TRACKPAD', velocityY, newY, progress);


                if (!isTouching.current) {
                    isTouching.current = true;
                    onStart();
                }

                if (timeout.current != null) clearTimeout(timeout.current);
                timeout.current = setTimeout(() => {
                    isAnimating.current = true;
                    animationDriver({
                        from: progress,
                        to: 0,
                        duration: 500,
                        onUpdate(progress) {
                            console.log('>PROGRESS2', progress);
                            onUpdate(progress);
                        },
                        onComplete() {
                            scrollYRef.current = window.innerHeight / 2;
                            isAnimating.current = false;
                            isTouching.current = false;
                        }
                    });
                }, 1000);

                if (!isAnimating.current) onUpdate(progress);

                /*if (event.shiftKey) {
                    handleScrollX(deltaY < 0);
                } else {
                    handleClickVideo(clickedIndex);
                }*/
            }}
            onPointerDown={() => {
                console.log('>POINTER DOWN');
            }}
            onMouseMove={() => {
                console.log('>MOUSE MOVE');
            }}
        >
            <div
                ref={trackerRef}
                style={{
                    position: 'fixed',
                    top: window.innerHeight / 2 - 10,
                    left: window.innerWidth / 2 - 10,
                    width: 20,
                    height: 20,
                    backgroundColor: 'red',
                }}
            >
            </div>
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
                            height: `${getVideoWidth(isHorizontal) / ASPECT_RATIO}px`,
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
