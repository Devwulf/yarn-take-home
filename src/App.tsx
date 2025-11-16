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

function getCarouselLeft(index: number) {
    return `${-(getVideoWidth(true) + GAP) * index + FULL_SCREEN_PADDING}px`;
}

function App() {
    const videoRefs = useRef<Array<HTMLDivElement | null>>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const clickedRect = useRef<DOMRect | null>(null);
    const isAnimating = useRef(false);

    const [clickedIndex, setClickedIndex] = useState<number | null>(null);
    const isHorizontal = clickedIndex != null;

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
        videoDiv.style.height = `${getVideoWidth(isHorizontal) / ASPECT_RATIO}px}`;
    }

    // Need to integrate animateToFullScreen into this function, so that
    // width animation and position animation happen simultaneously
    function animateRotateVideo(index: number, clicked: number, isReverse = false) {
        return new Promise(resolve => {
            const videoDiv = videoRefs.current.at(index);
            const clickedVideoDiv = videoRefs.current.at(clicked);
            if (videoDiv == null || clickedVideoDiv == null) return;

            const clickedVideoRect = clickedRect.current ?? clickedVideoDiv.getBoundingClientRect();
            const indexOffset = index - clicked;

            const fromTheta = 0;
            const toTheta = degreesToRadians(90);
            const fromWidth = getVideoWidth();
            const toWidth = getVideoWidth(true);

            const fromCenterX = clickedVideoRect.left + clickedVideoRect.width / 2;
            const fromCenterY = clickedVideoRect.top + clickedVideoRect.height / 2;
            const toCenterX = window.innerWidth / 2;
            const toCenterY = window.innerHeight / 2;

            animate({
                from: 0,
                to: 1,
                duration: 500 + Math.abs(indexOffset) * 50,
                onUpdate(progress) {
                    const ease = easeInOut(progress);
                    const width = isReverse
                        ? lerp(toWidth, fromWidth, ease)
                        : lerp(fromWidth, toWidth, ease);
                    const height = width / ASPECT_RATIO;
                    videoDiv.style.width = `${width}px`;
                    videoDiv.style.height = `${height}px`;

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

                    const x = ovalHalfWidth * Math.sin(theta);
                    const y = ovalHalfHeight * Math.cos(theta);

                    videoDiv.style.top = `${y + centerY - height / 2}px`;
                    videoDiv.style.left = `${x + centerX - width / 2}px`;
                },
                onComplete() {
                    resolve();
                }
            });
        });
    }

    async function handleClickVideo(index: number) {
        if (isAnimating.current) return;

        isAnimating.current = true;

        const newClickedIndex = clickedIndex != null ? null : index;
        const isHorizontal = newClickedIndex != null;
        setClickedIndex(newClickedIndex);

        const clickedRef = videoRefs.current.at(index);
        if (clickedRef == null) return;
        if (isHorizontal) clickedRect.current = clickedRef.getBoundingClientRect();

        const containerDiv = containerRef.current;
        if (containerDiv == null) return;

        VIDEOS.forEach((_, i) => {
            animateRotateVideoStart(i);
        })

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

    function handleScrollX(isScrollLeft = false) {
        const containerDiv = containerRef.current;
        if (containerDiv == null || isAnimating.current) return;

        isAnimating.current = true;

        const index = clickedIndex ?? 0;
        const newIndex = isScrollLeft ? Math.max(0, index - 1) : Math.min(VIDEOS.length - 1, index + 1);
        const fromLeft = getCarouselLeft(index);
        const toLeft = getCarouselLeft(newIndex);
        animate({
            from: fromLeft,
            to: toLeft,
            duration: 500,
            onUpdate(value) {
                containerDiv.style.left = value;
            },
            onComplete() {
                setClickedIndex(newIndex);
                isAnimating.current = false;
            }
        });
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
