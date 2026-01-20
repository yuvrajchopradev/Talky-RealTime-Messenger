import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

interface RouteGuardProps {
    requireAuth?: boolean;
}

export default function RouteGuard({requireAuth}: RouteGuardProps) {
    const {user} = useAuth();

    if(requireAuth && !user) {
        return <Navigate to="/" replace />;
    }
    if(!requireAuth && user) {
        return <Navigate to="/chat" replace />;
    }

    return <Outlet />;
}