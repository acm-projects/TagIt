import React from "react";
import DateHeader, { type DateHeaderProps } from "./DateHeader";

type WeekHeaderProps = Omit<DateHeaderProps, "mode">;

const WeekHeader: React.FC<WeekHeaderProps> = (props) => {
  return <DateHeader {...props} mode="week" />;
};

export default WeekHeader;
