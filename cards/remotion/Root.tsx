import type React from "react";
import { Still } from "remotion";
import { RuleCard, type RuleCardProps } from "./RuleCard";
import { HEIGHT, WIDTH } from "./theme";

const placeholder: RuleCardProps = {
  bg: null,
  number: "01",
  title: "It's not what you say, it's how you say it.",
  summary: "Presentation beats content.",
  style: "risograph",
};

export const Root: React.FC = () => (
  <Still
    id="RuleCard"
    component={RuleCard}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={placeholder}
  />
);
