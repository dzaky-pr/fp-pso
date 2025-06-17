/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const JWT_SECRET = process.env.JWT_SECRET;

/* ──────────────────────────
   CRUD helper functions
────────────────────────── */
const getBook = async (dynamo, tablename, id) => {
  const result = await dynamo.send(
    new GetCommand({ TableName: tablename, Key: { id: Number(id) } }),
  );
  return result.Item || { message: "not found" };
};

const getAllBooks = async (dynamo, tablename, user) => {
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

const getMyBooks = async (dynamo, tablename, user) => {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: tablename,
      FilterExpression: "ownerId = :userId",
      ExpressionAttributeValues: {
        ":userId": user.userId,
      },
    }),
  );
  return result.Items;
};

const putBook = async (dynamo, tablename, book, user) => {
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

const deleteBook = async (dynamo, tablename, id) => {
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
const registerUser = async (dynamo, usersTableName, email, password) => {
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

  const passwordHash = await bcrypt.hash(password, 10);
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

  return { userId, email, message: "Registration successful" };
};

const loginUser = async (dynamo, usersTableName, email, password) => {
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

const deleteUserByEmail = async (dynamo, usersTableName, email) => {
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

module.exports = {
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
};
