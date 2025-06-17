/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultCorsHeaders } = require("./terraform/cors-config.js");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  getBook,
  getAllBooks,
  getMyBooks,
  putBook,
  deleteBook,
  getHealth,
  registerUser,
  loginUser,
  deleteUserByEmail,
  authenticate,
} = require("./shared/lambda-utils");

// Configure DynamoDB client for local development
const client = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
  },
});

const dynamo = DynamoDBDocumentClient.from(client);
const tablename = process.env.TABLE_NAME || "books";
const usersTableName = process.env.USERS_TABLE_NAME || "users";

/* ──────────────────────────
   Local Lambda handler (for testing)
────────────────────────── */
const handler = async (event) => {
  let body;
  let statusCode = 200;
  const headers = getDefaultCorsHeaders();

  try {
    const { httpMethod, pathParameters, body: requestBody } = event;
    const path = event.routeKey || `${httpMethod} ${event.path}`;
    let user = null;
    try {
      if (event.headers?.Authorization || event.headers?.authorization) {
        user = authenticate(event);
      }
    } catch (err) {
      void err; // Ignore authentication errors for public routes
    }

    switch (path) {
      case "GET /books":
        body = await getAllBooks(dynamo, tablename, user);
        break;

      case "GET /books/{id}":
        body = await getBook(dynamo, tablename, pathParameters.id);
        if (body.isPrivate && (!user || user.userId !== body.ownerId)) {
          body = { message: "not found" };
        }
        break;

      case "GET /my-books":
        if (!user) throw new Error("Authentication required");
        body = await getMyBooks(dynamo, tablename, user);
        break;

      case "PUT /books": {
        const currentUser = authenticate(event);
        const bookData = JSON.parse(requestBody);
        body = await putBook(dynamo, tablename, bookData, currentUser);
        break;
      }

      case "DELETE /books/{id}": {
        const currentUser = authenticate(event);
        const bookToDelete = await getBook(
          dynamo,
          tablename,
          pathParameters.id,
        );
        if (
          !bookToDelete.ownerId ||
          bookToDelete.ownerId !== currentUser.userId
        ) {
          statusCode = 403;
          throw new Error("You are not the owner of this book.");
        }
        body = await deleteBook(dynamo, tablename, pathParameters.id);
        break;
      }

      case "POST /register": {
        const { email, password } = JSON.parse(requestBody);
        body = await registerUser(dynamo, usersTableName, email, password);
        statusCode = 201;
        break;
      }

      case "POST /login": {
        const { email, password } = JSON.parse(requestBody);
        body = await loginUser(dynamo, usersTableName, email, password);
        break;
      }

      case "DELETE /account": {
        const { email } = JSON.parse(event.body);
        body = await deleteUserByEmail(dynamo, usersTableName, email);
        break;
      }

      case "GET /health":
        body = getHealth();
        break;

      default:
        statusCode = 404;
        body = { error: `Unsupported route: ${path}` };
    }
  } catch (err) {
    console.error("Error:", err);
    if (err.message.includes("not the owner")) {
      statusCode = 403;
    } else if (
      err.message.includes("Invalid") ||
      err.message.includes("Expired") ||
      err.message.includes("malformed") ||
      err.message.includes("Authorization") ||
      err.message.includes("Authentication required")
    ) {
      statusCode = 401;
    } else if (
      err.message.includes("exists") ||
      err.message.includes("credentials")
    ) {
      statusCode = 400;
    } else {
      statusCode = 500;
    }
    body = { error: err.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers,
  };
};

/* ──────────────────────────
   Helper functions for testing
────────────────────────── */
const testConnection = async () => {
  try {
    console.log("Testing DynamoDB connection...");
    const result = await dynamo.send(new ScanCommand({ TableName: tablename }));
    console.log("✅ Connection successful!");
    console.log(`Found ${result.Items.length} books in the table`);
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }
};

// Export functions for testing
module.exports = {
  handler,
  testConnection,
};

// If running directly, test connection
if (require.main === module) {
  testConnection();
}
