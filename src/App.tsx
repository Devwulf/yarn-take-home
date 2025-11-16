import './App.css';
import VideoItem from "./VideoItem.tsx";
import {VIDEOS} from "./videos.ts";
import {useRef, useState} from "react";
import {animate, degreesToRadians, easeInOut} from "popmotion";
import {lerp} from "./helpers.ts";

const FULL_SCREEN_PADDING = 32; // 2rem
const ASPECT_RATIO = 16 / 9;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = DEFAULT_WIDTH / ASPECT_RATIO;
const GAP = 16; // 1rem

function getVideoWidth(isHorizontal = false) {
    return isHorizontal ? window.innerWidth - FULL_SCREEN_PADDING * 2 : DEFAULT_WIDTH;
}

function App() {
    const videoRefs = useRef<Array<HTMLDivElement | null>>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [clickedIndex, setClickedIndex] = useState<number | null>(null);
    const isHorizontal = clickedIndex != null;

    function animateToFullScreen(index: number, isReverse = false) {
        const videoDiv = videoRefs.current.at(index);
        if (videoDiv == null) return;

        return new Promise(resolve => {
            const fromWidth = `${getVideoWidth()}px`;
            const toWidth = `${getVideoWidth(true)}px`;
            animate({
                from: isReverse ? toWidth : fromWidth,
                to: isReverse ? fromWidth : toWidth,
                onUpdate(currValue) {
                    videoDiv.style.width = currValue;
                },
                onComplete() {
                    resolve();
                }
            });
        })
    }

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

    function animateRotateVideoEnd(index: number, isHorizontal = false) {
        const videoDiv = videoRefs.current.at(index);
        if (videoDiv == null) return;

        videoDiv.style.position = '';
        videoDiv.style.top = '';
        videoDiv.style.left = '';
        videoDiv.style.width = `${getVideoWidth(isHorizontal)}px`;
        videoDiv.style.height = 'auto';
    }

    // Need to integrate animateToFullScreen into this function, so that
    // width animation and position animation happen simultaneously
    function animateRotateVideo(index: number, clicked: number, isReverse = false) {
        animateRotateVideoStart(index);
        if (index === clicked) return animateToFullScreen(index, isReverse);

        return new Promise(resolve => {
            const videoDiv = videoRefs.current.at(index);
            const clickedVideoDiv = videoRefs.current.at(clicked);
            if (videoDiv == null || clickedVideoDiv == null) return;

            const clickedVideoRect = clickedVideoDiv.getBoundingClientRect();

            const indexOffset = index - clicked;
            const ovalHalfWidth = (DEFAULT_WIDTH + GAP) * indexOffset;
            const ovalHalfHeight = (DEFAULT_HEIGHT + GAP) * indexOffset;

            const fromTheta = 0;
            const toTheta = degreesToRadians(90);
            const fromWidth = getVideoWidth();
            const toWidth = getVideoWidth(true);

            animate({
                from: 0,
                to: 1,
                duration: 500 + Math.abs(indexOffset) * 50,
                onUpdate(progress) {
                    const ease = easeInOut(progress);
                    const theta = isReverse
                        ? lerp(toTheta, fromTheta, ease)
                        : lerp(fromTheta, toTheta, ease);
                    const width = isReverse
                        ? lerp(toWidth, fromWidth, ease)
                        : lerp(fromWidth, toWidth, ease);

                    const x = ovalHalfWidth * Math.sin(theta);
                    const y = ovalHalfHeight * Math.cos(theta);
                    videoDiv.style.top = `${clickedVideoRect.top + y}px`;
                    videoDiv.style.left = `${clickedVideoRect.left + x + (width - fromWidth) * indexOffset}px`;
                    videoDiv.style.width = `${width}px`;
                },
                onComplete() {
                    resolve();
                }
            });
        });
    }

    async function handleClickVideo(index: number) {
        const newClickedIndex = clickedIndex != null ? null : index;
        const isHorizontal = newClickedIndex != null;
        setClickedIndex(newClickedIndex);

        const containerDiv = containerRef.current;
        if (containerDiv == null) return;
        containerDiv.style.display = 'flex';
        containerDiv.style.flexDirection = isHorizontal ? 'row' : 'column';

        const rotateActions = VIDEOS.map((_, i) => animateRotateVideo(i, index, newClickedIndex == null))
        await Promise.allSettled(rotateActions);

        /*VIDEOS.forEach((_, i) => {
            animateRotateVideoEnd(i, isHorizontal);
        });*/
    }
    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflowY: isHorizontal ? 'hidden' : 'auto',
                overflowX: 'hidden',
            }}
        >
            <div
                ref={containerRef}
                style={{
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
        </div>
    );
}

export default App
