import { CareerStory } from "@/components/sections/CareerStory";
import { ConversationStory } from "@/components/sections/ConversationStory";
import { EventExperience } from "@/components/sections/EventExperience";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { HeroToEventTransition } from "@/components/sections/HeroToEventTransition";
import { Impact } from "@/components/sections/Impact";
import { Partners } from "@/components/sections/Partners";

export default function Home() {
  return (
    <main id="main-content">
      <HeroToEventTransition />
      <ConversationStory />
      <EventExperience />
      <Impact />
      <CareerStory />
      <Partners />
      <FinalCTA />
    </main>
  );
}
