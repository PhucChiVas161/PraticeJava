import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "./api";

const DEFAULT_WS_URL = `${API_BASE_URL.replace(/\/api\/v1\/?$/, "")}/api/v1/ws`;

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS_URL;

export function createStompClient(onConnect: () => void) {
    const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect,
        debug: process.env.NODE_ENV === "production" ? undefined : (message: string) => console.log(message),
    });

    return client;
}

export function parseStompMessage<T>(message: IMessage): T | null {
    try {
        return JSON.parse(message.body) as T;
    } catch {
        return null;
    }
}
