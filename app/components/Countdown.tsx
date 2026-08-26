import { useEffect, useState } from "react";
import { pad } from "~/lib/urls";

function parts(target: string) {
  const leftMs = Math.max(0, new Date(target).getTime() - Date.now());
  let left = leftMs;
  const days = Math.floor(left / 864e5);
  left -= days * 864e5;
  const hours = Math.floor(left / 36e5);
  left -= hours * 36e5;
  const mins = Math.floor(left / 6e4);
  left -= mins * 6e4;
  const secs = Math.floor(left / 1e3);
  return { days, hours, mins, secs, done: leftMs === 0 };
}

export function Countdown({
  target,
  modifier = "",
  onDone,
}: {
  target: string;
  modifier?: string;
  onDone?: () => void;
}) {
  const [time, setTime] = useState(() => parts(target));

  useEffect(() => {
    setTime(parts(target));
    const id = setInterval(() => setTime(parts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (time.done) onDone?.();
  }, [time.done, onDone]);

  return (
    <div
      className={`countdown${modifier ? ` ${modifier}` : ""}`}
      data-countdown={target}
      {...(time.done ? { "data-done": "" } : {})}
    >
      <div className="cd-unit">
        <b>{String(time.days)}</b>
        <span>DAYS</span>
      </div>
      <div className="cd-unit">
        <b>{pad(time.hours)}</b>
        <span>HRS</span>
      </div>
      <div className="cd-unit">
        <b>{pad(time.mins)}</b>
        <span>MIN</span>
      </div>
      <div className="cd-unit">
        <b>{pad(time.secs)}</b>
        <span>SEC</span>
      </div>
    </div>
  );
}
