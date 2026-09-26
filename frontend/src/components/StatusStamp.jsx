import { CheckCircle2, Clock, XCircle, CircleDot } from "lucide-react";

const TONE_MAP = {
  pass: { cls: "stamp-pass", Icon: CheckCircle2 },
  passed: { cls: "stamp-pass", Icon: CheckCircle2 },
  published: { cls: "stamp-pass", Icon: CheckCircle2 },
  active: { cls: "stamp-pass", Icon: CheckCircle2 },
  enrolled: { cls: "stamp-pass", Icon: CheckCircle2 },
  pending: { cls: "stamp-pending", Icon: Clock },
  scheduled: { cls: "stamp-pending", Icon: Clock },
  fail: { cls: "stamp-fail", Icon: XCircle },
  failed: { cls: "stamp-fail", Icon: XCircle },
  cancelled: { cls: "stamp-cancelled", Icon: XCircle },
  canceled: { cls: "stamp-cancelled", Icon: XCircle },
};

export default function StatusStamp({ value }) {
  if (!value) return null;
  const key = String(value).toLowerCase();
  const { cls, Icon } = TONE_MAP[key] || { cls: "stamp-neutral", Icon: CircleDot };
  return (
    <span className={`stamp ${cls}`}>
      <Icon size={11} /> {value}
    </span>
  );
}
