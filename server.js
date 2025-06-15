/* eslint-disable @typescript-eslint/no-require-imports */
// Load environment variables
require("dotenv").config({ path: ".env.local" });

const express = require("express");
const cors = require("cors");
const { handler } = require("./local-lambda");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock API Gateway event converter
const convertToAPIGatewayEvent = (req) => {
  const { method, path, body, headers, query } = req;

  // Convert Express route to API Gateway route key format
  let routeKey; //
  const pathParameters = {}; //
  const idMatch = path.match(/\/(\d+)$/); //

  if (method === "GET" && path === "/api/books") {
    routeKey = "GET /books";
  } else if (method === "GET" && path.match(/^\/api\/books\/\d+$/)) {
    routeKey = "GET /books/{id}";
  } else if (method === "PUT" && path === "/api/books") {
    routeKey = "PUT /books";
  } else if (method === "DELETE" && path.match(/^\/api\/books\/\d+$/)) {
    routeKey = "DELETE /books/{id}";
  } else if (method === "POST" && path === "/api/register") {
    routeKey = "POST /register";
  } else if (method === "POST" && path === "/api/login") {
    routeKey = "POST /login";
  } else if (method === "POST" && path === "/api/login") {
    routeKey = "POST /login";
  } else if (method === "DELETE" && path === "/api/account") {
    routeKey = "DELETE /account";
  } else if (method === "GET" && path === "/api/my-books") {
    routeKey = "GET /my-books";
  }

  if (idMatch) {
    pathParameters.id = idMatch[1];
  }

  return {
    routeKey,
    pathParameters,
    queryStringParameters: query,
    headers,
    body: body ? JSON.stringify(body) : null,
  };
};

// Routes
app.all("/api/*", async (req, res) => {
  try {
    // Convert Express request to API Gateway event
    const event = convertToAPIGatewayEvent(req);

    if (!event.routeKey) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Call the lambda handler
    const result = await handler(event);

    // Send response
    res.status(result.statusCode);

    // Set headers if any
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
    }

    // Parse and send body
    const responseBody = result.body ? JSON.parse(result.body) : null;
    res.json(responseBody);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`📝 API endpoints:`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`   GET    http://localhost:${PORT}/api/books`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`   GET    http://localhost:${PORT}/api/books/{id}`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`   PUT    http://localhost:${PORT}/api/books`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`   DELETE http://localhost:${PORT}/api/books/{id}`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`   POST   http://localhost:${PORT}/api/register`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`   POST   http://localhost:${PORT}/api/login`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`   GET    http://localhost:${PORT}/api/my-books`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(`   DELETE http://localhost:${PORT}/api/account`);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log();
});

module.exports = app;
