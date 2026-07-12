export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === "23505") {
    return res
      .status(409)
      .json({ message: "Duplicate entry", detail: err.message });
  }
  if (err.code === "23503") {
    return res
      .status(400)
      .json({ message: "Foreign key violation", detail: err.message });
  }
  if (err.code === "22P02") {
    return res
      .status(400)
      .json({ message: "Invalid data type", detail: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
