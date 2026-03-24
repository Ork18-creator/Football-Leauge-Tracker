import { fetchAndStoreSnapshot, getWarmRequests } from "./_football-data-cache.js";

export const config = {
  schedule: "@hourly",
};

export async function handler() {
  const token =
    process.env.FOOTBALL_DATA_API_KEY ?? process.env.VITE_FOOTBALL_DATA_API_KEY ?? "";

  if (!token) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        error: "Missing football-data.org API key in Netlify environment variables.",
      }),
    };
  }

  const requests = getWarmRequests();
  const results = await Promise.allSettled(
    requests.map((request) =>
      fetchAndStoreSnapshot(request.path, request.queryStringParameters, token),
    ),
  );

  const summary = results.reduce(
    (accumulator, result, index) => {
      const request = requests[index];
      const label = `${request.path}${new URLSearchParams(request.queryStringParameters).toString() ? `?${new URLSearchParams(request.queryStringParameters).toString()}` : ""}`;

      if (result.status === "fulfilled" && result.value.statusCode >= 200 && result.value.statusCode < 300) {
        accumulator.success += 1;
      } else {
        accumulator.failed += 1;
        accumulator.failures.push(
          result.status === "fulfilled"
            ? { endpoint: label, statusCode: result.value.statusCode }
            : { endpoint: label, error: result.reason instanceof Error ? result.reason.message : "Unknown error" },
        );
      }

      return accumulator;
    },
    {
      success: 0,
      failed: 0,
      failures: [],
    },
  );

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      refreshedAt: new Date().toISOString(),
      ...summary,
    }),
  };
}
