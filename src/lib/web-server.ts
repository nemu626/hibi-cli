/**
 * Hibi CLI - Web Server
 * Simple HTTP server using Bun.serve() for config UI
 */

import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import {
    browseFileHandler,
    getConfigHandler,
    saveGlobalConfigHandler,
    saveProjectConfigHandler,
} from "./config-api";

// ビルド済みSvelteアプリのパス
const WEB_DIST_DIR = join(import.meta.dirname, "../web/dist");

// MIME types
const MIME_TYPES: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
};

/**
 * 静的ファイルを配信
 */
function serveStaticFile(pathname: string): Response | null {
    // index.htmlへのフォールバック
    let filePath = join(WEB_DIST_DIR, pathname);

    if (pathname === "/" || pathname === "") {
        filePath = join(WEB_DIST_DIR, "index.html");
    }

    if (!existsSync(filePath)) {
        // SPA のルーティング対応: 存在しないパスは index.html を返す
        const indexPath = join(WEB_DIST_DIR, "index.html");
        if (existsSync(indexPath) && !pathname.startsWith("/api")) {
            filePath = indexPath;
        } else {
            return null;
        }
    }

    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const file = Bun.file(filePath);
    return new Response(file, {
        headers: { "Content-Type": contentType },
    });
}

/**
 * リクエストハンドラ
 */
async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // CORS headers for development
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight request
    if (method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // API routes
    if (pathname.startsWith("/api/")) {
        let response: Response;

        if (pathname === "/api/config" && method === "GET") {
            response = getConfigHandler();
        } else if (pathname === "/api/config/global" && method === "POST") {
            response = await saveGlobalConfigHandler(request);
        } else if (pathname === "/api/config/project" && method === "POST") {
            response = await saveProjectConfigHandler(request);
        } else if (pathname === "/api/browse-file" && method === "POST") {
            response = await browseFileHandler(request);
        } else {
            response = Response.json({ error: "Not Found" }, { status: 404 });
        }

        // Add CORS headers
        const newHeaders = new Headers(response.headers);
        for (const [key, value] of Object.entries(corsHeaders)) {
            newHeaders.set(key, value);
        }

        return new Response(response.body, {
            status: response.status,
            headers: newHeaders,
        });
    }

    // Static files
    const staticResponse = serveStaticFile(pathname);
    if (staticResponse) {
        return staticResponse;
    }

    return new Response("Not Found", { status: 404 });
}

/**
 * Webサーバーを起動
 */
export function startConfigServer(port: number): {
    server: ReturnType<typeof Bun.serve>;
    url: string;
} {
    const server = Bun.serve({
        port,
        fetch: handleRequest,
    });

    const url = `http://localhost:${server.port}`;

    return { server, url };
}
