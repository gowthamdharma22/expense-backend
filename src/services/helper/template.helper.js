const filterEditableFields = (data) => {
  const editable = {};
  if ("name" in data) editable.name = data.name;
  if ("allowedEditDays" in data)
    editable.allowedEditDays = data.allowedEditDays;
  return editable;
};

export { filterEditableFields };
