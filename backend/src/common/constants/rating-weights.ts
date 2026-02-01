export const RATING_WEIGHTS = {
  pricePerformance: 0.15,
  quality: 0.15,
  ingredients: 0.15,
  packaging: 0.15,
  productRating: 0.4,
} as const;

export function calculateOverallRating(averages: {
  pricePerformance: number;
  quality: number;
  ingredients: number;
  packaging: number;
  productRating: number;
}): number {
  return parseFloat(
    (
      averages.pricePerformance * RATING_WEIGHTS.pricePerformance +
      averages.quality * RATING_WEIGHTS.quality +
      averages.ingredients * RATING_WEIGHTS.ingredients +
      averages.packaging * RATING_WEIGHTS.packaging +
      averages.productRating * RATING_WEIGHTS.productRating
    ).toFixed(2),
  );
}

export const RATING_WEIGHTS_SQL = `(AVG(rating.price_performance) * ${RATING_WEIGHTS.pricePerformance} + AVG(rating.quality) * ${RATING_WEIGHTS.quality} + AVG(rating.ingredients) * ${RATING_WEIGHTS.ingredients} + AVG(rating.packaging) * ${RATING_WEIGHTS.packaging} + AVG(rating.product_rating) * ${RATING_WEIGHTS.productRating})`;
