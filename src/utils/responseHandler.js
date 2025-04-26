const sendSuccess = (res, data, message = "Success", code = 200) => {
  return res.status(code).json({
    data,
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

export { sendSuccess, sendError };
