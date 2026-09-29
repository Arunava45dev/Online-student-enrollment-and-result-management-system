import client from "./client";

export const createStudent = (payload) => client.post("/students/", payload);
export const listStudents = (department) => client.get("/students/", { params: department ? { department } : {} });
export const deleteStudent = (id) => client.delete(`/students/${id}`);
