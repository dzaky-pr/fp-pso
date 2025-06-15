/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

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
const JWT_SECRET = process.env.JWT_SECRET;

/* ──────────────────────────
   CRUD helper functions
────────────────────────── */
const getBook = async (id) => {
  const result = await dynamo.send(
    new GetCommand({ TableName: tablename, Key: { id: Number(id) } }),
  );
  return result.Item || { message: "not found" };
};

const getAllBooks = async (user) => {
  const params = {
    TableName: tablename,
  };

  if (user && user.userId) {
    params.FilterExpression =
      "#isPrivate = :isPrivateFalse OR #ownerId = :userId";
    params.ExpressionAttributeNames = {
      "#isPrivate": "isPrivate",
      "#ownerId": "ownerId",
    };
    params.ExpressionAttributeValues = {
      ":isPrivateFalse": false,
      ":userId": user.userId,
    };
  } else {
    params.FilterExpression =
      "attribute_not_exists(isPrivate) OR #isPrivate = :isPrivateFalse";
    params.ExpressionAttributeNames = { "#isPrivate": "isPrivate" };
    params.ExpressionAttributeValues = { ":isPrivateFalse": false };
  }

  const result = await dynamo.send(new ScanCommand(params));
  return result.Items;
};

const getMyBooks = async (user) => {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: tablename,
      FilterExpression: "ownerId = :userId",
      ExpressionAttributeValues: { ":userId": user.userId },
    }),
  );
  return result.Items;
};

const putBook = async (book, user) => {
  await dynamo.send(
    new PutCommand({
      TableName: tablename,
      Item: {
        id: Number(book.id),
        price: book.price,
        author: book.author,
        description: book.description,
        title: book.title,
        isPrivate: book.isPrivate || false,
        ownerId: user.userId,
      },
    }),
  );
  return `PUT book ${book.id}`;
};

const deleteBook = async (id) => {
  await dynamo.send(
    new DeleteCommand({ TableName: tablename, Key: { id: Number(id) } }),
  );
  return `Deleted Book ${id}`;
};

/* ──────────────────────────
   Auth helper functions
────────────────────────── */
const registerUser = async (email, password) => {
  // Cek apakah email sudah terdaftar
  const existingUserResult = await dynamo.send(
    new ScanCommand({
      TableName: usersTableName,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    }),
  );

  if (existingUserResult.Items && existingUserResult.Items.length > 0) {
    throw new Error("User with this email already exists.");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10); // 10 adalah salt rounds
  const userId = uuidv4(); // Generate ID pengguna unik
  const now = Date.now(); // Timestamp saat ini

  // Simpan pengguna baru ke DynamoDB
  await dynamo.send(
    new PutCommand({
      TableName: usersTableName,
      Item: {
        userId,
        email,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    }),
  );

  return { userId, email, message: "Registration successful" }; // --- PERBAIKI RETURN VALUE ---
};

const loginUser = async (email, password) => {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: usersTableName,
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
      Limit: 1,
    }),
  );

  const user = result.Items && result.Items[0];

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.userId, email: user.email },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  return {
    userId: user.userId,
    email: user.email,
    token,
    message: "Login successful",
  };
};

const deleteUserByEmail = async (email) => {
  // Cari userId berdasarkan email
  const result = await dynamo.send(
    new QueryCommand({
      TableName: usersTableName,
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
      Limit: 1,
    }),
  );
  const user = result.Items && result.Items[0];
  if (!user) throw new Error("User not found");
  await dynamo.send(
    new DeleteCommand({
      TableName: usersTableName,
      Key: { userId: user.userId },
    }),
  );
  return { message: "Account deleted by email" };
};

/* ──────────────────────────
   Authentication Middleware (NEW)
────────────────────────── */
const authenticate = (event) => {
  const authHeader =
    event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error(
      "Authorization header missing or malformed (Expected: Bearer <token>).",
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (_err) {
    throw new Error("Invalid or expired authentication token.");
  }
};

/* ──────────────────────────
   Local Lambda handler (for testing)
────────────────────────── */
const handler = async (event) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const { httpMethod, pathParameters, body: requestBody } = event;
    const path = event.routeKey || `${httpMethod} ${event.path}`;
    let user = null;
    try {
      if (event.headers?.Authorization || event.headers?.authorization) {
        user = authenticate(event);
      }
    } catch (_err) {
      /* Biarkan saja */
    }

    switch (path) {
      case "GET /books":
        body = await getAllBooks(user);
        break;

      case "GET /books/{id}":
        body = await getBook(pathParameters.id);
        if (body.isPrivate && (!user || user.userId !== body.ownerId)) {
          body = { message: "not found" };
        }
        break;

      // RUTE BARU
      case "GET /my-books":
        if (!user) throw new Error("Authentication required");
        body = await getMyBooks(user);
        break;

      case "PUT /books": {
        const currentUser = authenticate(event);
        const bookData = JSON.parse(requestBody);
        body = await putBook(bookData, currentUser);
        break;
      }

      case "DELETE /books/{id}": {
        const currentUser = authenticate(event);
        const bookToDelete = await getBook(pathParameters.id);
        if (
          !bookToDelete.ownerId ||
          bookToDelete.ownerId !== currentUser.userId
        ) {
          statusCode = 403;
          throw new Error("You are not the owner of this book.");
        }
        body = await deleteBook(pathParameters.id);
        break;
      }

      case "POST /register": {
        const { email, password } = JSON.parse(requestBody);
        body = await registerUser(email, password);
        statusCode = 201;
        break;
      }

      case "POST /login": {
        const { email, password } = JSON.parse(requestBody);
        body = await loginUser(email, password);
        break;
      }

      case "DELETE /account": {
        const { email } = JSON.parse(event.body);
        body = await deleteUserByEmail(email);
        break;
      }

      case "GET /health":
        body = { status: "ok" };
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
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("Testing DynamoDB connection...");
    const result = await dynamo.send(new ScanCommand({ TableName: tablename }));
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("✅ Connection successful!");
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
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
  getBook,
  getAllBooks,
  putBook,
  deleteBook,
  testConnection,
};

// If running directly, test connection
if (require.main === module) {
  testConnection();
}
