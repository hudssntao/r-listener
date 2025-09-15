/**
 * Sleep for a random duration to simulate human-like delays.
 * @param type "short" | "medium" | "long"
 *   - short: 97-211ms
 *   - medium: 233-527ms
 *   - long: 601-1024ms
 */
export function generateRandomSleepTimeInMs(
  type: "very short" | "short" | "medium" | "long" | "very long" = "medium",
): number {
  let min: number, max: number;
  switch (type) {
    case "very short":
      min = 150;
      max = 350;
      break;
    case "short":
      min = 300;
      max = 600;
      break;
    case "medium":
      min = 600;
      max = 1500;
      break;
    case "long":
      min = 1800;
      max = 3500;
      break;
    case "very long":
      min = 4000;
      max = 10000;
      break;
    default:
      min = 600;
      max = 1500;
  }
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay;
}
