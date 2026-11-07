type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className = "" }: WordmarkProps) {
  return <span className={`wordmark ${className}`.trim()}>SpeakUp</span>;
}
