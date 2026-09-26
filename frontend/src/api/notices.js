import client from "./client";

// Only POST /notices/ was visible in the API docs screenshot. A GET /notices/
// listing endpoint is assumed to exist alongside it (standard REST pairing) —
// remove listNotices() if your backend doesn't expose it.
export const listNotices = () => client.get("/notices/");
export const createNotice = (payload) => client.post("/notices/", payload);
export const deleteNotice = (id) => client.delete(`/notices/${id}`);
