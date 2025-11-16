import './App.css';
import VideoItem from "./VideoItem.tsx";
import {VIDEOS} from "./videos.ts";
import {useRef, useState} from "react";
import {animate, degreesToRadians, easeInOut} from "popmotion";
import {lerp} from "./helpers.ts";

const FULL_SCREEN_PADDING = 32; // 2rem
const ASPECT_RATIO = 16 / 9;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 320 / ASPECT_RATIO;
const GAP = 16; // 1rem

function App() {
    const videoRefs = useRef<Array<HTMLDivElement | null>>([]);
    const [clickedIndex, setClickedIndex] = useState<number | null>(null);

    function animateToFullScreen(index: number, isReverse = false) {
        const videoDiv = videoRefs.current.at(index);
        if (videoDiv == null) return;

        const fromWidth = `${DEFAULT_WIDTH}px`;
        const toWidth = `${window.innerWidth - FULL_SCREEN_PADDING * 2}px`;
        animate({
            from: isReverse ? toWidth : fromWidth,
            to: isReverse ? fromWidth : toWidth,
            onUpdate(currValue) {
                videoDiv.style.width = currValue;
            }
        });
    }

    function setupVideo(index: number) {
        const videoDiv = videoRefs.current.at(index);
        if (videoDiv == null) return;

        const rect = videoDiv.getBoundingClientRect();

        videoDiv.style.position = 'fixed';
        videoDiv.style.top = `${rect.top}px`;
        videoDiv.style.left = `${rect.left}px`;
        videoDiv.style.width = `${rect.width}px`;
        videoDiv.style.height = `${rect.height}px`;
    }

    function animateRotateVideo(index: number, clicked: number, isReverse = false) {
        setupVideo(index);
        if (index === clicked) return;

        const videoDiv = videoRefs.current.at(index);
        const clickedVideoDiv = videoRefs.current.at(clicked);
        if (videoDiv == null || clickedVideoDiv == null) return;

        const clickedVideoRect = clickedVideoDiv.getBoundingClientRect();

        const indexOffset = clicked - index;
        const ovalHalfWidth = (DEFAULT_WIDTH + GAP) * -indexOffset;
        const ovalHalfHeight = (DEFAULT_HEIGHT + GAP) * -indexOffset;

        const fromTheta = 0;
        const toTheta = degreesToRadians(90);
        animate({
            from: 0,
            to: 1,
            duration: 500 + Math.abs(indexOffset) * 50,
            onUpdate(progress) {
                const ease = easeInOut(progress);
                const theta = isReverse
                    ? lerp(toTheta, fromTheta, ease)
                    : lerp(fromTheta, toTheta, ease);

                const x = ovalHalfWidth * Math.sin(theta);
                const y = ovalHalfHeight * Math.cos(theta);
                videoDiv.style.top = `${clickedVideoRect.top + y}px`
                videoDiv.style.left = `${clickedVideoRect.left + x}px`
            }
        });
    }

    function handleClickVideo(index: number) {
        const newClickedIndex = clickedIndex != null ? null : index;

        VIDEOS.forEach((_, i) => {
            animateRotateVideo(i, index, newClickedIndex == null);
        });
        setClickedIndex(newClickedIndex);
    }
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
            }}
        >
            {VIDEOS.map((src, index) => (
                <div
                    ref={el => videoRefs.current[index] = el}
                    style={{
                        width: `${DEFAULT_WIDTH}px`,
                        height: 'auto',
                        aspectRatio: '16 / 9',
                        cursor: 'pointer',
                    }}
                    onClick={() => {
                        handleClickVideo(index);
                    }}
                >
                    <VideoItem key={`${index}`} src={src}/>
                </div>
            ))}
        </div>
    );
}

export default App
