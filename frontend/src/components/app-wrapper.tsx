import type React from "react";
import AsideBar from "./aside-bar";

interface AppWrapperProps {
    children: React.ReactNode;
}

export default function AppWrapper({children}: AppWrapperProps) {
    return (
        <div className="h-full">
            <AsideBar />
            <main className="lg:pl-10 h-full">{children}</main>
        </div>
    );
}