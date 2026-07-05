import { loadReviews } from "./data.js?v=202607041300";
import { applyFilters, availableMonths, categoryRules, enrichReviews, summarize } from "./analysis.js?v=202607041300";
import { drawBars, drawDonut, drawRatingBars, drawStackedTrend, sentimentRows } from "./charts.js?v=202607041300";

const state = {
  allReviews: [],
  source: "",
};

const els = {
  datasetStatus: qs("#datasetStatus"),
  lastReviewDate: qs("#lastReviewDate"),
  filteredCount: qs("#filteredCount"),
  reloadData: qs("#reloadData"),
  dateFrom: qs("#dateFrom"),
  dateTo: qs("#dateTo"),
  sentimentFilter: qs("#sentimentFilter"),
  ratingFilter: qs("#ratingFilter"),
  categoryFilter: qs("#categoryFilter"),
  monthFilter: qs("#monthFilter"),
  keywordFilter: qs("#keywordFilter"),
  suggestionsOnly: qs("#suggestionsOnly"),
  kpiTotal: qs("#kpiTotal"),
  kpiPositive: qs("#kpiPositive"),
  kpiNeutral: qs("#kpiNeutral"),
  kpiNegative: qs("#kpiNegative"),
  kpiScore: qs("#kpiScore"),
  kpiRating: qs("#kpiRating"),
  summaryText: qs("#summaryText"),
  positiveThemes: qs("#positiveThemes"),
  improvementThemes: qs("#improvementThemes"),
  urgentConcerns: qs("#urgentConcerns"),
  urgentCount: qs("#urgentCount"),
  reviewModal: qs("#reviewModal"),
  reviewModalTitle: qs("#reviewModalTitle"),
  reviewModalBody: qs("#reviewModalBody"),
  closeReviewModal: qs("#closeReviewModal"),
  latestReviews: qs("#latestReviews"),
  attentionReviews: qs("#attentionReviews"),
  categorySummary: qs("#categorySummary"),
  homeTab: qs("#homeTab"),
  actionsTab: qs("#actionsTab"),
  latestTab: qs("#latestTab"),
  attentionTab: qs("#attentionTab"),
  categoryTab: qs("#categoryTab"),
  tabButtons: qsAll(".tab-button"),
  latestCount: qs("#latestCount"),
  attentionCount: qs("#attentionCount"),
};

const charts = {
  sentiment: qs("#sentimentChart"),
  trend: qs("#trendChart"),
  rating: qs("#ratingChart"),
  category: qs("#categoryChart"),
  keyword: qs("#keywordChart"),
  suggestion: qs("#suggestionChart"),
};

init();

async function init() {
  populateCategories();
  bindEvents();
  setActiveTab("home");
  await refreshFromJson();
}

async function refreshFromJson() {
  try {
    els.datasetStatus.textContent = "Loading latest scraper export...";
    const result = await loadReviews();
    setReviews(result.reviews, `Loaded ${result.reviews.length.toLocaleString()} reviews from ${result.source}`);
  } catch (error) {
    els.datasetStatus.textContent = "Could not auto-load JSON. Use Load JSON or run a local server from the project root.";
    console.error(error);
  }
}

function setReviews(reviews, status) {
  state.allReviews = enrichReviews(reviews);
  state.source = status;
  els.datasetStatus.textContent = status;
  populateMonths();
  setDateDefaults();
  render();
}

function bindEvents() {
  els.reloadData.addEventListener("click", refreshFromJson);
  els.tabButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  [els.dateFrom, els.dateTo, els.sentimentFilter, els.ratingFilter, els.categoryFilter, els.monthFilter, els.keywordFilter, els.suggestionsOnly]
    .forEach((el) => el.addEventListener("input", render));

  els.urgentConcerns.addEventListener("click", handleUrgentReviewClick);
  els.closeReviewModal.addEventListener("click", closeReviewModal);
  els.reviewModal.addEventListener("click", (event) => {
    if (event.target === els.reviewModal) closeReviewModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeReviewModal();
  });

  window.addEventListener("resize", debounce(render, 120));
}

function populateCategories() {
  for (const category of categoryRules.map((item) => item.name).concat("Other")) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.append(option);
  }
}

