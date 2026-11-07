import { Container } from "@/components/layout/Container";
import { FooterSocialCtas } from "@/components/layout/FooterSocialCtas";
import { footerItems } from "@/content/site";

export function Footer() {
  return (
    <footer className="site-footer" id="footer" data-nav-theme="ink">
      <Container className="footer-inner">
        <div className="footer-contact">
        <nav className="footer-links" aria-label="Footer navigation">
          {footerItems.map((item) => {
            if (
              item.label === "Instagram" ||
              item.label === "LinkedIn" ||
              item.label === "Email"
            ) {
              return null;
            }

            return item.href ? (
              <a
                href={item.href}
                key={item.label}
                {...(item.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {item.label}
              </a>
            ) : (
              <span aria-disabled="true" key={item.label}>
                {item.label}
              </span>
            );
          })}
        </nav>
        <FooterSocialCtas />
        </div>

        <p className="footer-note">SpeakUp</p>
      </Container>
    </footer>
  );
}
