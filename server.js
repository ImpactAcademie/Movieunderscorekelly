const http = require("node:http");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const pagePath = path.join(__dirname, "index.html");
const port = Number(process.env.PORT) || 3000;

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;

  if (request.method === "POST" && pathname === "/code") {
    const contentType = request.headers["content-type"]?.split(";")[0];
    if (contentType !== "application/x-www-form-urlencoded") {
      response.writeHead(415, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Type de contenu non pris en charge");
      return;
    }

    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (Buffer.byteLength(body) > 8192) {
        response.writeHead(413, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Requête trop volumineuse");
        return;
      }
    }

    if (!new URLSearchParams(body).get("code")?.trim()) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Le code est obligatoire");
      return;
    }

    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Code reçu par le serveur.");
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD, POST" });
    response.end("Method Not Allowed");
    return;
  }

  if (pathname !== "/" && pathname !== "/index.html") {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Page introuvable");
    return;
  }

  try {
    const html = await readFile(pagePath);
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": html.length,
    });
    response.end(request.method === "HEAD" ? undefined : html);
  } catch (error) {
    console.error("Impossible de lire index.html :", error);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Erreur interne du serveur");
  }
});

server.listen(port, () => {
  console.log(`Serveur disponible sur http://localhost:${port}`);
});
