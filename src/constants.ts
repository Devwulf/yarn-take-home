// Space (in px) around each video when it’s displayed near full screen.
// Gives the illusion of a full‑screen video while preserving subtle margins on
// either horizontal or vertical axis, depending on if the window is more landscape-y.
export const VIDEO_FULLSCREEN_PADDING_PX = 32; // 2rem

// Intrinsic width‑to‑height ratio maintained for all video frames.
export const VIDEO_ASPECT_RATIO = 16 / 9;

// Base width (in px) of a video tile in the default, vertical layout.
export const VIDEO_DEFAULT_WIDTH_PX = 320;

// Gap (in px) between adjacent videos in default layout.
export const VIDEO_GAP_DEFAULT_PX = 16; // 1rem

// Gap (in px) between adjacent videos in carousel layout.
export const VIDEO_GAP_CAROUSEL_PX = 24; // 1.5rem

// Base duration (in ms) of the rotation animation when transitioning from default to carousel layout.
export const VIDEO_ROTATE_DURATION_MS = 500;

// Duration (in ms) of the rotation animation when returning
// from the carousel (current) state back to the default layout.
// Slightly slower than the forward transition for a smoother settle.
export const VIDEO_ROTATE_BACK_DURATION_MS = 750;

// Duration (in ms) of the scroll animation when navigating between videos in carousel layout.
export const VIDEO_SCROLL_DURATION_MS = 500;

// If scroll position ratio exceeds this value (0–1), return immediately to the default state.
export const SCROLL_IMMEDIATE_RESET_THRESHOLD = 0.9;

// If scroll ratio passes this but below the immediate threshold, wait briefly before resetting.
export const SCROLL_DELAYED_RESET_THRESHOLD = 0.5;

// Delay (in ms) before returning to default state when the scroll lies between thresholds,
// or when the scroll doesn't reach either threshold (smooth cancellation).
export const SCROLL_RESET_DELAY_MS = 1000;

// Extra duration (in ms) added per video index to the duration of the rotation animation.
// Creates a cascading, staggered animation effect across videos.
export const VIDEO_STAGGER_DURATION_MS = 50;

// Velocity threshold (in px/ms or the same units as your gesture’s delta/time calculation)
// beyond which an upward swipe triggers an immediate reset to the default state.
export const SWIPE_UP_VELOCITY_THRESHOLD = 30;

// Multiplier applied to event.deltaY to fine‑tune perceived scroll speed.
export const SCROLL_DELTA_MULTIPLIER = 0.5;
