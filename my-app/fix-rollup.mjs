import { execSync } from "child_process";

try {
  console.log("Installing Linux Rollup + esbuild binaries for Vercel...");
  execSync("npm install @rollup/rollup-linux-x64-gnu @esbuild/linux-x64 --force", {
    stdio: "inherit",
  });
} catch (err) {
  console.error("Failed installing Linux binaries:", err);
}
