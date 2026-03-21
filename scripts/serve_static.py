#!/usr/bin/env python3
from __future__ import annotations

import argparse
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheStaticHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        path = self.path.split("?", 1)[0]
        if path == "/" or path.endswith(".html") or path.endswith(".js"):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        else:
            self.send_header("Cache-Control", "public, max-age=604800, immutable")
        super().end_headers()

    def guess_type(self, path: str) -> str:
        if path.endswith(".webp"):
            return "image/webp"
        if path.endswith(".mp3"):
            return "audio/mpeg"
        return super().guess_type(path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Local static server for the gallery project.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--dir", default=".", help="Directory to serve.")
    args = parser.parse_args()

    root = Path(args.dir).resolve()
    handler = functools.partial(NoCacheStaticHandler, directory=str(root))
    server = ThreadingHTTPServer((args.host, args.port), handler)

    print(f"Serving {root} at http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
