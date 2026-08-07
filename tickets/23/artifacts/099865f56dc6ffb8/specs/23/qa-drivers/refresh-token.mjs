import fs from "fs";
import path from "path";

const authFile = path.resolve("tests/.auth/user.json");

async function refreshToken() {
  console.log("Token expired - refreshing...");
  
  const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const refreshTokenEntry = localStorage.find(
    (item) => item.name === "care_refresh_token"
  );
  
  if (!refreshTokenEntry) {
    throw new Error("No refresh token found");
  }

  const baseUrl = process.env.REACT_CARE_API_URL || "http://localhost:9000";
  
  const response = await fetch(`${baseUrl}/api/v1/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshTokenEntry.value }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.log(`Refresh failed with ${response.status}: ${text}`);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("✓ Token refreshed successfully");

  // Update storage state with new tokens
  const accessTokenIndex = localStorage.findIndex(
    (item) => item.name === "care_access_token"
  );
  if (accessTokenIndex >= 0) {
    localStorage[accessTokenIndex].value = data.access;
  }

  const refreshTokenIndex = localStorage.findIndex(
    (item) => item.name === "care_refresh_token"
  );
  if (refreshTokenIndex >= 0) {
    localStorage[refreshTokenIndex].value = data.refresh;
  }

  // Write back to file
  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
  console.log("✓ Updated auth file with new tokens");
}

refreshToken().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
