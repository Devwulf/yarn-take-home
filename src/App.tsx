import './App.css';
import VideoItem from "./VideoItem.tsx";
import {VIDEOS} from "./videos.ts";

function App() {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
            }}
        >
            {VIDEOS.map((src, index) => (
                <VideoItem key={`${index}`} src={src}/>
            ))}
        </div>
    );
}

export default App
