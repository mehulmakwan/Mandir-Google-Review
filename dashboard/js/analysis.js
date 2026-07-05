const positiveWords = [
  "beautiful", "peaceful", "divine", "spiritual", "amazing", "excellent", "great",
  "good", "best", "clean", "calm", "serene", "wonderful", "nice", "lovely",
  "must visit", "blessed", "well maintained", "organized", "family", "awesome",
  "magnificent", "superb", "positive", "tranquil", "devotional", "jai swaminarayan",
  "mind blowing", "architecture", "neat", "hygienic", "pleasant", "memorable",
];

const negativeWords = [
  "bad", "poor", "dirty", "crowded", "crowd", "parking problem", "problem",
  "issue", "difficult", "rude", "wait", "waiting", "queue", "long queue",
  "not clean", "no parking", "traffic", "confusing", "expensive", "closed",
  "disappointed", "improve", "improvement", "lack", "shortage", "washroom",
  "toilet", "maintenance", "unsafe", "security", "not allowed", "negative",
];

const suggestionWords = [
  "should", "need", "needs", "please", "request", "suggest", "suggestion",
  "improve", "improvement", "better", "can be", "could", "must", "required",
  "arrange", "provide", "increase", "manage",
];

const urgentIssueRules = [
  {
    id: "shoe-theft",
    label: "Shoe theft / missing footwear",
    keywords: ["shoe", "shoes", "shoe thief", "shoe thieves", "footwear", "slipper", "slippery", "sandal"],
    positivePhrases: ["shoe rack", "shoe shop", "nice shoes", "good shoes"],
    negativePhrases: ["shoe theft", "shoe stolen", "shoes stolen", "missing footwear", "slipper stolen", "sandal stolen", "stolen shoes", "stolen sandal"],
  },
  {
    id: "theft-belongings",
    label: "Theft / missing belongings",
    keywords: ["stolen", "theft", "steal", "lost", "wallet", "bag", "purse", "belonging", "pickpocket", "locker", "missing"],
    positivePhrases: ["wallet friendly", "safe bag", "bag pack"],
    negativePhrases: ["stolen", "theft", "missing belongings", "missing wallet", "bag stolen", "wallet stolen", "pickpocket", "lost wallet", "lost bag"],
  },
  {
    id: "parking",
    label: "Parking problems",
    keywords: ["parking"],
    positivePhrases: ["ample parking", "ample parking space", "parking space available", "parking available", "plenty of parking", "easy parking", "spacious parking", "good parking", "convenient parking"],
    negativePhrases: ["no parking", "parking problem", "parking problems", "parking issue", "parking difficult", "difficult parking", "parking was difficult", "parking is bad", "parking bad", "not enough parking", "limited parking", "parking space unavailable", "parking space not available", "parking lot full", "parking full", "parking too crowded"],
  },
  {
    id: "crowd-queue",
    label: "Crowding / queue issues",
    keywords: ["crowd", "crowded", "queue", "waiting", "wait", "line"],
    positivePhrases: ["not crowded", "less crowded", "peaceful", "calm", "quick entry", "smooth entry"],
    negativePhrases: ["crowded", "too crowded", "overcrowded", "long queue", "long line", "waiting too long", "waited too long", "queue too long", "rush"],
  },
  {
    id: "cleanliness",
    label: "Cleanliness / washroom issues",
    keywords: ["dirty", "cleanliness", "washroom", "toilet", "bathroom", "smell"],
    positivePhrases: ["clean washroom", "clean toilet", "well maintained washroom", "hygienic", "clean and neat"],
    negativePhrases: ["dirty", "not clean", "unclean", "washroom dirty", "toilet dirty", "bathroom dirty", "bad smell", "smelly", "toilet not clean"],
  },
  {
    id: "security",
    label: "Security / safety concerns",
    keywords: ["unsafe", "security", "safe", "safety", "guard", "harassment", "risk"],
    positivePhrases: ["safe place", "secure place", "well secured", "felt safe"],
    negativePhrases: ["unsafe", "security issue", "safety issue", "harassment", "risk", "no security", "poor security", "unsafe area"],
  },
  {
    id: "accessibility",
    label: "Accessibility problems",
    keywords: ["stairs", "wheelchair", "elderly", "disabled", "lift", "access"],
    positivePhrases: ["easy access", "accessible", "wheelchair friendly", "elderly friendly"],
    negativePhrases: ["difficult access", "no lift", "stairs issue", "wheelchair issue", "disabled access", "elderly access", "inaccessible"],
  },
];

function matchesUrgentRule(text, rule) {
  const normalizedText = text.toLowerCase();
  if (!normalizedText.trim()) return false;
  if (rule.positivePhrases.some((phrase) => normalizedText.includes(phrase))) return false;
  if (rule.negativePhrases.some((phrase) => normalizedText.includes(phrase))) return true;
  return false;
}

