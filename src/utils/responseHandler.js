const sendSuccess = (res, data, message = "Success", code = 200) => {
  return res.status(code).json({
    data: data,
    code,
    status: message,
  });
};

const sendError = (res, error, message = "Error", code = 400) => {
  return res.status(code).json({
    error,
    code,
    status: message,
  });
};

const cleanData = (data) => {
  if (Array.isArray(data)) {
    return data.map(cleanData);
  }

  if (typeof data === "object" && data !== null) {
    const { _id, __v, ...rest } = data;
    const reordered = { id: rest.id, ...rest };
    return reordered;
  }

  return data;
};

export { sendSuccess, sendError, cleanData };
