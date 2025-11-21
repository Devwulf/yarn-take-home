import {animate} from "popmotion";

export type AnimationOptions = (Parameters<typeof animate>[0]) & {
    onStart?: ()=> void;
};
