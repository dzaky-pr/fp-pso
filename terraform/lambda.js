import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tablename = process.env.TABLE_NAME || "books";

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

/* ──────────────────────────
   Lambda handler
────────────────────────── */
export const handler = async (event) => {
  const {
    routeKey,
    requestContext: { http },
  } = event;
  let body,
    statusCode = 200;

  try {
    if (routeKey === "ANY /books") {
      switch (http.method) {
        case "GET":
          body = await getAllBooks();
          break;
        case "PUT":
        case "POST":
          body = await putBook(JSON.parse(event.body));
          break;
        default:
          throw new Error(`Unsupported ${http.method} on /books`);
      }
    } else if (routeKey === "ANY /books/{id}") {
      const id = event.pathParameters.id;
      switch (http.method) {
        case "GET":
          body = await getBook(id);
          break;
        case "DELETE":
          body = await deleteBook(id);
          break;
        default:
          throw new Error(`Unsupported ${http.method} on /books/{id}`);
      }
    } else {
      throw new Error(`Unsupported route: ${routeKey}`);
    }
  } catch (e) {
    statusCode = 400;
    body = e.message;
  }
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
};
