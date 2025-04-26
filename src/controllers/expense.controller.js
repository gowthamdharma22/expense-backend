// import * as expenseService from "../services/expense.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

const getExpenses = async (req, res) => {
  try {
    // const expenses = await expenseService.getExpenses();
    sendSuccess(res, "Success", "Fetched expenses", 200);
  } catch (err) {
    sendError(
      res,
      { message: err.message },
      "Failed to fetch expenses",
      err.status || 500
    );
  }
};

export { getExpenses };
