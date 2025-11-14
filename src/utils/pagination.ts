import { Model } from "mongoose";

interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: any;
  filter?: any;
  searchQuery?: any;
  populate?: any;
  select?: any;
  aggregation?: any[]; // for aggregate pagination
  tabCounts?: boolean; // enable total count per tab
  tabFilters?: Record<string, any>; // { active: {}, inactive: {}, soldout: {} }
}

export async function paginate(model: Model<any>, options: PaginationOptions = {}) {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    filter = {},
    searchQuery = {},
    populate = null,
    select = null,
    aggregation = null,
    tabCounts = false,
    tabFilters = {},
  } = options;

  const skip = (page - 1) * limit;

  // Merge filters
  const finalQuery = { ...filter, ...searchQuery };

  let data;
  let total;

  // -----------------------------------
  // CASE 1: Mongoose find() pagination
  // -----------------------------------
  if (!aggregation) {
    let mongooseQuery = model.find(finalQuery);

    if (populate) mongooseQuery = mongooseQuery.populate(populate);
    if (select) mongooseQuery = mongooseQuery.select(select);

    [data, total] = await Promise.all([
      mongooseQuery.sort(sort).skip(skip).limit(limit),
      model.countDocuments(finalQuery),
    ]);
  } 
  
  // -----------------------------------
  // CASE 2: Aggregate pagination
  // -----------------------------------
  else {
    const pipeline = [...aggregation];

    // Add pagination stages
    pipeline.push(
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    );

    const countPipeline = [...aggregation, { $count: "total" }];

    const [aggData, countResult] = await Promise.all([
      model.aggregate(pipeline),
      model.aggregate(countPipeline),
    ]);

    data = aggData;
    total = countResult?.[0]?.total || 0;
  }

  // -----------------------------------
  // OPTIONAL: Tab wise count (active, inactive, sold-out etc.)
  // -----------------------------------
  let tabResults: Record<string, number> = {};
  if (tabCounts && tabFilters) {
    const tabPromises = Object.entries(tabFilters).map(([key, q]) =>
      model.countDocuments({ ...q, ...searchQuery })
    );

    const counts = await Promise.all(tabPromises);

    let index = 0;
    for (let key of Object.keys(tabFilters)) {
      tabResults[key] = counts[index];
      index++;
    }
  }

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
    ...(tabCounts ? { tabs: tabResults } : {}),
  };
}


// -----------------------------------
// 2) Array Pagination
// -----------------------------------
export function paginateArray(items: any[], query: any) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

  const start = (page - 1) * limit;
  const end = page * limit;

  const paginated = items.slice(start, end);

  return {
    data: paginated,
    pagination: {
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit),
      hasNextPage: end < items.length,
      hasPrevPage: page > 1,
    }
  };
}
