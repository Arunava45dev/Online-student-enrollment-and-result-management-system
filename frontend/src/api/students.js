import client from "./client";

export const createStudent = (payload) => client.post("/students/", payload);
export const listStudents = () => client.get("/students/");
export const deleteStudent = (id) => client.delete(`/students/${id}`);
