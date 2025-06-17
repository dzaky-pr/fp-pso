/**
 * CORS configuration for Lambda functions
 */

// Default CORS headers for local development
const getDefaultCorsHeaders = () => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
});

// Production CORS configuration with allowed origins
const getProductionCorsHeaders = (origin = "") => {
  const allowedOrigins = [
    "*", // Allow all origins in production
  ];

  const headers = {
    "Content-Type": "application/json",
  };

  if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
};

module.exports = {
  getDefaultCorsHeaders,
  getProductionCorsHeaders,
};
