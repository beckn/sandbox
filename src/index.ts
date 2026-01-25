import { createApp } from "./app";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const app = await createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

main().catch(console.error);
