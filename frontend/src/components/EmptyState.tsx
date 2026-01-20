import Logo from "./logo";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";

interface EmptyStateProps {
    title?: string;
    desciption?: string;
}

export default function EmptyState({title = "No Chat Selected", desciption = "Pick a chat or start a new one..."}: EmptyStateProps) {
    return (
        <Empty
        className="w-full h-full flex-1 flex items-center justify-center bg-muted/20" >
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Logo showText={false} />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{desciption}</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}