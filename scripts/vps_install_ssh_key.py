#!/usr/bin/env python3
"""Install local SSH public key on RAQAT VPS (one-time bootstrap)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko


def load_deploy_env(repo_root: Path) -> None:
    env_path = repo_root / ".env.deploy"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        val = val.strip().strip('"')
        os.environ.setdefault(key.strip(), val)


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    load_deploy_env(repo)

    host = os.environ.get("RAQAT_VPS_HOST", "5.75.162.140")
    user = os.environ.get("RAQAT_VPS_USER", "root")
    password = os.environ.get("RAQAT_VPS_SSH_PASSWORD", "")
    key_path = Path(
        os.environ.get("RAQAT_VPS_SSH_KEY", str(Path.home() / ".ssh" / "id_ed25519"))
    )
    pub_path = Path(str(key_path) + ".pub")

    if not password:
        print("RAQAT_VPS_SSH_PASSWORD missing in .env.deploy", file=sys.stderr)
        return 1
    if not pub_path.exists():
        print(f"Public key not found: {pub_path}", file=sys.stderr)
        return 1

    pubkey = pub_path.read_text(encoding="utf-8").strip()
    if not pubkey:
        print("Empty public key", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(
            host,
            username=user,
            password=password,
            timeout=20,
            allow_agent=False,
            look_for_keys=False,
        )
    except Exception as exc:
        print(f"SSH login failed: {exc}", file=sys.stderr)
        return 1

    marker = "# raqat-deploy"
    cmd = (
        "mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
        f"grep -qF '{pubkey.split()[1]}' ~/.ssh/authorized_keys 2>/dev/null || "
        f"echo '{pubkey} {marker}' >> ~/.ssh/authorized_keys && "
        "chmod 600 ~/.ssh/authorized_keys && "
        "echo key-installed"
    )
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    client.close()

    if "key-installed" not in out:
        print(f"Key install failed: {err or out}", file=sys.stderr)
        return 1

    print(f"OK: public key installed on {user}@{host}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