function shouldFlagReviewAsUrgent(review, text) {
  const normalizedText = text.toLowerCase();
  if (!text.trim()) return false;

  const concern = deriveUrgentConcern(review);
  if (!concern) return false;

  const hasExplicitComplaint = containsAny(normalizedText, negativeWords) || containsAny(normalizedText, suggestionWords);
  const isClearlyNegative = review.sentiment === "Negative" || review.rating <= 2;
  return isClearlyNegative || hasExplicitComplaint;
}

function deriveUrgentConcern(review) {
  const text = (review.text || "").toLowerCase();
  const matched = urgentIssueRules.find((rule) => matchesUrgentRule(text, rule));
  if (!matched) return null;

  return {
    label: matched.label,
  };
}

export const categoryRules = [
  rule("Darshan Experience", ["darshan", "deity", "murti", "mandir visit", "visit temple"]),
  rule("Temple Cleanliness", ["clean", "cleanliness", "neat", "hygiene", "hygienic", "dirty"]),
  rule("Peaceful Atmosphere", ["peace", "peaceful", "calm", "serene", "tranquil", "quiet"]),
  rule("Spiritual Experience", ["spiritual", "divine", "blessed", "devotional", "prayer", "worship", "jai swaminarayan"]),
  rule("Staff & Volunteers (Sevaks)", ["staff", "volunteer", "sevak", "guide", "management", "cooperative", "helpful"]),
  rule("Crowd Management", ["crowd", "crowded", "rush", "busy", "too many people", "peak"]),
  rule("Parking Facilities", ["parking", "park", "vehicle", "car", "bike", "traffic"]),
  rule("Accessibility", ["wheelchair", "senior", "elderly", "disabled", "access", "stairs", "lift"]),
  rule("Temple Maintenance", ["maintenance", "maintained", "renovation", "repair", "facility"]),
  rule("Architecture & Beauty", ["architecture", "beautiful", "beauty", "design", "art", "carving", "marble", "magnificent"]),
  rule("Festivals & Events", ["festival", "event", "diwali", "janmashtami", "annakut", "celebration", "occasion"]),
  rule("Prasadam / Food", ["prasad", "prasadam", "food", "canteen", "meal", "snack"]),
  rule("Queue Management", ["queue", "line", "waiting", "wait", "entry", "token"]),
  rule("Washroom Facilities", ["washroom", "toilet", "restroom", "bathroom"]),
  rule("Signage & Navigation", ["sign", "signage", "direction", "navigation", "route", "find", "confusing"]),
  rule("Safety & Security", ["security", "safe", "safety", "guard", "checking"]),
  rule("Family-Friendly Experience", ["family", "children", "kids", "picnic", "parents"]),
  rule("General Appreciation", ["good", "great", "nice", "best", "excellent", "amazing", "awesome", "must visit"]),
  rule("Suggestions for Improvement", suggestionWords),
];

const recommendationRules = [
  rec("Parking Facilities", ["parking", "park", "vehicle", "traffic"], "Improve parking guidance and peak-hour vehicle flow with marked zones, volunteer support, and overflow parking communication."),
  rec("Queue Management", ["queue", "line", "waiting", "wait"], "Review queue design during busy hours, add clear entry flow, and assign sevaks to guide elderly visitors and families."),
  rec("Crowd Management", ["crowd", "crowded", "rush", "busy"], "Strengthen crowd planning for weekends and festivals with timed guidance, extra volunteers, and clear movement lanes."),
  rec("Temple Cleanliness", ["dirty", "not clean", "cleanliness", "hygiene"], "Increase cleaning checks in high-traffic areas and track cleanliness issues by location and time of day."),
  rec("Washroom Facilities", ["washroom", "toilet", "restroom", "bathroom"], "Audit washroom cleanliness, supplies, signage, and maintenance frequency, especially during peak visitor periods."),
  rec("Signage & Navigation", ["sign", "signage", "direction", "navigation", "confusing"], "Improve directional signage for darshan, parking, washrooms, prasadam, exits, and accessibility routes."),
  rec("Accessibility", ["wheelchair", "senior", "elderly", "disabled", "stairs", "lift"], "Enhance support for senior citizens and differently-abled visitors through accessible routes, seating, and volunteer assistance."),
  rec("Staff & Volunteers (Sevaks)", ["staff", "volunteer", "sevak", "rude", "help"], "Provide sevak briefing for visitor guidance, respectful communication, and handling high-pressure crowd situations."),
  rec("Temple Maintenance", ["maintenance", "repair", "facility", "broken"], "Create a recurring maintenance checklist for visitor-facing areas and resolve repeated facility issues quickly."),
];

