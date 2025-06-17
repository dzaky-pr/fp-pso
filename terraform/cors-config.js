/**
 * CORS configuration for Lambda functions
 */

// Default CORS headers for local development
const getDefaultCorsHeaders = () => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
});

// Production CORS configuration with wildcard origins
const getProductionCorsHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  return headers;
};

module.exports = {
  getDefaultCorsHeaders,
  getProductionCorsHeaders,
};
