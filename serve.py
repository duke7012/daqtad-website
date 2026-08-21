#!/usr/bin/env python3
"""Preview the site locally with the same addresses Netlify serves.

    python3 serve.py            → http://localhost:8000

`python3 -m http.server` cannot do this on its own: /events/vol-6 is a rewrite,
not a file. This reads the real netlify.toml, so local and live cannot drift.
Nothing here runs in production — Netlify serves the site/ folder directly.
"""

import io
import pathlib
import sys
import tomllib
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlsplit

ROOT = pathlib.Path(__file__).parent
SITE = ROOT / "site"

RULES = tomllib.loads((ROOT / "netlify.toml").read_text(encoding="utf-8")).get("redirects", [])
FORCED = [r for r in RULES if r.get("force") and r["from"].startswith("/")]
REWRITES = [r for r in RULES if not r.get("force")]


def matches(pattern, path):
    if pattern.endswith("/*"):
        return path.startswith(pattern[:-1]), path[len(pattern) - 1:]
    return pattern == path, ""


def on_disk(path):
    rel = path.lstrip("/") or "index.html"
    for candidate in (SITE / rel, SITE / f"{rel}.html", SITE / rel / "index.html"):
        if candidate.is_file():
            return candidate
    return None


def redirect_for(path, query):
    """The Location header a forced 301 rule would send, if any."""
    for rule in FORCED:
        hit, splat = matches(rule["from"], path)
        if not hit or rule.get("status") not in (301, 302):
            continue
        wanted = rule.get("query") or {}
        if wanted:
            # e.g. /event.html?slug=vol-6  ->  /events/vol-6
            values = {k: parse_qs(query).get(k, [None])[0] for k in wanted}
            if any(v is None for v in values.values()):
                continue
            target = rule["to"]
            for key, placeholder in wanted.items():
                target = target.replace(placeholder, values[key])
            return target
        elif parse_qs(query) and ":" in rule["to"]:
            continue
        return rule["to"].replace(":splat", splat)
    return None


def resolve(path):
    for rule in FORCED:
        hit, _ = matches(rule["from"], path)
        if hit and rule.get("status") == 200:
            return on_disk(rule["to"])
    found = on_disk(path)
    if found:
        return found
    for rule in REWRITES:
        hit, _ = matches(rule["from"], path)
        if hit:
            return on_disk(rule["to"])
    return None


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        parts = urlsplit(self.path)
        path = parts.path

        location = redirect_for(path, parts.query)
        if location:
            self.send_response(301)
            self.send_header("Location", location)
            self.end_headers()
            return None

        target = resolve(path)
        if target is None:
            return self._body(SITE / "404.html", 404)
        return self._body(target, 200)

    def _body(self, file, status):
        try:
            data = file.read_bytes()
        except OSError:
            self.send_error(404)
            return None
        self.send_response(status)
        self.send_header("Content-Type", self.guess_type(str(file)))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        return io.BytesIO(data)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"DA'QTAD → http://localhost:{port}  (Ctrl+C to stop)")
    HTTPServer(("", port), partial(Handler, directory=str(SITE))).serve_forever()
