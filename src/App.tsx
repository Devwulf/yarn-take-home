import './App.css';
import VideoItem from "./VideoItem.tsx";
import {VIDEOS} from "./videos.ts";
import {useRef, useState} from "react";
import {animate} from "popmotion";
import {getCarouselLeft, getVideoWidth} from "./helpers.ts";
import {ASPECT_RATIO} from "./constants.ts";
import {useRotateVideosAnim, useScrollVideosAnim} from "./animations";

function App() {
    const videoRefs = useRef<Array<HTMLDivElement | null>>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isAnimating = useRef(false);

    const [clickedIndex, setClickedIndex] = useState<number | null>(null);
    const isHorizontal = clickedIndex != null;

    const {
        runRotateVideosAnimation
    } = useRotateVideosAnim({
        videoRefs,
        containerRef,
        isAnimating,
    });

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
                if (!isHorizontal || clickedIndex == null) return;
                event.preventDefault();

                const deltaY = event.deltaY;
                if (event.shiftKey) {
                    handleScrollX(deltaY < 0);
                } else {
                    handleClickVideo(clickedIndex);
                }
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
