import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src="/grad_logo.png" alt="App Logo" className={`h-full w-full rounded-md object-contain ${props.className ?? ''}`} {...props} />;
}
