import client from "./client";

export const listExams = (semester) => client.get("/exams/", { params: semester ? { semester } : {} });
export const listMyExams = (semester) => client.get("/exams/my", { params: { semester } });
export const downloadHallTicket = (semester) => client.get("/exams/my/hall-ticket", { params: { semester }, responseType: "blob" });
export const scheduleExam = (payload) => client.post("/exams/", payload);
export const deleteExam = (id) => client.delete(`/exams/${id}`);
