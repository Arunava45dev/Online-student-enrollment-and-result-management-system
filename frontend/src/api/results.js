import client from "./client";

export const publishResult = (payload) => client.post("/results/", payload);
export const getMyResults = (semester) => client.get("/results/my-results", { params: semester ? { semester } : {} });
export const listResults = (semester) => client.get("/results/", { params: semester ? { semester } : {} });
export const deleteResult = (id) => client.delete(`/results/${id}`);
export const downloadMarksheetPdf = (semester, rollNumber) => {
  const params = {};
  if (semester) params.semester = semester;
  if (rollNumber) params.roll_number = rollNumber;
  return client.get("/results/marksheet/pdf", {
    params,
    responseType: "blob",
  });
};
