import mongoose from "mongoose";
import CartModel from "../models/Cart";
import SalesDetailsModel from "../models/Sales_detail";
import wishlistModel from "../models/Wishlist";
import RatingModel from "../models/Rating";
import VisitModel from "../models/Visitcount";

const RELEVANCE_WEIGHTS = {
  ctr: 20,
  cartRate: 15,
  conversionRate: 25,
  salesPerformance: 10,
  customerExperience: 15,
  favoritesRate: 15,
};

const EXPLORATION_THRESHOLDS = {
  veryHigh: 100,
  high: 500,
  mediumHigh: 2000,
  medium: 5000,
  low: 10000,
};

const safeNumber = (value: any) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

const normalizeRate = (value: number, benchmark: number) => {
  if (benchmark <= 0) return 0;
  return clamp(value / benchmark);
};

const getExplorationPriority = (
  createdAt: Date | string,
  impressions: number,
) => {
  const ageHours = Math.max(
    0,
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60),
  );

  let exposureLevel = 0;

  if (impressions <= EXPLORATION_THRESHOLDS.veryHigh) {
    exposureLevel = 5;
  } else if (impressions <= EXPLORATION_THRESHOLDS.high) {
    exposureLevel = 4;
  } else if (impressions <= EXPLORATION_THRESHOLDS.mediumHigh) {
    exposureLevel = 3;
  } else if (impressions <= EXPLORATION_THRESHOLDS.medium) {
    exposureLevel = 2;
  } else if (impressions <= EXPLORATION_THRESHOLDS.low) {
    exposureLevel = 1;
  }

  const ageScore = 1 / (1 + ageHours / 24);

  return exposureLevel + ageScore;
};

const getExplorationStatus = (
  impressions: number,
  hasPerformanceData: boolean,
) => {
  if (impressions <= 0) return hasPerformanceData ? "normal" : "very-high";
  if (impressions <= EXPLORATION_THRESHOLDS.veryHigh) return "very-high";
  if (impressions <= EXPLORATION_THRESHOLDS.high) return "high";
  if (impressions <= EXPLORATION_THRESHOLDS.mediumHigh) return "medium-high";
  if (impressions <= EXPLORATION_THRESHOLDS.medium) return "medium";
  if (impressions <= EXPLORATION_THRESHOLDS.low) return "low";
  return "normal";
};

const getAverage = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const calculateProductRelevanceScore = (metrics: {
  impressions: number;
  clicks: number;
  carts: number;
  orders: number;
  unitsSold: number;
  favorites: number;
  ratingAverage: number;
  reviewCount: number;
  customerServiceRating: number;
  deliveryRating: number;
  itemRating: number;
  recommendedRate: number;
  categoryBenchmarks?: {
    ctr: number;
    cartRate: number;
    conversionRate: number;
    salesPerformance: number;
    favoritesRate: number;
  };
}) => {
  const impressions = safeNumber(metrics.impressions);
  const clicks = safeNumber(metrics.clicks);
  const carts = safeNumber(metrics.carts);
  const orders = safeNumber(metrics.orders);
  const unitsSold = safeNumber(metrics.unitsSold);
  const favorites = safeNumber(metrics.favorites);

  const ctr = impressions > 0 ? clicks / impressions : 0;
  const cartRate = clicks > 0 ? carts / clicks : 0;
  const conversionRate = clicks > 0 ? orders / clicks : 0;
  const favoritesRate = clicks > 0 ? favorites / clicks : 0;

  const customerExperienceValues = [
    metrics.ratingAverage > 0 ? safeNumber(metrics.ratingAverage) / 5 : null,
    metrics.customerServiceRating > 0
      ? safeNumber(metrics.customerServiceRating) / 5
      : null,
    metrics.deliveryRating > 0 ? safeNumber(metrics.deliveryRating) / 5 : null,
    metrics.itemRating > 0 ? safeNumber(metrics.itemRating) / 5 : null,
    metrics.recommendedRate > 0 ? safeNumber(metrics.recommendedRate) : null,
  ].filter((value): value is number => value !== null);

  const customerExperience = getAverage(customerExperienceValues);

  const benchmarks = metrics.categoryBenchmarks || {
    ctr: 0,
    cartRate: 0,
    conversionRate: 0,
    salesPerformance: 0,
    favoritesRate: 0,
  };

  const ctrScore =
    impressions > 0
      ? normalizeRate(ctr, benchmarks.ctr) * RELEVANCE_WEIGHTS.ctr
      : 0;
  const cartRateScore =
    clicks > 0
      ? normalizeRate(cartRate, benchmarks.cartRate) *
        RELEVANCE_WEIGHTS.cartRate
      : 0;
  const conversionScore =
    clicks > 0
      ? normalizeRate(conversionRate, benchmarks.conversionRate) *
        RELEVANCE_WEIGHTS.conversionRate
      : 0;
  const salesScore =
    normalizeRate(unitsSold, benchmarks.salesPerformance) *
    RELEVANCE_WEIGHTS.salesPerformance;
  const favoritesScore =
    clicks > 0
      ? normalizeRate(favoritesRate, benchmarks.favoritesRate) *
        RELEVANCE_WEIGHTS.favoritesRate
      : 0;
  const customerExperienceScore =
    customerExperience * RELEVANCE_WEIGHTS.customerExperience;

  const hasPerformanceData =
    impressions > 0 ||
    clicks > 0 ||
    carts > 0 ||
    orders > 0 ||
    favorites > 0 ||
    metrics.reviewCount > 0;

  const baseScore = Math.min(
    100,
    ctrScore +
      cartRateScore +
      conversionScore +
      salesScore +
      customerExperienceScore +
      favoritesScore,
  );

  return {
    baseScore: Number(baseScore.toFixed(4)),
    ctr: Number(ctr.toFixed(6)),
    cartRate: Number(cartRate.toFixed(6)),
    conversionRate: Number(conversionRate.toFixed(6)),
    favoritesRate: Number(favoritesRate.toFixed(6)),
    ctrScore: Number(ctrScore.toFixed(4)),
    cartRateScore: Number(cartRateScore.toFixed(4)),
    conversionScore: Number(conversionScore.toFixed(4)),
    salesScore: Number(salesScore.toFixed(4)),
    customerExperienceScore: Number(customerExperienceScore.toFixed(4)),
    favoritesScore: Number(favoritesScore.toFixed(4)),
    hasPerformanceData,
  };
};

