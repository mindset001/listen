# Self-hosted fonts

Inter, Inter Tight, and JetBrains Mono — downloaded directly from Google
Fonts' CDN (`fonts.gstatic.com`) rather than loaded live via
`next/font/google`, which depends on that CDN being reachable at build
and dev-server-compile time. All three are variable fonts, so one
`.woff2` file per family covers its whole weight range.

All three ship under the [SIL Open Font License 1.1](https://openfontlicense.org/) — free to
self-host and redistribute.

To update to a newer version, re-fetch from the CSS2 API with a browser
User-Agent (a plain `curl` without one gets served TTF instead of woff2)
and take the `latin`-subset URL for each family:

```bash
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
```
