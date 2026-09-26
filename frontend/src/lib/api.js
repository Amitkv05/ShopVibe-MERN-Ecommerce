export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
export class ApiError extends Error {
    status;
    data;
    constructor(message, status, data) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}
export async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    let body = options.body;
    if (body !== undefined && body !== null && !(body instanceof FormData) && typeof body !== "string") {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
        ...options,
        body,
        headers,
        credentials: "include",
        cache: "no-store",
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
        throw new ApiError(data?.message || `Request failed (${response.status})`, response.status, data);
    }
    return data;
}
export function apiMessage(error, fallback = "Something went wrong") {
    return error instanceof Error ? error.message : fallback;
}
