import {VIDEOS} from "../videos.ts";
import {animationDriver, getCarouselLeft} from "../helpers.ts";

type UseScrollVideosAnimProps = {
    containerRef: React.RefObject<HTMLDivElement | null>;
    isAnimating: React.RefObject<boolean>;
    clickedIndex: number | null;
    setClickedIndex: (index: number | null) => void;
}

export default function useScrollVideosAnim({
    containerRef,
    isAnimating,
    clickedIndex,
    setClickedIndex,
                                        }: UseScrollVideosAnimProps) {
    function scrollVideosAnimationBuilder(isScrollLeft = false) {
        const containerDiv = containerRef.current;
        if (containerDiv == null || isAnimating.current) return;

        isAnimating.current = true;

        const index = clickedIndex ?? 0;
        const newIndex = isScrollLeft ? Math.max(0, index - 1) : Math.min(VIDEOS.length - 1, index + 1);
        const fromLeft = getCarouselLeft(index);
        const toLeft = getCarouselLeft(newIndex);
        return {
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
        }
    }

    async function runScrollVideosAnimation(isScrollLeft = false) {
        const animationOptions = scrollVideosAnimationBuilder(isScrollLeft);
        if (animationOptions == null) return;
        await animationDriver(animationOptions)
    }

    return {
        scrollVideosAnimationBuilder,
        runScrollVideosAnimation,
    }
}
