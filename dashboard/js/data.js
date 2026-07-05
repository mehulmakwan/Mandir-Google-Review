export async function loadReviews() {
  const paths = [
    "/google_reviews.json",
    "/google_review.json",
    "../google_reviews.json",
    "../google_review.json",
    "./google_reviews.json",
    "./google_review.json",
  ];
  let lastError = null;

  for (const path of paths) {
    try {
      const response = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return {
        source: path,
        reviews: normalizeReviews(data),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Unable to load google_reviews.json. ${lastError?.message || ""}`);
}

export function normalizeReviews(data) {
  const rows = Array.isArray(data) ? data : Object.values(data || {}).flat();
  return rows
    .filter(Boolean)
    .map((row, index) => {
      const description = parseObject(row.description ?? row.review_text);
      const ownerResponses = parseObject(row.owner_responses);
      const subRatings = parseObject(row.sub_ratings);
      const text = Object.values(description)
        .filter(Boolean)
        .join(" ")
        .trim();
      const reviewDate = parseDate(row.review_date);
      const createdDate = parseDate(row.created_date);

      return {
        id: row.review_id || `review-${index}`,
        placeId: row.place_id || "",
        author: row.author || "Anonymous",
        rating: Number(row.rating || 0),
        text,
        description,
        ownerResponses,
        subRatings,
        likes: Number(row.likes || 0),
        profileUrl: row.author_profile_url || row.profile_url || "",
        reviewDate,
        createdDate,
        rawDate: row.raw_date || "",
        company: row.company || "",
        source: row.source || "Google Maps",
      };
    });
}

export function normalizeFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(normalizeReviews(JSON.parse(reader.result)));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}

function parseObject(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return { en: value };
  }
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
