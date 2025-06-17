/* eslint-disable @typescript-eslint/no-require-imports */
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
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
} = require("./lambda-utils");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tablename = process.env.TABLE_NAME || "books";
const usersTableName = process.env.USERS_TABLE_NAME || "users";

/* ──────────────────────────
   Lambda handler
────────────────────────── */
const handler = async (event) => {
  const forceError =
    event?.queryStringParameters?.forceError === "1" ||
    event?.headers?.["X-Force-Error"]?.toLowerCase?.() === "true" ||
    event?.headers?.["x-force-error"]?.toLowerCase?.() === "true";

  if (forceError) {
    console.error("🔥 Forced test error triggered");
    throw new Error("🔥 Forced error → should trip alarm");
  }

  let body;
  let statusCode = 200;

  try {
    let user = null;
    try {
      if (event.headers?.Authorization || event.headers?.authorization) {
        user = authenticate(event);
      }
    } catch (e) {
      void e; // Ignore authentication errors for public routes
    }

    switch (event.routeKey) {
      case "GET /books/{id}": {
        const bookData = await getBook(
          dynamo,
          tablename,
          event.pathParameters.id,
        );
        if (bookData.message === "not found") {
          body = bookData;
          statusCode = 404;
        } else if (
          bookData.isPrivate &&
          (!user || user.userId !== bookData.ownerId)
        ) {
          body = { message: "not found" };
          statusCode = 404;
        } else {
          body = bookData;
        }
        break;
      }
      case "GET /books":
        body = await getAllBooks(dynamo, tablename, user);
        break;

      case "GET /my-books": {
        if (!user) {
          throw new Error("Authentication required to access My Books.");
        }
        body = await getMyBooks(dynamo, tablename, user);
        break;
      }
      case "PUT /books": {
        const currentUser = authenticate(event);
        const data = JSON.parse(event.body);
        body = await putBook(dynamo, tablename, data, currentUser);
        break;
      }
      case "DELETE /books/{id}": {
        const currentUser = authenticate(event);
        const bookToDelete = await getBook(
          dynamo,
          tablename,
          event.pathParameters.id,
        );
        if (
          !bookToDelete.ownerId ||
          bookToDelete.ownerId !== currentUser.userId
        ) {
          statusCode = 403;
          throw new Error(
            "You are not the owner of this book and cannot delete it.",
          );
        }
        body = await deleteBook(dynamo, tablename, event.pathParameters.id);
        break;
      }
      case "POST /register": {
        const { email, password } = JSON.parse(event.body);
        body = await registerUser(dynamo, usersTableName, email, password);
        statusCode = 201;
        break;
      }
      case "POST /login": {
        const { email, password } = JSON.parse(event.body);
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
      case "OPTIONS /books":
      case "OPTIONS /books/{id}":
      case "OPTIONS /my-books":
      case "OPTIONS /login":
      case "OPTIONS /register":
      case "OPTIONS /account":
      case "OPTIONS /health":
        // Handle CORS preflight requests
        body = {};
        break;
      default:
        throw new Error(`Unsupported route: ${event.routeKey}`);
    }
  } catch (error) {
    console.error("🔥 [ERROR]", error);
    if (error.message.includes("not the owner")) {
      statusCode = 403;
    } else if (
      error.message.includes("Invalid") ||
      error.message.includes("Expired") ||
      error.message.includes("malformed") ||
      error.message.includes("Authorization") ||
      error.message.includes("Authentication required")
    ) {
      statusCode = 401;
    } else if (
      error.message.includes("exists") ||
      error.message.includes("credentials")
    ) {
      statusCode = 400;
    } else {
      statusCode = 500;
    }
    body = { error: error.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
  };
};

module.exports = { handler };
