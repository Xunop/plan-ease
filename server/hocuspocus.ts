import { Server } from "@hocuspocus/server";
import { SQLite } from "@hocuspocus/extension-sqlite";

const port = parseInt(process.env.HOCUSPOCUS_PORT || "1234", 10);
const host = process.env.HOCUSPOCUS_HOST || "0.0.0.0"
const db = process.env.DATABASE_FILE || "planease.db"

const hocuspocusServer = Server.configure({
  name: "hocuspocus-fra1-01",
  timeout: 30000,
  debounce: 5000,
  maxDebounce: 30000,
  quiet: true,
  address: host, // default to listen all host
  port: port,
  extensions: [
    new SQLite({
      database: db,
    }),
  ],
});

hocuspocusServer.listen(port, () => {
  console.log(`Hocuspocus server listening on ws://${hocuspocusServer.URL}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing Hocuspocus server");
  hocuspocusServer.destroy();
});