export function enrichReviews(reviews) {
  return reviews.map((review) => {
    const sentiment = classifySentiment(review);
    const categories = classifyCategories(review.text);
    const recommendation = buildRecommendation(review, sentiment, categories);
    return { ...review, ...sentiment, categories, recommendation };
  });
}

export function summarize(reviews) {
  const total = reviews.length;
  const sentimentCounts = countBy(reviews, "sentiment");
  const avgRating = average(reviews.map((r) => r.rating).filter(Boolean));
  const score = total ? Math.round(((sentimentCounts.Positive || 0) - (sentimentCounts.Negative || 0)) * 100 / total) : 0;
  const categoryCounts = countCategories(reviews);
  const keywords = keywordFrequency(reviews, 24);
  const suggestions = suggestionFrequency(reviews, 12);
  const monthly = monthlyTrend(reviews);
  const ratingCounts = countRatings(reviews);
  const recommendations = reviews
    .filter((r) => r.recommendation)
    .sort((a, b) => severityRank(b.recommendation.severity) - severityRank(a.recommendation.severity));

  return {
    total,
    sentimentCounts,
    avgRating,
    score,
    categoryCounts,
    keywords,
    suggestions,
    monthly,
    ratingCounts,
    recommendations,
    categorySummary: buildCategorySummary(reviews),
    summaryText: buildExecutiveSummary(total, sentimentCounts, avgRating, score, categoryCounts, suggestions),
    urgentConcerns: buildUrgentConcerns(reviews, 5),
    positiveThemes: topThemes(reviews, "Positive", 10),
    improvementThemes: topImprovementThemes(recommendations, 10),
  };
}

export function applyFilters(reviews, filters) {
  return reviews.filter((review) => {
    if (filters.dateFrom && (!review.reviewDate || review.reviewDate < filters.dateFrom)) return false;
    if (filters.dateTo && (!review.reviewDate || review.reviewDate > filters.dateTo)) return false;
    if (filters.sentiment && review.sentiment !== filters.sentiment) return false;
    if (filters.rating && Math.round(review.rating) !== Number(filters.rating)) return false;
    if (filters.category && !review.categories.includes(filters.category)) return false;
    if (filters.month && monthKey(review.reviewDate) !== filters.month) return false;
    if (filters.keyword && !review.text.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
    if (filters.suggestionsOnly && !review.recommendation && !containsAny(review.text, suggestionWords)) return false;
    return true;
  });
}

export function availableMonths(reviews) {
  return [...new Set(reviews.map((r) => monthKey(r.reviewDate)).filter(Boolean))].sort().reverse();
}

function classifySentiment(review) {
  const text = review.text.toLowerCase();
  const positive = positiveWords.reduce((sum, word) => sum + occurrences(text, word), 0);
  const negative = negativeWords.reduce((sum, word) => sum + occurrences(text, word), 0);
  const ratingSignal = review.rating >= 4 ? 2 : review.rating <= 2 ? -2 : 0;
  const rawScore = positive - negative + ratingSignal;

  if (rawScore >= 2) return { sentiment: "Positive", sentimentScore: Math.min(100, 55 + rawScore * 10) };
  if (rawScore <= -1) return { sentiment: "Negative", sentimentScore: Math.max(-100, -45 + rawScore * 10) };
  return { sentiment: "Neutral", sentimentScore: 0 };
}

function classifyCategories(textValue) {
  const text = textValue.toLowerCase();
  const matches = categoryRules.filter((category) => containsAny(text, category.keywords)).map((category) => category.name);
  if (!matches.length) matches.push("General Appreciation");
  if (containsAny(text, suggestionWords) && !matches.includes("Suggestions for Improvement")) {
    matches.push("Suggestions for Improvement");
  }
  return [...new Set(matches)];
}

function buildRecommendation(review, sentiment, categories) {
  const text = review.text.toLowerCase();
  const hasSuggestion = containsAny(text, suggestionWords);
  const hasExplicitComplaint = containsAny(text, negativeWords) || hasSuggestion;
  const needsAttention = sentiment.sentiment === "Negative" || review.rating <= 2 || hasExplicitComplaint;
  if (!needsAttention) return null;

  const matched = recommendationRules.find((item) => containsAny(text, item.keywords));
  const category = matched?.category || categories.find((cat) => cat !== "General Appreciation") || "Suggestions for Improvement";
  const concern = extractConcern(review.text, category);
  const severity = review.rating <= 2 || sentiment.sentiment === "Negative" ? "High" : review.rating === 3 || hasSuggestion ? "Medium" : "Low";
  const action = matched?.action || "Review the feedback respectfully, identify the visitor journey step involved, and consider a practical improvement or clearer communication.";
  return { category, concern, severity, action };
}

function extractConcern(text, category) {
  if (!text) return category;
  const sentence = text.split(/[.!?।]+/).map((part) => part.trim()).find((part) => part.length > 8);
  return sentence ? sentence.slice(0, 180) : category;
}

function buildExecutiveSummary(total, sentiments, avgRating, score, categories, suggestions) {
  if (!total) return "No reviews match the current filters.";
  const positivePct = pct(sentiments.Positive || 0, total);
  const negativePct = pct(sentiments.Negative || 0, total);
  const topCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name).join(", ");
  const topSuggestion = suggestions[0]?.label || "no dominant improvement request";
  return `Across ${total.toLocaleString()} matching reviews, visitor perception is ${positivePct}% positive and ${negativePct}% negative, with an average Google rating of ${avgRating.toFixed(2)} and a sentiment score of ${score}. The most recurring experience themes are ${topCategories || "general appreciation"}. The leading improvement signal is ${topSuggestion}.`;
}

