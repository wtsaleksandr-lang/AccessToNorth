import { ROUTES, SITE_URL, canonicalUrl } from "./routeMetadata";

const KEY = "594c4ba0a45b102189a47cff194f3fd7";
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;

function requestedUrls(): string[] {
  const paths = process.argv.slice(2).filter((value) => value.startsWith("/"));
  if (paths.length > 0) return [...new Set(paths.map((path) => canonicalUrl(path)))];
  return ROUTES.filter((route) => route.sitemap !== false).map((route) => canonicalUrl(route.path));
}

export async function submitIndexNow(urlList = requestedUrls()): Promise<Response> {
  if (urlList.length === 0) throw new Error("No URLs were selected for IndexNow submission.");
  if (urlList.length > 10_000) throw new Error("IndexNow accepts at most 10,000 URLs per request.");

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`IndexNow returned ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return response;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const urlList = requestedUrls();
  submitIndexNow(urlList)
    .then((response) => console.log(`IndexNow accepted ${urlList.length} URLs (${response.status}).`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
