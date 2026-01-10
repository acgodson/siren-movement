'use client';

interface Props {
  currentReading: number;
}

const noiseCategories = [
  { max: 50, color: '#90EE90', label: 'Quiet' },        // 0-50 dB: Quiet (green)
  { max: 65, color: '#FFFF00', label: 'Moderate' },     // 51-65 dB: Moderate (yellow)
  { max: 80, color: '#FFA500', label: 'Moderately Loud' }, // 66-80 dB: Moderately Loud (orange)
  { max: 95, color: '#FF0000', label: 'Loud' },         // 81-95 dB: Loud (red)
  { max: Infinity, color: '#990000', label: 'Very Loud' }, // 96+ dB: Very Loud (dark red)
];

const getNoiseColor = (reading: number) => {
  for (let category of noiseCategories) {
    if (reading <= category.max) {
      return category.color;
    }
  }
  return noiseCategories[noiseCategories.length - 1].color;
};

export function DualSoundBarProgress({ currentReading }: Props) {
  const normalizedReading = Math.min(Math.max(currentReading, 0), 100);
  const color = getNoiseColor(currentReading);

  const size = 220.5;
  const center = size / 2;
  const radius = 100.5;
  const strokeWidth = 9;

  const angleToRad = (angle: number) => (angle * Math.PI) / 180;

  const createArc = (startAngle: number, endAngle: number, sweepFlag: number) => {
    const startRad = angleToRad(startAngle);
    const endRad = angleToRad(endAngle);
    const startX = center + radius * Math.cos(startRad);
    const startY = center + radius * Math.sin(startRad);
    const endX = center + radius * Math.cos(endRad);
    const endY = center + radius * Math.sin(endRad);

    const angleDiff = endAngle - startAngle;
    const normalizedDiff = angleDiff < 0 ? angleDiff + 360 : angleDiff;
    const largeArc = normalizedDiff > 180 ? 1 : 0;

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`;
  };

  // Full semicircle is 180 degrees
  // Each side gets half: 90 degrees
  // arcAngle represents how much of the 90 degrees each side should fill
  const halfArcAngle = (normalizedReading / 100) * 90;

  // Left arc: starts at bottom (90°) and grows counter-clockwise towards west (180°)
  const leftStart = 90;
  const leftEnd = 90 + halfArcAngle;

  // Right arc: starts at bottom (90°) and grows clockwise towards east (0°)
  const rightStart = 90;
  const rightEnd = 90 - halfArcAngle;

  return (
    <div
      className="absolute z-2 pointer-events-none"
      style={{
        top: '-11.5px',
        right: '-8.2px',
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Left arc - grows from bottom counter-clockwise to west */}
        <path
          d={createArc(leftStart, leftEnd, 1)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-100 ease-out"
        />
        {/* Right arc - grows from bottom clockwise to east */}
        <path
          d={createArc(rightEnd, rightStart, 1)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-100 ease-out"
        />
      </svg>
    </div>
  );
}
