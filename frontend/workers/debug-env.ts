import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET (HIDDEN)" : "NOT SET");
if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    console.log("Protocol:", url.protocol);
    console.log("Host:", url.host);
    console.log("User:", url.username);
    console.log("Pass:", url.password ? "SET" : "NOT SET");
}
