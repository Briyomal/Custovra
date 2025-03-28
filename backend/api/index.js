import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});



// Export app instead of listening on a port
export default app;
