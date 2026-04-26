/**
 * Windows: npm-тың PATH-тегі `bash` WSL-ге түсіп кетуін болдырмай, Git for Windows
 * `bash.exe`-ін нақты нұсқамен іске қосады. Linux/macOS: жүйелік `bash`.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const mobile = path.join(__dirname, "..");
const script = path.join(mobile, "scripts", "build-apk.sh");
const target = process.argv[2] || "release";
if (!["release", "debug", "aab"].includes(target)) {
  console.error("Usage: node scripts/build-apk-node.cjs [release|debug|aab]");
  process.exit(1);
}

const candidatesWin = [
  String.raw`C:\Program Files\Git\bin\bash.exe`,
  String.raw`C:\Program Files (x86)\Git\bin\bash.exe`,
];

function findBash() {
  if (process.platform !== "win32") {
    return { exe: "bash", args: [script, target] };
  }
  for (const p of candidatesWin) {
    if (fs.existsSync(p)) {
      return { exe: p, args: [script, target] };
    }
  }
  return { exe: "bash", args: [script, target] };
}

const { exe, args } = findBash();
if (process.platform === "win32" && exe === "bash") {
  console.error(
    "Git for Windows жоқ: https://git-scm.com/download/win (bash.exe қажет) " +
      "немесе WSL-де: wsl -e bash -lc \"cd /mnt/d/.../mobile && ./scripts/build-apk.sh release\""
  );
  process.exit(1);
}

const r = spawnSync(exe, args, {
  stdio: "inherit",
  cwd: mobile,
  env: process.env,
  shell: false,
});
process.exit(r.status === 0 || r.status === null ? 0 : r.status);
