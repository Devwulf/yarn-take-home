import './App.css';
import VideoItem from "./VideoItem.tsx";
import {VIDEOS} from "./videos.ts";
import {useRef, useState} from "react";

const FULL_SCREEN_PADDING = 32; // 2rem
const DEFAULT_WIDTH = 320;

function App() {
    const videoRefs = useRef<Array<HTMLDivElement | null>>([]);
    const [clickedIndex, setClickedIndex] = useState<number | null>(null);

    function handleClickVideo(index: number) {
        const videoDiv = videoRefs.current.at(index);
        if (videoDiv == null) return;

        const newClickedIndex = clickedIndex != null ? null : index;
        videoDiv.style.width = newClickedIndex != null
            ? `${window.innerWidth - FULL_SCREEN_PADDING * 2}px`
            : `${DEFAULT_WIDTH}px`;

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
