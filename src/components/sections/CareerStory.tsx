import { Container } from "@/components/layout/Container";
import { StickyStory } from "@/components/motion/StickyStory";
import { careerStatements } from "@/content/site";

export function CareerStory() {
  return (
    <section
      className="career-section"
      aria-labelledby="career-heading"
      data-nav-theme="paper"
    >
      <h2 className="sr-only" id="career-heading">
        Your degree gets you noticed. Your skills get you hired.
      </h2>
      <Container>
        <StickyStory
          statements={careerStatements}
          className="career-story"
          statementClassName="career-statement"
        />
      </Container>
    </section>
  );
}
