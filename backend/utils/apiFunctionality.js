const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class APIFunctionality {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = String(this.queryStr.keyword || "").trim().slice(0, 100);
    if (keyword) {
      this.query = this.query.find({
        name: { $regex: escapeRegex(keyword), $options: "i" },
      });
    }
    return this;
  }

  filter() {
    const filter = {};

    if (this.queryStr.category) {
      filter.category = String(this.queryStr.category).trim().slice(0, 100);
    }

    const price = this.queryStr.price || {};
    if (price.gte !== undefined || price.lte !== undefined) {
      filter.price = {};
      if (price.gte !== undefined && Number.isFinite(Number(price.gte))) {
        filter.price.$gte = Number(price.gte);
      }
      if (price.lte !== undefined && Number.isFinite(Number(price.lte))) {
        filter.price.$lte = Number(price.lte);
      }
    }

    const ratings = this.queryStr.ratings || {};
    if (ratings.gte !== undefined && Number.isFinite(Number(ratings.gte))) {
      filter.ratings = { $gte: Number(ratings.gte) };
    }

    if (this.queryStr.inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    this.query = this.query.find(filter);
    return this;
  }

  sort() {
    const allowed = new Map([
      ["price", "price"],
      ["-price", "-price"],
      ["ratings", "ratings"],
      ["-ratings", "-ratings"],
      ["createdAt", "createdAt"],
      ["-createdAt", "-createdAt"],
      ["name", "name"],
      ["-name", "-name"],
    ]);

    this.query = this.query.sort(allowed.get(this.queryStr.sort) || "-createdAt");
    return this;
  }

  pagination(defaultLimit = 12, maxLimit = 50) {
    const currentPage = Math.max(Number.parseInt(this.queryStr.page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(this.queryStr.limit, 10) || defaultLimit;
    const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);
    const skip = limit * (currentPage - 1);

    this.page = currentPage;
    this.limit = limit;
    this.query = this.query.limit(limit).skip(skip);
    return this;
  }
}

export default APIFunctionality;
