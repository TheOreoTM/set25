import {
  publicAvailabilityLabels,
  type PublicAvailability,
} from "@set25/shared";

export function AvailabilityLabel({ value }: { value: PublicAvailability }) {
  return (
    <span className={`availability availability--${value.toLowerCase().replace("_", "-")}`}>
      <span className="availability__mark" aria-hidden="true" />
      {publicAvailabilityLabels[value]}
    </span>
  );
}
