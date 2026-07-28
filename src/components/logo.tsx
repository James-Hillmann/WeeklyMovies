// The club mark: a strip of film with the center frame highlighted, echoing
// the poster reel's center slot. Uses currentColor so it takes the text color.
export function Logo({ size = 24 }: { size?: number }) {
  const holes = [5, 9, 15, 19];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* film strip body */}
      <rect
        x="1.75"
        y="5"
        width="20.5"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* sprocket holes, top and bottom */}
      <g fill="currentColor">
        {holes.map((x) => (
          <rect key={`t${x}`} x={x - 0.85} y="6.3" width="1.7" height="1.7" rx="0.4" />
        ))}
        {holes.map((x) => (
          <rect key={`b${x}`} x={x - 0.85} y="16" width="1.7" height="1.7" rx="0.4" />
        ))}
      </g>
      {/* highlighted center frame */}
      <rect x="9.3" y="8.9" width="5.4" height="6.2" rx="1" fill="currentColor" />
    </svg>
  );
}
