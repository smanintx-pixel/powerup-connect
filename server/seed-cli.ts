import "dotenv/config";
import { seedDemoData } from "./seed";

// npm run seed  -> adds the demo access code and demo attendees if the database is empty.
seedDemoData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