export const getProductRelevanceData = async (
  products: any[],
  impressionsMap: Map<string, number> = new Map(),
) => {
  if (!products.length) return [];

  const productIds = products.map((product) => product._id);
  const objectIds = productIds.map((id) => new mongoose.Types.ObjectId(id));

  const [cartData, salesData, wishlistData, ratingData, visitData] =
    await Promise.all([
      CartModel.aggregate([
        { $match: { product_id: { $in: objectIds } } },
        { $group: { _id: "$product_id", carts: { $sum: 1 } } },
      ]),

      SalesDetailsModel.aggregate([
        {
          $match: {
            product_id: { $in: objectIds },
            order_status: { $ne: "cancelled" },
            refund_status: { $ne: "full" },
          },
        },
        {
          $group: {
            _id: "$product_id",
            orders: { $sum: 1 },
            unitsSold: { $sum: "$qty" },
            revenue: { $sum: "$amount" },
          },
        },
      ]),

      wishlistModel.aggregate([
        {
          $match: {
            product_id: { $in: objectIds },
            status: true,
          },
        },
        {
          $group: {
            _id: "$product_id",
            favorites: { $sum: 1 },
          },
        },
      ]),

      RatingModel.aggregate([
        {
          $match: {
            product_id: { $in: objectIds },
            status: "approved",
            is_hidden: false,
          },
        },
        {
          $group: {
            _id: "$product_id",
            ratingAverage: { $avg: "$rating" },
            customerServiceRating: { $avg: "$customer_service_rating" },
            deliveryRating: { $avg: "$delivery_rating" },
            itemRating: { $avg: "$item_rating" },
            recommendedRate: {
              $avg: {
                $cond: [{ $eq: ["$recommended", true] }, 1, 0],
              },
            },
            reviewCount: { $sum: 1 },
          },
        },
      ]),

      VisitModel.aggregate([
        { $match: { product_id: { $in: objectIds } } },
        {
          $group: {
            _id: "$product_id",
            clicks: { $sum: "$visit_count" },
          },
        },
      ]),
    ]);

  const cartMap = new Map(
    cartData.map((item: any) => [item._id.toString(), item]),
  );
  const salesMap = new Map(
    salesData.map((item: any) => [item._id.toString(), item]),
  );
  const wishlistMap = new Map(
    wishlistData.map((item: any) => [item._id.toString(), item]),
  );
  const ratingMap = new Map(
    ratingData.map((item: any) => [item._id.toString(), item]),
  );
  const visitMap = new Map(
    visitData.map((item: any) => [item._id.toString(), item]),
  );

  const rawMetrics = products.map((product: any) => {
    const id = product._id.toString();
    const cart = cartMap.get(id) || {};
    const sales = salesMap.get(id) || {};
    const wishlist = wishlistMap.get(id) || {};
    const rating = ratingMap.get(id) || {};
    const visits = visitMap.get(id) || {};

    return {
      product,
      impressions: safeNumber(impressionsMap.get(id)),
      clicks: safeNumber(visits.clicks),
      carts: safeNumber(cart.carts),
      orders: safeNumber(sales.orders),
      unitsSold: safeNumber(sales.unitsSold),
      revenue: safeNumber(sales.revenue),
      favorites: safeNumber(wishlist.favorites),
      ratingAverage: safeNumber(rating.ratingAverage || product.ratingAvg),
      reviewCount: safeNumber(rating.reviewCount || product.userReviewCount),
      customerServiceRating: safeNumber(rating.customerServiceRating),
      deliveryRating: safeNumber(rating.deliveryRating),
      itemRating: safeNumber(rating.itemRating),
      recommendedRate: safeNumber(rating.recommendedRate),
    };
  });

  const getRate = (metric: any, key: string) => {
    if (key === "ctr")
      return metric.impressions > 0 ? metric.clicks / metric.impressions : 0;
    if (key === "cartRate")
      return metric.clicks > 0 ? metric.carts / metric.clicks : 0;
    if (key === "conversionRate")
      return metric.clicks > 0 ? metric.orders / metric.clicks : 0;
    if (key === "favoritesRate")
      return metric.clicks > 0 ? metric.favorites / metric.clicks : 0;
    return 0;
  };

  const benchmarks = {
    ctr: Math.max(...rawMetrics.map((metric) => getRate(metric, "ctr")), 0),
    cartRate: Math.max(
      ...rawMetrics.map((metric) => getRate(metric, "cartRate")),
      0,
    ),
    conversionRate: Math.max(
      ...rawMetrics.map((metric) => getRate(metric, "conversionRate")),
      0,
    ),
    salesPerformance: Math.max(
      ...rawMetrics.map((metric) => metric.unitsSold),
      0,
    ),
    favoritesRate: Math.max(
      ...rawMetrics.map((metric) => getRate(metric, "favoritesRate")),
      0,
    ),
  };

  return rawMetrics.map((metric) => {
    const score = calculateProductRelevanceScore({
      ...metric,
      categoryBenchmarks: benchmarks,
    });

    const explorationStatus = getExplorationStatus(
      metric.impressions,
      score.hasPerformanceData,
    );

    const explorationPriority = getExplorationPriority(
      metric.product.createdAt,
      metric.impressions,
    );

    return {
      ...metric.product,
      relevanceScore: score.baseScore,
      relevanceMetrics: {
        impressions: metric.impressions,
        clicks: metric.clicks,
        carts: metric.carts,
        orders: metric.orders,
        unitsSold: metric.unitsSold,
        favorites: metric.favorites,
        ctr: score.ctr,
        cartRate: score.cartRate,
        conversionRate: score.conversionRate,
        favoritesRate: score.favoritesRate,
        ratingAverage: metric.ratingAverage,
        reviewCount: metric.reviewCount,
      },
      relevanceBreakdown: {
        ctr: score.ctrScore,
        cartRate: score.cartRateScore,
        conversion: score.conversionScore,
        sales: score.salesScore,
        customerExperience: score.customerExperienceScore,
        favorites: score.favoritesScore,
      },
      explorationStatus,
      explorationPriority,
    };
  });
};

