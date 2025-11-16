import * as React from 'react';
import {JSX, useRef} from "react";

type VideoItemProps = {
    src: string;
};
export default function VideoItem({
    src,
                                  }: VideoItemProps): JSX.Element | null {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    return (
        <video
            ref={videoRef}
            disablePictureInPicture
            style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '16 / 9',
                border: '2px solid #333',
                borderRadius: '0.5rem',
            }}
            onPointerEnter={() => {
                const video = videoRef.current;
                if (video == null || !video.paused) return;
                video.play();
            }}
            onPointerLeave={() => {
                const video = videoRef.current;
                if (video == null || video.paused) return;
                video.pause();
                video.currentTime = 0;
            }}
        >
            <source src={src} type={'video/mp4'}/>
        </video>
    );
}
