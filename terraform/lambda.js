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

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tablename = process.env.TABLE_NAME || "books";
const usersTableName = process.env.USERS_TABLE_NAME || "users";
const JWT_SECRET =
  process.env.JWT_SECRET || "purnomovirgiawangusyantovalentino";

/* ──────────────────────────
   CRUD helper
────────────────────────── */
const getBook = async (id) => {
  const result = await dynamo.send(
    new GetCommand({ TableName: tablename, Key: { id: Number(id) } }),
  );
  return result.Item || { message: "not found" };
};

const getAllBooks = async () => {
  const result = await dynamo.send(new ScanCommand({ TableName: tablename }));
  return result.Items;
};

const putBook = async (book) => {
  await dynamo.send(
    new PutCommand({
      TableName: tablename,
      Item: {
        id: Number(book.id),
        price: book.price,
        author: book.author,
        description: book.description,
        title: book.title,
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

const getHealth = async () => {
  return { status: "ok" };
};

/* ──────────────────────────
   Auth helper functions
────────────────────────── */
const registerUser = async (email, password) => {
  const existingUser = await dynamo.send(
    new ScanCommand({
      TableName: usersTableName,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    }),
  );

  if (existingUser.Items && existingUser.Items.length > 0) {
    throw new Error("User with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10); // Hash password
  const userId = uuidv4();
  const now = Date.now();

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

  return { userId, email, message: "Registration Successful" };
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
    {
      expiresIn: "1h",
    },
  );

  return {
    userId: user.userId,
    email: user.email,
    token,
    message: "Login successful",
  };
};

/* ──────────────────────────
   Authentication Middleware
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
  /* ====== END TEST ERROR BLOCK === */

  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    switch (event.routeKey) {
      case "GET /books/{id}":
        body = await getBook(event.pathParameters.id);
        break;
      case "GET /books":
        body = await getAllBooks();
        break;
      case "PUT /books": {
        const user = authenticate(event);
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(`Authenticated user ${user.email} for PUT /books.`);
        const data = JSON.parse(event.body);
        body = await putBook(data);
        break;
      }
      case "DELETE /books/{id}": {
        const user = authenticate(event);
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(
          `Authenticated user ${user.email} for DELETE /books/${event.pathParameters.id}.`,
        );
        body = await deleteBook(event.pathParameters.id);
        break;
      }
      case "POST /register": {
        const { email, password } = JSON.parse(event.body);
        body = await registerUser(email, password);
        statusCode = 201;
        break;
      }
      case "POST /login": {
        const { email, password } = JSON.parse(event.body);
        body = await loginUser(email, password);
        break;
      }
      case "GET /health":
        body = await getHealth();
        break;
      default:
        throw new Error(`Unsupported route: ${event.routeKey}`);
    }
  } catch (error) {
    console.error("🔥 [ERROR]", error);
    if (
      error.message.includes("Invalid") ||
      error.message.includes("Expired") ||
      error.message.includes("malformed") ||
      error.message.includes("Authorization")
    ) {
      statusCode = 401; // Unauthorized
    } else if (
      error.message.includes("exists") ||
      error.message.includes("credentials")
    ) {
      statusCode = 400; // Bad Request
    } else {
      statusCode = 500; // Internal Server Error
    }
    body = { error: error.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers,
  };
};

module.exports = { handler };
