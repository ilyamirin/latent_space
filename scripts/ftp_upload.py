"""
Upload the static gallery site to an FTP server.

Behavior:
- Reads FTP_HOST/FTP_USERNAME/FTP_PASSWORD and optional FTP_REMOTE_DIR from .env.
- Uploads root HTML/JS/CSS plus assets/ and modules/ (static site payload).
- Overwrites existing remote files when local copy is newer or has different size.
- Shows per-file progress.
- Retries the whole upload up to 3 times on errors.

CLI:
- --dry-run: print the files that would be uploaded without connecting.
- --check-connection: verify FTP login and exit without uploading.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from ftplib import FTP, error_perm
from pathlib import Path
from typing import Dict, Iterable, Iterator, Tuple


REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = REPO_ROOT / ".env"
RETRY_LIMIT = 3
SITE_DIRS = ("assets", "modules")
SITE_FILE_GLOBS = ("*.html", "*.js", "*.css")


def read_env(path: Path) -> Dict[str, str]:
    """Minimal .env parser (KEY=VALUE, ignores comments/empty lines)."""
    env: Dict[str, str] = {}
    if not path.exists():
        return env

    for line in path.read_text(encoding="utf-8").splitlines():
        striped = line.strip()
        if not striped or striped.startswith("#") or "=" not in striped:
            continue
        key, value = striped.split("=", 1)
        env[key] = value
    return env


def iter_files(base: Path) -> Iterator[Tuple[Path, Path]]:
    """Yield (local_path, relative_path) for all files in the deploy set."""
    seen: set[Path] = set()

    for pattern in SITE_FILE_GLOBS:
        for local_path in sorted(base.glob(pattern)):
            if local_path.is_file() and local_path not in seen:
                seen.add(local_path)
                yield local_path, local_path.relative_to(base)

    for folder in SITE_DIRS:
        root = base / folder
        if not root.exists():
            continue
        for local_path in sorted(root.rglob("*")):
            if local_path.is_file() and local_path not in seen:
                seen.add(local_path)
                yield local_path, local_path.relative_to(base)


def ensure_remote_dir(ftp: FTP, remote_root: Iterable[str], remote_parts: Iterable[str]) -> None:
    """Ensure nested remote directories exist and cwd into the target."""
    ftp.cwd("/")
    for part in list(remote_root) + list(remote_parts):
        if not part:
            continue
        try:
            ftp.mkd(part)
        except error_perm as exc:
            if not str(exc).startswith("550"):
                raise
        ftp.cwd(part)


def stor_with_progress(ftp: FTP, local_file: Path, remote_name: str) -> None:
    """Upload a single file with a simple byte counter."""
    size = local_file.stat().st_size
    sent = 0
    label = str(local_file.relative_to(REPO_ROOT))

    def _callback(chunk: bytes) -> None:
        nonlocal sent
        sent += len(chunk)
        percent = int((sent / size) * 100) if size else 100
        sys.stdout.write(f"\r  {label} {sent}/{size} bytes ({percent}%)")
        sys.stdout.flush()

    print(f"Uploading {label} ({size} bytes)...")
    with local_file.open("rb") as fh:
        ftp.storbinary(f"STOR {remote_name}", fh, blocksize=64 * 1024, callback=_callback)
    sys.stdout.write("\r")
    print(f"  Done {label}")


def get_remote_mtime(ftp: FTP, remote_name: str) -> float | None:
    """Return remote mtime (epoch seconds) if supported."""
    try:
        response = ftp.sendcmd(f"MDTM {remote_name}")
    except error_perm:
        return None

    parts = response.split()
    if len(parts) < 2:
        return None

    try:
        dt = datetime.strptime(parts[1], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
    except ValueError:
        return None
    return dt.timestamp()


def should_upload(ftp: FTP, local_file: Path, remote_name: str) -> bool:
    """
    Skip upload when remote file is the same size and not older than local.
    Falls back to size-only check if MDTM is unsupported.
    """
    try:
        remote_size = ftp.size(remote_name)
    except error_perm:
        return True

    if remote_size is None:
        return True

    local_size = local_file.stat().st_size
    if remote_size != local_size:
        return True

    remote_mtime = get_remote_mtime(ftp, remote_name)
    if remote_mtime is None:
        return False

    return remote_mtime < local_file.stat().st_mtime


def connect(host: str, user: str, password: str) -> FTP:
    ftp = FTP()
    ftp.connect(host, 21, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    return ftp


def resolve_config() -> tuple[str, str, str, list[str]]:
    env = read_env(ENV_PATH)
    host = env.get("FTP_HOST")
    user = env.get("FTP_USERNAME")
    password = env.get("FTP_PASSWORD")
    remote_root = [part for part in env.get("FTP_REMOTE_DIR", "").strip("/").split("/") if part]

    if not all([host, user, password]):
        raise SystemExit("Missing FTP_HOST/FTP_USERNAME/FTP_PASSWORD in .env")
    return host, user, password, remote_root


def collect_files() -> list[Tuple[Path, Path]]:
    files = list(iter_files(REPO_ROOT))
    if not files:
        raise SystemExit("No files to upload. Check SITE_DIRS and SITE_FILE_GLOBS.")
    return files


def dry_run(files: list[Tuple[Path, Path]], remote_root: list[str]) -> None:
    total_size = sum(path.stat().st_size for path, _ in files)
    print(f"Dry run: {len(files)} files, total {total_size} bytes")
    if remote_root:
        print(f"Remote root: /{'/'.join(remote_root)}")
    else:
        print("Remote root: /")
    for local_path, rel_path in files:
        print(f"- {rel_path} <- {local_path.stat().st_size} bytes")


def check_connection(host: str, user: str, password: str) -> None:
    ftp = connect(host, user, password)
    try:
        print(f"Connected to {host} as {user}")
        print(f"PWD: {ftp.pwd()}")
    finally:
        ftp.quit()


def upload_site() -> None:
    host, user, password, remote_root = resolve_config()
    files = collect_files()
    total_size = sum(path.stat().st_size for path, _ in files)
    print(f"Found {len(files)} files to upload, total {total_size} bytes")

    last_error: Exception | None = None
    for attempt in range(1, RETRY_LIMIT + 1):
        try:
            print(f"\nAttempt {attempt}/{RETRY_LIMIT}: connecting to {host} ...")
            ftp = connect(host, user, password)
            print("Connected. Starting upload...")
            for local_path, rel_path in files:
                ensure_remote_dir(ftp, remote_root, rel_path.parts[:-1])
                if should_upload(ftp, local_path, rel_path.name):
                    stor_with_progress(ftp, local_path, rel_path.name)
                else:
                    label = str(local_path.relative_to(REPO_ROOT))
                    print(f"Skipping {label} (up to date)")
            ftp.quit()
            print("Upload completed successfully.")
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            print(f"\nAttempt {attempt} failed: {exc}")
            if attempt < RETRY_LIMIT:
                print("Retrying...\n")

    raise SystemExit(f"Upload failed after {RETRY_LIMIT} attempts: {last_error}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload the static gallery site over FTP.")
    parser.add_argument("--dry-run", action="store_true", help="List deployable files without connecting.")
    parser.add_argument(
        "--check-connection",
        action="store_true",
        help="Verify FTP login and exit without uploading.",
    )
    args = parser.parse_args()

    host, user, password, remote_root = resolve_config()
    files = collect_files()

    if args.dry_run:
        dry_run(files, remote_root)
        return

    if args.check_connection:
        check_connection(host, user, password)
        return

    upload_site()


if __name__ == "__main__":
    main()
