export const DEPARTMENTS = [
  { code: "CSE", label: "CSE — Computer Science & Engineering" },
  { code: "IT", label: "IT — Information Technology" },
  { code: "ME", label: "ME — Mechanical Engineering" },
  { code: "ECE", label: "ECE — Electronics & Communication Engineering" },
  { code: "EE", label: "EE — Electrical Engineering" },
  { code: "CE", label: "CE — Civil Engineering" },
  { code: "EEE", label: "EEE — Electrical & Electronics Engineering" },
  { code: "AI&DS", label: "AI&DS — Artificial Intelligence & Data Science" },
  { code: "GENERAL", label: "General" },
];

export function departmentLabel(code) {
  return DEPARTMENTS.find((department) => department.code === code)?.label || code || "General";
}