function populateMonths() {
  const current = els.monthFilter.value;
  els.monthFilter.innerHTML = '<option value="">All</option>';
  for (const month of availableMonths(state.allReviews)) {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    els.monthFilter.append(option);
  }
  els.monthFilter.value = current;
}

function setDateDefaults() {
  const dates = state.allReviews.map((review) => review.reviewDate).filter(Boolean).sort((a, b) => a - b);
  if (!dates.length) return;
  if (!els.dateFrom.value) els.dateFrom.value = toDateInput(dates[0]);
  if (!els.dateTo.value) els.dateTo.value = toDateInput(dates[dates.length - 1]);
}

function setActiveTab(tabName) {
  els.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  els.homeTab.classList.toggle("active", tabName === "home");
  els.actionsTab.classList.toggle("active", tabName === "actions");
  els.latestTab.classList.toggle("active", tabName === "latest");
  els.attentionTab.classList.toggle("active", tabName === "attention");
  els.categoryTab.classList.toggle("active", tabName === "category");
}

function render() {
  const filters = currentFilters();
  const reviews = applyFilters(state.allReviews, filters);
  const stats = summarize(reviews);
  const latestDate = state.allReviews.map((r) => r.reviewDate).filter(Boolean).sort((a, b) => b - a)[0];

  els.lastReviewDate.textContent = latestDate ? formatDate(latestDate) : "-";
  els.filteredCount.textContent = reviews.length.toLocaleString();
  renderKpis(stats);
  renderInsights(stats);
  renderCharts(stats);
  renderTables(reviews, stats);
}

function currentFilters() {
  const dateTo = els.dateTo.value ? new Date(`${els.dateTo.value}T23:59:59`) : null;
  return {
    dateFrom: els.dateFrom.value ? new Date(`${els.dateFrom.value}T00:00:00`) : null,
    dateTo,
    sentiment: els.sentimentFilter.value,
    rating: els.ratingFilter.value,
    category: els.categoryFilter.value,
    month: els.monthFilter.value,
    keyword: els.keywordFilter.value.trim(),
    suggestionsOnly: els.suggestionsOnly.checked,
  };
}

function renderKpis(stats) {
  const positive = stats.sentimentCounts.Positive || 0;
  const neutral = stats.sentimentCounts.Neutral || 0;
  const negative = stats.sentimentCounts.Negative || 0;
  els.kpiTotal.textContent = stats.total.toLocaleString();
  els.kpiPositive.textContent = `${positive.toLocaleString()} (${percent(positive, stats.total)}%)`;
  els.kpiNeutral.textContent = `${neutral.toLocaleString()} (${percent(neutral, stats.total)}%)`;
  els.kpiNegative.textContent = `${negative.toLocaleString()} (${percent(negative, stats.total)}%)`;
  els.kpiScore.textContent = stats.score;
  els.kpiRating.textContent = stats.avgRating.toFixed(2);
}

function renderInsights(stats) {
  els.summaryText.textContent = stats.summaryText;
  renderList(els.positiveThemes, stats.positiveThemes, "No positive themes in the current filters.");
  renderList(els.improvementThemes, stats.improvementThemes, "No improvement themes in the current filters.");
  renderUrgentConcerns(stats);
}

function renderCharts(stats) {
  drawDonut(charts.sentiment, sentimentRows(stats.sentimentCounts));
  drawStackedTrend(charts.trend, stats.monthly);
  drawRatingBars(charts.rating, stats.ratingCounts);
  drawBars(charts.category, Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([label, value]) => ({ label, value })));
  drawBars(charts.keyword, stats.keywords.slice(0, 12), { color: "#2563eb" });
  drawBars(charts.suggestion, stats.suggestions.slice(0, 12), { color: "#b45309" });
}