function buildCategorySummary(reviews) {
  const rows = new Map();
  for (const review of reviews) {
    for (const category of review.categories) {
      if (!rows.has(category)) {
        rows.set(category, { category, total: 0, Positive: 0, Neutral: 0, Negative: 0 });
      }
      const row = rows.get(category);
      row.total += 1;
      row[review.sentiment] += 1;
    }
  }
  return [...rows.values()].sort((a, b) => b.total - a.total);
}

function buildUrgentConcerns(reviews, limit) {
  const counts = {};
  const examples = {};

  for (const review of reviews) {
    const text = review.text || "";
    if (!text.trim()) continue;
    if (!shouldFlagReviewAsUrgent(review, text)) continue;

    const concern = deriveUrgentConcern(review);
    if (!concern) continue;

    const key = concern.label;
    counts[key] = (counts[key] || 0) + 1;
    if (!examples[key]) examples[key] = [];
    if (examples[key].length < 3) {
      examples[key].push({
        text,
        author: review.author || "Anonymous",
        rating: review.rating,
        date: review.reviewDate,
      });
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label,
      count,
      examples: examples[label] || [],
    }));
}

function topThemes(reviews, sentiment, limit) {
  const filtered = reviews.filter((review) => review.sentiment === sentiment);
  return Object.entries(countCategories(filtered))
    .filter(([name]) => name !== "Suggestions for Improvement")
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function topImprovementThemes(recommendations, limit) {
  const counts = {};
  for (const review of recommendations) {
    const category = review.recommendation.category;
    counts[category] = (counts[category] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, value]) => ({ label, value }));
}

function monthlyTrend(reviews) {
  const rows = {};
  for (const review of reviews) {
    const key = monthKey(review.reviewDate);
    if (!key) continue;
    rows[key] ||= { month: key, monthLabel: monthLabel(key), Positive: 0, Neutral: 0, Negative: 0, total: 0 };
    rows[key][review.sentiment] += 1;
    rows[key].total += 1;
  }
  return Object.values(rows).sort((a, b) => a.month.localeCompare(b.month));
}

function countRatings(reviews) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const rating = Math.round(review.rating);
    if (counts[rating] !== undefined) counts[rating] += 1;
  }
  return counts;
}

function countCategories(reviews) {
  const counts = {};
  for (const review of reviews) {
    for (const category of review.categories) {
      counts[category] = (counts[category] || 0) + 1;
    }
  }
  return counts;
}

function keywordFrequency(reviews, limit) {
  const stop = new Set("the and for with this that from have very temple mandir baps swaminarayan place visit visited there here good nice great pune google maps are was were has had you your our all but not one can its jai".split(" "));
  const counts = {};
  for (const review of reviews) {
    const words = review.text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !stop.has(word));
    for (const word of words) counts[word] = (counts[word] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, value]) => ({ label, value }));
}

function suggestionFrequency(reviews, limit) {
  const suggestions = reviews.filter((review) => review.recommendation);
  const counts = {};
  for (const review of suggestions) {
    const label = review.recommendation.category;
    counts[label] = (counts[label] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, value]) => ({ label, value }));
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {});
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function occurrences(text, needle) {
  return text.includes(needle) ? 1 : 0;
}

function containsAny(text, words) {
  const value = text.toLowerCase();
  return words.some((word) => value.includes(word));
}

function rule(name, keywords) {
  return { name, keywords };
}

function rec(category, keywords, action) {
  return { category, keywords, action };
}

function monthKey(date) {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(value) {
  if (!value) return "";
  const [year, month] = String(value).split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function pct(value, total) {
  return total ? Math.round(value * 1000 / total) / 10 : 0;
}

function severityRank(value) {
  return { Low: 1, Medium: 2, High: 3 }[value] || 0;
}

function shortText(text, max) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}
