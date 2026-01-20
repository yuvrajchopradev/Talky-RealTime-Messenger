import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import Chat from "@/pages/chat";
import SingleChat from "@/pages/chat/chatId";

export const AUTH_ROUTES = {
    SIGN_IN: '/',
    SIGN_UP: '/sign-up',
}

export const PROTECTED_ROUTES = {
    CHAT: '/chat',
    SINGLE_CHAT: '/chat/:chatId',
}

export const authRoutesPaths = [
    {
        path: AUTH_ROUTES.SIGN_IN,
        element: <SignIn />
    },
    {
        path: AUTH_ROUTES.SIGN_UP,
        element: <SignUp />
    },
];

export const protectedRoutesPaths = [
    {
        path: PROTECTED_ROUTES.CHAT,
        element: <Chat />
    },
    {
        path: PROTECTED_ROUTES.SINGLE_CHAT,
        element: <SingleChat />
    },
];

export const isAuthRoute = (path: string) => {
    return Object.values(AUTH_ROUTES).includes(path);
}