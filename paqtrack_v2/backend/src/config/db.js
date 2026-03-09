"use strict";
import mysql from "mysql2/promise";

export var pool = mysql.createPool({
  host:     process.env.DB_HOST     || "db",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME     || "paqtrack_db",
  waitForConnections: true,
  connectionLimit: 10
});
