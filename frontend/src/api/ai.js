import client from "./client";

export const getResultSummary = (semester) => client.get("/ai/summary", { params: semester ? { semester } : {} });
export const sendChatMessage = (payload) => client.post("/ai/chat", payload);
export const generateRemark = (payload) => client.post("/ai/remark", payload);
