"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useRef } from "react";
import { REDUCED_MOTION_QUERY, useLayoutSync } from "@/hooks/useLayoutSync";
import { conversationStatements } from "@/content/site";
import { clamp01, mix, norm, outCubic, smooth } from "@/lib/scene-math";

/**
 * THE FRAME — Scene C, the conversation.
 *
 * The ground is already ink when this scene arrives: Scene A's ink plane
 * handed it over, so there is no seam to hide here and no second mechanism
 * acting on the paper/ink boundary. Scene C only has to bring the voice up
 * out of it.
 *
 * The opening statement has one owner across the whole boundary. It begins
 * while the section is still rising into view and continues through the pin
 * without restarting, because both phases read the same progress value
 * (offset start-end -> end-end).
 */

const conversationIntroLines = [
  "Every opportunity",
  "starts with a",
  "conversation.",
] as const;

/** Masked line rises for the opening statement. */
const INTRO_LINES = [
  [0.04, 0.24],
  [0.09, 0.29],
  [0.14, 0.34],
] as const;

/** The match-cut rule that arrives where Scene A's middle rule left off. */
const RULE = [0.3, 0.42] as const;

/** in .. hold .. out for each of the three turns of the conversation. */
const STATEMENT_1 = [0.04, 0.46, 0.56] as const;
const STATEMENT_2 = [0.52, 0.62, 0.74, 0.82] as const;
const STATEMENT_3 = [0.8, 0.9] as const;

export function ConversationStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const statementRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const reducedRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end end"],
  });

  const render = useCallback(() => {
    const stage = stageRef.current;
    const rule = ruleRef.current;
    const statements = statementRefs.current;
    const lines = lineRefs.current;

    if (!stage || !rule || reducedRef.current) {
      return;
    }

    const [intro, reply, resolution] = statements;

    if (!intro || !reply || !resolution) {
      return;
    }

    const c = clamp01(scrollYProgress.get());

    const live = c > 0 && c < 1;
    sectionRef.current?.setAttribute("data-active", live ? "true" : "false");

    // --- the opening statement, line by line ---
    for (let index = 0; index < INTRO_LINES.length; index += 1) {
      const line = lines[index];

      if (!line) {
        continue;
      }

      const t = smooth(norm(c, INTRO_LINES[index]![0], INTRO_LINES[index]![1]));
      line.style.transform = `translate3d(0,${((1 - t) * 108).toFixed(2)}%,0)`;
    }

    // --- the three turns of the conversation ---
    // 1 — opens at the left margin
    const introOpacity = clamp01(
      smooth(norm(c, STATEMENT_1[0], 0.10)) -
        smooth(norm(c, STATEMENT_1[1], STATEMENT_1[2])),
    );
    const introY = -smooth(norm(c, STATEMENT_1[1], STATEMENT_1[2])) * 7;

    intro.style.opacity = introOpacity.toFixed(3);
    intro.style.transform = `translate3d(0,${introY.toFixed(2)}%,0)`;
    intro.style.visibility = introOpacity < 0.004 ? "hidden" : "";

    // The match-cut rule belongs to the opening statement, so it leaves with
    // it rather than lingering under the other two turns.
    rule.style.transform = `scaleX(${outCubic(norm(c, RULE[0], RULE[1])).toFixed(3)})`;
    rule.style.opacity = introOpacity.toFixed(3);

    // 2 — the reply, indented
    const replyIn = smooth(norm(c, STATEMENT_2[0], STATEMENT_2[1]));
    const replyOut = smooth(norm(c, STATEMENT_2[2], STATEMENT_2[3]));
    const replyOpacity = clamp01(replyIn - replyOut);

    reply.style.opacity = replyOpacity.toFixed(3);
    reply.style.transform = `translate3d(${mix(0, 6, replyIn).toFixed(2)}%,${(
      mix(7, 0, replyIn) -
      replyOut * 7
    ).toFixed(2)}%,0)`;
    reply.style.visibility = replyOpacity < 0.004 ? "hidden" : "";

    // 3 — the resolution, back at the margin and larger
    const resolved = smooth(norm(c, STATEMENT_3[0], STATEMENT_3[1]));

    resolution.style.opacity = resolved.toFixed(3);
    resolution.style.transform = `translate3d(0,${mix(7, 0, resolved).toFixed(
      2,
    )}%,0) scale(${mix(0.955, 1.045, resolved).toFixed(4)})`;
    resolution.style.visibility = resolved < 0.004 ? "hidden" : "";
  }, [scrollYProgress]);

  const syncLayout = useCallback(() => {
    const stage = stageRef.current;
    const rule = ruleRef.current;
    const intro = statementRefs.current[0];

    if (!stage || !rule || !intro) {
      return;
    }

    reducedRef.current = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (reducedRef.current) {
      rule.style.cssText = "";
      statementRefs.current.forEach((statement) => {
        if (statement) {
          statement.style.cssText = "";
        }
      });
      lineRefs.current.forEach((line) => {
        if (line) {
          line.style.transform = "";
        }
      });
      sectionRef.current?.setAttribute("data-active", "false");
      return;
    }

    // The rule sits under the opening statement, so it can only be placed
    // once the statement's own box is known. Measured here, never per frame.
    const introBounds = intro.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();

    rule.style.top = `${Math.round(introBounds.bottom - stageBounds.top + 18)}px`;
    rule.style.left = `${Math.round(introBounds.left - stageBounds.left)}px`;
    rule.style.width = `${Math.round(
      Math.min(introBounds.width, stageBounds.width * 0.46),
    )}px`;

    render();
  }, [render]);

  useLayoutSync(syncLayout);
  useMotionValueEvent(scrollYProgress, "change", render);

  return (
    <section
      ref={sectionRef}
      className="conversation-section"
      id="about"
      aria-labelledby="conversation-heading"
      data-nav-theme="ink"
    >
      <h2 className="sr-only" id="conversation-heading">
        Every opportunity starts with a conversation.
      </h2>
      <div className="conversation-canvas">
        <div className="container">
          <div ref={stageRef} className="conversation-stage">
            <div className="sr-only">
              {conversationStatements.map((statement) => (
                <p key={statement}>{statement}</p>
              ))}
            </div>
            <span
              ref={ruleRef}
              aria-hidden="true"
              className="conversation-rule"
            />
            <p
              aria-hidden="true"
              className="conversation-statement conversation-intro-statement"
              ref={(element) => {
                statementRefs.current[0] = element;
              }}
            >
              {conversationIntroLines.map((line, index) => (
                <span className="conversation-intro-line-mask" key={line}>
                  <span
                    className="conversation-intro-line"
                    ref={(element) => {
                      lineRefs.current[index] = element;
                    }}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </p>
            {conversationStatements.slice(1).map((statement, index) => (
              <p
                aria-hidden="true"
                className="conversation-statement"
                key={statement}
                ref={(element) => {
                  statementRefs.current[index + 1] = element;
                }}
              >
                {statement}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
