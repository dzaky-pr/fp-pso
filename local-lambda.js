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
const JWT_SECRET =
  process.env.JWT_SECRET || "purnomovirgiawangusyantovalentino";

/* ──────────────────────────
   CRUD helper functions
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
  // Cari pengguna berdasarkan email menggunakan Global Secondary Index (GSI)
  const result = await dynamo.send(
    new QueryCommand({
      TableName: usersTableName,
      IndexName: "EmailIndex", // Pastikan nama GSI sesuai dengan yang didefinisikan di Terraform
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
      Limit: 1, // --- TAMBAHKAN INI UNTUK EFISIENSI ---
    }),
  );

  const user = result.Items && result.Items[0];

  if (!user) {
    throw new Error("Invalid credentials"); // Email tidak ditemukan
  }

  // Verifikasi password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials"); // Password salah
  }

  // Buat JSON Web Token (JWT)
  const token = jwt.sign(
    { userId: user.userId, email: user.email },
    JWT_SECRET,
    {
      expiresIn: "1h", // Token akan kedaluwarsa dalam 1 jam
    },
  );

  return {
    userId: user.userId,
    email: user.email,
    token,
    message: "Login successful",
  }; // --- PERBAIKI RETURN VALUE ---
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

    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(`Processing: ${path}`);

    switch (path) {
      case "GET /books":
        body = await getAllBooks();
        break;

      case "GET /books/{id}":
        body = await getBook(pathParameters.id);
        break;

      case "PUT /books": {
        const user = authenticate(event); // Verifikasi token. Jika gagal, akan throw error.
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(`Authenticated user ${user.email} for PUT /books.`);
        const bookData = JSON.parse(requestBody);
        body = await putBook(bookData);
        break;
      }

      case "DELETE /books/{id}": {
        const user = authenticate(event); // Verifikasi token. Jika gagal, akan throw error.
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(
          `Authenticated user ${user.email} for DELETE /books/${event.pathParameters.id}.`,
        );
        body = await deleteBook(pathParameters.id);
        break;
      }

      case "POST /register": {
        const { email, password } = JSON.parse(requestBody);
        body = await registerUser(email, password);
        statusCode = 201; // HTTP Status Code 201 Created
        break;
      }

      case "POST /login": {
        const { email, password } = JSON.parse(requestBody);
        body = await loginUser(email, password);
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
    statusCode =
      err.message.includes("exists") || err.message.includes("credentials")
        ? 400
        : 500;
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
