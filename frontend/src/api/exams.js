import client from "./client";

export const listExams = () => client.get("/exams/");
export const scheduleExam = (payload) => client.post("/exams/", payload);
export const deleteExam = (id) => client.delete(`/exams/${id}`);
