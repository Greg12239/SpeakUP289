import Image from "next/image";
import { publicAsset } from "@/lib/public-asset";

type HeaderTheme = "paper" | "ink" | "media";

type AdaptiveWordmarkProps = {
  theme: HeaderTheme;
  priority?: boolean;
};

const dimensions = { width: 1250, height: 270 } as const;

/**
 * Both official wordmark variants stay decoded and geometrically aligned.
 * Header owns theme resolution; this component only reflects that shared state.
 */
export function AdaptiveWordmark({
  theme,
  priority = false,
}: AdaptiveWordmarkProps) {
  const lightVariant = theme !== "paper";

  return (
    <span
      aria-hidden="true"
      className="adaptive-wordmark"
      data-variant={lightVariant ? "light" : "dark"}
    >
      <span className="adaptive-wordmark-layer adaptive-wordmark-dark">
        <Image
          src={publicAsset("/brand/speakup-wordmark.png")}
          alt=""
          width={dimensions.width}
          height={dimensions.height}
          sizes="(max-width: 48rem) 8.5rem, 10.5rem"
          priority={priority}
        />
      </span>
      <span className="adaptive-wordmark-layer adaptive-wordmark-light">
        <Image
          src={publicAsset("/brand/speakup-wordmark-light.png")}
          alt=""
          width={dimensions.width}
          height={dimensions.height}
          sizes="(max-width: 48rem) 8.5rem, 10.5rem"
          priority={priority}
        />
      </span>
    </span>
  );
}