function renderUrgentConcerns(stats) {
  const urgent = stats.urgentConcerns || [];
  els.urgentCount.textContent = urgent.length ? `${urgent.length} recurring complaints` : "No urgent issues";
  els.urgentConcerns.innerHTML = urgent.length
    ? urgent.map((item) => `
      <article class="urgent-item">
        <div class="urgent-head">
          <strong>${escapeHtml(item.label)}</strong>
          <span class="urgent-pill">${item.count.toLocaleString()} mentions</span>
        </div>
        <ul>
          ${item.examples.map((example) => `
            <li>
              <span>${escapeHtml(shortText(example.text, 140))}</span>
              <button type="button" class="text-link" data-review-data="${encodeURIComponent(JSON.stringify({
                title: item.label,
                author: example.author || "Anonymous",
                rating: example.rating,
                date: example.date ? formatDate(example.date) : "",
                text: example.text,
              }))}">
                View
              </button>
            </li>
          `).join("")}
        </ul>
      </article>
    `).join("")
    : `<div class="empty-state">No recurring complaint patterns detected in the current filters.</div>`;
}

function renderTables(reviews, stats) {
  const latest = [...reviews].filter((review) => hasReviewText(review.text)).sort((a, b) => (b.reviewDate || 0) - (a.reviewDate || 0)).slice(0, 40);
  els.latestCount.textContent = `${latest.length} shown`;
  els.latestReviews.innerHTML = latest.map((review) => `
    <tr>
      <td>${formatDate(review.reviewDate)}</td>
      <td>${review.rating || "-"}</td>
      <td>${sentimentPill(review.sentiment)}</td>
      <td>${escapeHtml(shortText(review.text, 220))}</td>
      <td>${review.categories.map((cat) => `<span class="pill">${escapeHtml(cat)}</span>`).join("")}</td>
    </tr>
  `).join("");

  const attention = stats.recommendations.slice(0, 50);
  els.attentionCount.textContent = `${attention.length} shown`;
  els.attentionReviews.innerHTML = attention.map((review) => `
    <tr>
      <td class="severity-${review.recommendation.severity.toLowerCase()}">${review.recommendation.severity}</td>
      <td>${escapeHtml(shortText(review.recommendation.concern, 180))}</td>
      <td>${escapeHtml(review.recommendation.category)}</td>
      <td>${escapeHtml(review.recommendation.action)}</td>
    </tr>
  `).join("");

  els.categorySummary.innerHTML = stats.categorySummary.map((row) => `
    <tr>
      <td>${escapeHtml(row.category)}</td>
      <td>${row.total.toLocaleString()}</td>
      <td>${row.Positive.toLocaleString()}</td>
      <td>${row.Neutral.toLocaleString()}</td>
      <td>${row.Negative.toLocaleString()}</td>
    </tr>
  `).join("");
}

function handleUrgentReviewClick(event) {
  const button = event.target.closest("button[data-review-data]");
  if (!button) return;

  try {
    const review = JSON.parse(decodeURIComponent(button.getAttribute("data-review-data")));
    openReviewModal(review);
  } catch (error) {
    console.error(error);
  }
}

function openReviewModal(review) {
  els.reviewModalTitle.textContent = review.title || "Full Review";
  els.reviewModalBody.innerHTML = `
    <div class="modal-meta">
      <span>${escapeHtml(review.author || "Anonymous")}</span>
      ${review.rating ? `<span>Rating: ${escapeHtml(review.rating)}</span>` : ""}
      ${review.date ? `<span>${escapeHtml(review.date)}</span>` : ""}
    </div>
    <p class="modal-text">${escapeHtml(review.text || "No review text available.")}</p>
  `;
  els.reviewModal.classList.remove("hidden");
}

function closeReviewModal() {
  els.reviewModal.classList.add("hidden");
}

function renderList(node, rows, emptyText) {
  node.innerHTML = rows.length
    ? rows.map((row) => `<li>${escapeHtml(row.label)} <span class="muted">(${row.value.toLocaleString()})</span></li>`).join("")
    : `<li>${emptyText}</li>`;
}

function sentimentPill(sentiment) {
  return `<span class="pill ${sentiment}">${sentiment}</span>`;
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsAll(selector) {
  return [...document.querySelectorAll(selector)];
}

function toDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date) {
  if (!date) return "-";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function percent(value, total) {
  return total ? Math.round(value * 1000 / total) / 10 : 0;
}

function shortText(text, max) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function hasReviewText(text) {
  return typeof text === "string" && text.trim().length > 0;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function debounce(fn, wait) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
