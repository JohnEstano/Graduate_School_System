import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center">
            <div className="size-12 flex items-center justify-center rounded-md bg-white dark:bg-black">
                <AppLogoIcon />
            </div>
            <div className="ml-2 flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">Graduate School</span>
                <p className="text-[10px]">
                    University of the Immaculate Conception
                </p>
            </div>
        </div>
    );
}
