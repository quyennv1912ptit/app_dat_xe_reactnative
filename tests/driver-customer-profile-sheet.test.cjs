const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

// Hồ sơ khách hàng của tài xế: nền tảng đánh giá dùng chung với app khách
// (DriverReviews) và nằm trong bottom sheet trượt lên, không dính trip history.
test("driver customer profile shows the same DriverReviews summary as the customer app without polluting trip history", () => {
  const reviews = fs.readFileSync("apps/driver/src/features/ride/components/CustomerReviews.tsx", "utf8");
  assert.match(reviews, /\/driver\/profile\/reviews/);
  assert.match(reviews, /<DriverReviews\b/);
  assert.match(reviews, /type DriverReviewSummary/);
  assert.doesNotMatch(reviews, /ReceivedRatings|\/driver\/ratings\/received|\/customer\/ratings\/received/);

  const card = fs.readFileSync("apps/driver/src/features/ride/components/RideCustomerCard.tsx", "utf8");
  assert.match(card, /<CustomerReviews enabled=\{visible\} \/>/);
  assert.match(card, /<Text accessibilityRole="header" style=\{s\.title\}>Hồ sơ khách hàng<\/Text>/);
  assert.match(card, /<Modal\s+visible=\{visible\}\s+transparent\s+animationType="slide"/);
  assert.match(card, /justifyContent: "flex-end"/);
  assert.doesNotMatch(card, /<Dialog|Portal/);

  const inProgress = fs.readFileSync("apps/driver/src/features/ride/screens/InProgressScreen.tsx", "utf8");
  assert.match(inProgress, /<RideCustomerCard key=\{ride\.id\} ride=\{ride\} \/>/);

  const detail = fs.readFileSync("apps/driver/src/features/ride/screens/CompleteScreen.tsx", "utf8");
  assert.doesNotMatch(detail, /RideCustomerCard/);

  const history = fs.readFileSync("apps/driver/src/features/history/screens/HistoryScreen.tsx", "utf8");
  assert.doesNotMatch(history, /Đã đánh giá|myRatingStars|hasRated/);
});
