import Image from "next/image";
import { publicAsset } from "@/lib/public-asset";

type LogoVariant = "primary" | "wordmark";

type LogoProps = {
  variant?: LogoVariant;
  className?: string;
  alt?: string;
  priority?: boolean;
};

const logoAssets = {
  primary: {
    src: publicAsset("/brand/speakup-primary.png"),
    width: 1250,
    height: 370,
  },
  wordmark: {
    src: publicAsset("/brand/speakup-wordmark.png"),
    width: 1250,
    height: 270,
  },
} as const;

/**
 * Centralizes the supplied official raster lockups. The assets retain the
 * original logo artwork; only transparent canvas space is cropped per context.
 */
export function Logo({
  variant = "primary",
  className = "",
  alt = "SpeakUp, AUEB",
  priority = false,
}: LogoProps) {
  const asset = logoAssets[variant];

  return (
    <span className={`brand-logo brand-logo-${variant} ${className}`.trim()}>
      <Image
        src={asset.src}
        alt={alt}
        width={asset.width}
        height={asset.height}
        sizes={
          variant === "wordmark"
            ? "(max-width: 48rem) 8.5rem, 10.5rem"
            : "(max-width: 48rem) 9.25rem, 12.5rem"
        }
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </span>
  );
}
