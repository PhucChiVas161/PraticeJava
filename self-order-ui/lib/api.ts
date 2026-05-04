const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

type QueryParams = Record<string, string | number | undefined | null>;

function buildQuery(params?: QueryParams): string {
    if (!params) {
        return "";
    }

    const entries = Object.entries(params).filter(([, value]) => (value === 0 ? true : Boolean(value)));

    if (entries.length === 0) {
        return "";
    }

    const searchParams = new URLSearchParams();
    for (const [key, value] of entries) {
        searchParams.set(key, String(value));
    }

    return `?${searchParams.toString()}`;
}

async function parseError(response: Response): Promise<string> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        const data = (await response.json()) as { message?: string };
        return data.message ?? "Request failed";
    }

    const text = await response.text();
    return text || "Request failed";
}

export async function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}${buildQuery(params)}`);

    if (!response.ok) {
        throw new Error(await parseError(response));
    }

    return (await response.json()) as T;
}

export async function apiPost<T, B>(path: string, body: B): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(await parseError(response));
    }

    return (await response.json()) as T;
}

export async function apiPut<T, B>(path: string, body: B): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "PUT",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(await parseError(response));
    }

    return (await response.json()) as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error(await parseError(response));
    }

    return (await response.json()) as T;
}
