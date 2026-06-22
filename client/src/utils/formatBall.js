export const formatBall = (ball) => {
  switch (ball.eventType) {
    case "wide":
      return `WD${ball.extraRuns}`;

    case "noball":
      return `NB${ball.extraRuns}`;

    case "bye":
      return `B${ball.extraRuns}`;

    case "legbye":
      return `LB${ball.extraRuns}`;

    case "wicket":
      return "W";

    case "runout":
      return `RO${ball.runs}`;

    default:
      return String(ball.runs);
  }
};
