type ScrollCueProps = {
  href?: string;
};

export function ScrollCue({ href = "#about" }: ScrollCueProps) {
  return (
    <a className="scroll-cue" href={href} aria-label="Scroll to continue">
      <svg aria-hidden="true" viewBox="0 0 24 44" fill="none">
        <path d="M12 1v38M6 33l6 6 6-6" />
      </svg>
    </a>
  );
}
