import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/grad_logo.png"
            alt="App Logo"
            className={`rounded-md w-full h-full object-contain ${props.className ?? ''}`}
            {...props}
        />
    );
}
