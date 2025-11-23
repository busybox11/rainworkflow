import { useEffect, useState } from "react";

const dayOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const monthOfYear = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

export default function Clock() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [date]);

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  const day = date.getDate();
  const month = monthOfYear[date.getMonth()];
  const dayOfWeekStr = dayOfWeek[date.getDay()];

  return (
    <div
      style={{
        fontSize: "2rem",
      }}
    >
      <span style={{ color: "gray" }}>{`${dayOfWeekStr} ${day} ${month}`}</span>

      <span
        style={{ fontWeight: "bold", marginLeft: "1rem" }}
      >{`${hours}:${minutes}`}</span>
    </div>
  );
}
