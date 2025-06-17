/**
 * CORS configuration for Lambda functions
 */

// Default CORS headers for local development
export const getDefaultCorsHeaders = () => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
});

// Production CORS configuration with allowed origins
export const getProductionCorsHeaders = (origin = "") => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://54.254.229.194:3000", // staging server
    "http://54.169.147.138:3000", // production server
  ];

  const headers: Record<string, string> = {
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
