import client from "./client";

export const listAllEnrollments = () => client.get("/enrollments/");
export const enroll = (payload) => client.post("/enrollments/", payload);
export const myEnrollments = (semester) => client.get("/enrollments/me", { params: semester ? { semester } : {} });
export const cancelEnrollment = (enrollmentId) => client.delete(`/enrollments/${enrollmentId}`);

/**
 * Download the enrollment PDF for the logged-in student.
 * @param {number|null} semester - Semester number (1-8), or null for all.
 */
export async function downloadEnrollmentPDF(semester) {
  const params = semester ? { semester } : {};
  const res = await client.get("/enrollments/me/pdf", {
    params,
    responseType: "blob",
  });
  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = semester ? `enrollment_report_sem${semester}.pdf` : "enrollment_report.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
