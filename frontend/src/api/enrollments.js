import client from "./client";

export const listAllEnrollments = () => client.get("/enrollments/");
export const enroll = (payload) => client.post("/enrollments/", payload);
export const myEnrollments = (semester) => client.get("/enrollments/me", { params: semester ? { semester } : {} });
export const cancelEnrollment = (enrollmentId) => client.delete(`/enrollments/${enrollmentId}`);
