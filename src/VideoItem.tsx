import * as React from 'react';
import {JSX, useEffect, useRef} from "react";

type VideoItemProps = {
    src: string;
    isHorizontal: boolean;
    index: number;
    clickedIndex: number | null;
};
export default function VideoItem({
    src,
    isHorizontal,
    index,
    clickedIndex,
                                  }: VideoItemProps): JSX.Element | null {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    useEffect(() => {
        const video = videoRef.current;
        if (video == null) return;
        if (clickedIndex === index) {
            video.play();
        } else {
            video.pause();
            video.currentTime = 0;
        }
    }, [index, clickedIndex]);
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
            controls={isHorizontal}
            muted={!isHorizontal}
            onPointerEnter={() => {
                if (isHorizontal) return;
                const video = videoRef.current;
                if (video == null || !video.paused) return;
                video.play();
            }}
            onPointerLeave={() => {
                if (isHorizontal) return;
                const video = videoRef.current;
                if (video == null || video.paused) return;
                video.pause();
                video.currentTime = 0;
            }}
            onClick={(event) => {
                if (!isHorizontal) event.preventDefault();
            }}
        >
            <source src={src} type={'video/mp4'}/>
        </video>
    );
}
