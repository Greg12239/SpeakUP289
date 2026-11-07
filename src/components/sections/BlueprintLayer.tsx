import type { CSSProperties } from "react";

const marks = [
  { className: "bp-registration bp-registration--top-left", x: 68, y: 86 },
  { className: "bp-registration bp-registration--top-right", x: 1352, y: 86 },
  { className: "bp-registration bp-registration--frame", x: 980, y: 232 },
];

export function BlueprintLayer() {
  return (
    <div className="blueprint-layer" aria-hidden="true">
      <div className="bp-grid bp-secondary" />
      <svg
        className="bp-drawing"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        focusable="false"
      >
        <g className="bp-primary">
          <path className="bp-axis bp-axis--horizontal" d="M0 514H1440" />
          <path className="bp-axis bp-axis--vertical" d="M316 0V900" />
          <path className="bp-title-guide bp-title-guide--one" d="M92 580H890" />
          <path className="bp-title-guide bp-title-guide--two" d="M92 708H1010" />
          <path className="bp-frame" d="M870 194H1334V656H870Z" />
          <path className="bp-frame bp-frame--inner" d="M888 212H1316V638H888Z" />
          <path className="bp-measure" d="M870 164H1334M870 152V176M1334 152V176" />
          <path className="bp-measure bp-measure--side" d="M842 194V656M830 194H854M830 656H854" />
        </g>
        <g className="bp-secondary">
          <path d="M0 150H1440M0 792H1440" />
          <path d="M1100 0V900" />
        </g>
      </svg>
      {marks.map((mark) => (
        <span
          className={mark.className}
          key={mark.className}
          style={{ "--bp-x": `${(mark.x / 1440) * 100}%`, "--bp-y": `${(mark.y / 900) * 100}%` } as CSSProperties}
        />
      ))}
      <div className="bp-annotation bp-annotation--type">TYPE / 01</div>
      <div className="bp-annotation bp-annotation--image">IMAGE PLANE / 02</div>
      <div className="bp-title-ghost" aria-hidden="true">
        <span>Learn to sell.</span>
        <span>Learn to lead.</span>
      </div>
    </div>
  );
}