export const applyCategoryRelevanceRanking = (products: any[]) => {
  const normalProducts = products.filter((product) => product.explorationStatus === "normal");
  const explorationProducts = products.filter((product) => product.explorationStatus !== "normal");

  normalProducts.sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return a.featured ? -1 : 1;
    }

    return Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
  });

  explorationProducts.sort((a, b) => {
    return Number(b.explorationPriority || 0) - Number(a.explorationPriority || 0);
  });

  const result: any[] = [];
  const explorationTarget = Math.min(
    explorationProducts.length,
    Math.max(1, Math.round(products.length * 0.2))
  );

  const explorationSlots = new Set<number>();

  if (explorationTarget > 0 && products.length > 0) {
    const step = products.length / explorationTarget;

    for (let i = 0; i < explorationTarget; i++) {
      explorationSlots.add(Math.min(products.length - 1, Math.floor(i * step)));
    }
  }

  let normalIndex = 0;
  let explorationIndex = 0;

  for (let position = 0; position < products.length; position++) {
    if (explorationSlots.has(position) && explorationIndex < explorationProducts.length) {
      result.push(explorationProducts[explorationIndex++]);
    } else if (normalIndex < normalProducts.length) {
      result.push(normalProducts[normalIndex++]);
    } else if (explorationIndex < explorationProducts.length) {
      result.push(explorationProducts[explorationIndex++]);
    }
  }

  return result;
};
