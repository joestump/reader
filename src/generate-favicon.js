function getInitials(name) {
  return name
    .split(" ")
    .map((word, index, { length }) => 
      (index === 0 || index === length - 1) ? word.at(0) : null
    )
    .filter(Boolean)
    .join("");
}

export function getFavicon(name) {
  return `data:image/svg+xml;,${encodeURIComponent(`
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" fill="#D1E2FA" />
      <text
        x="50"
        y="50"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#655555"
        font-family="sans-serif"
        font-size="84"
      >${getInitials(name)}</text>
    </svg>
  `)}`;
}
