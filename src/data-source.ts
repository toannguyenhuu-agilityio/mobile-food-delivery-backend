import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.POSTGRES_PORT || 5432;
const host = process.env.POSTGRES_HOST || "db";
const user = process.env.POSTGRES_USER || "postgres";
const password = process.env.POSTGRES_PASSWORD;
const database = process.env.POSTGRES_DB || "FoodDeliveryDB";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: host,
  port: Number(port),
  username: user,
  password: password,
  database: database,
  entities: ["src/entities/*.ts"],
  logging: true,
  synchronize: true,
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "migrations",
});
