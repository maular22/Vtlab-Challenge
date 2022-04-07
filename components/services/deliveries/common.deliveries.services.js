import Deliveries from "@/models/Deliveries.model";
import Products from "@/models/Products.model";

const find = async (req) => {
  // some vars
  let query = {};
  let limit = req.body.limit
    ? req.body.limit > 100
      ? 100
      : parseInt(req.body.limit)
    : 100;
  let skip = req.body.page
    ? (Math.max(0, parseInt(req.body.page)) - 1) * limit
    : 0;
  let sort = { _id: 1 };

  // if date provided, filter by date
  if (req.body.when) {
    query["when"] = {
      $gte: req.body.when,
    };
  }

  let totalResults = await Deliveries.find(query).countDocuments();

  if (totalResults < 1) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find any delivery`,
      },
    };
  }

  let deliveries = await Deliveries.find(query)
    .skip(skip)
    .sort(sort)
    .limit(limit);

  return {
    totalResults: totalResults,
    deliveries,
  };
};

const create = async (req) => {
  try {
    await Deliveries.create(req.body);
  } catch (e) {
    throw {
      code: 400,
      data: {
        message: `An error has occurred trying to create the delivery:
          ${JSON.stringify(e, null, 2)}`,
      },
    };
  }
};

const findOne = async (req) => {
  let delivery = await Deliveries.findOne({ _id: req.body.id });
  if (!delivery) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find a delivery with the sent ID`,
      },
    };
  }
  return delivery;
};

const findServices = async (req) => {
  // some vars

  console.log("que trae , ", req.body);
  let query = {};
  let limit = req.body.limit
    ? req.body.limit > 100
      ? 100
      : parseInt(req.body.limit)
    : 100;
  let skip = req.body.page
    ? (Math.max(0, parseInt(req.body.page)) - 1) * limit
    : 0;
  let sort = { _id: 1 };

  // if date provided, filter by date
  if (req.body.when) {
    query["when"] = {
      $gte: req.body.when,
    };
  }
  const weightV = parseInt(req.body.weight);
  const dateFrom = req.body.dateFrom;
  const dateTo = req.body.dateTo;

  let totalResults = await Deliveries.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "products",
        foreignField: "_id",
        pipeline: [{ $match: { weight: { $gte: weightV } } }],
        as: "products",
      },
    },
    {
      $match: {
        "products.weight": { $gte: weightV },
        when: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
      },
    },

    { $group: { _id: null, count: { $sum: 1 } } },
  ]);

  if (totalResults < 1) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find any delivery`,
      },
    };
  }

  let deliveries = await Deliveries.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "products",
        foreignField: "_id",
        pipeline: [{ $match: { weight: { $gte: weightV } } }],
        as: "products",
      },
    },
    {
      $match: {
        when: {
          $gte: new Date(dateFrom),
          $lte: new Date(dateTo),
        },
        "products.weight": { $gte: weightV },
      },
    },
  ])
    .skip(skip)
    .sort(sort)
    .limit(limit);

  return {
    totalResults: totalResults[0].count,

    deliveries,
  };
};

export default {
  find,
  create,
  findOne,
  findServices,
};
