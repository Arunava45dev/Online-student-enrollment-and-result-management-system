import client from "./client";

export const listCourses = (semester) => client.get("/courses/", { params: semester ? { semester } : {} });
export const createCourse = (payload) => client.post("/courses/", payload);
export const deleteCourse = (courseId) => client.delete(`/courses/${courseId}`);
