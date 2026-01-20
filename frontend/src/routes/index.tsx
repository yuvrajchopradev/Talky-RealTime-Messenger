import BaseLayout from "@/layouts/BaseLayout";
import { Route, Routes } from "react-router-dom";
import { authRoutesPaths, protectedRoutesPaths } from "./routes";
import AppLayout from "@/layouts/AppLayout";
import RouteGuard from "./RouteGuard";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Auth / Public Routes */}
            <Route path="/" element={<RouteGuard requireAuth={false} />}>
                <Route element={<BaseLayout />}>
                    {authRoutesPaths?.map(route => (
                        <Route key={route.path} path={route.path} element={route.element} />
                    ))}
                </Route>
            </Route>

            {/* Protected Routes */}
            <Route path="/" element={<RouteGuard requireAuth={true} />}>
                <Route element={<AppLayout />}>
                    {protectedRoutesPaths?.map(route => (
                        <Route key={route.path} path={route.path} element={route.element} />
                    ))}
                </Route>
            </Route>
        </Routes>
    );
}