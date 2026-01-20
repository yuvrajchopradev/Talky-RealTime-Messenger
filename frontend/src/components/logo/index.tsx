import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import logoSvg from "@/assets/react.svg";

interface LogoProps {
    url?: string;
    showText?: boolean;
    imgClass?: string;
    textClass?: string;
}

export default function Logo({ url = "/", showText = true, imgClass = "size-[30px]", textClass = "" }: LogoProps) {
    return (
        <Link to={url} className="flex items-center gap-2 w-fit">
            <img src={logoSvg} alt="Talky" className={cn(imgClass)} />
            {showText && (<span className={cn("font-semibold text-lg leading-tight", textClass)}>Talky</span>)}
        </Link>
    );
}