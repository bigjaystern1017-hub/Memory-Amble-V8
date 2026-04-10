import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut } from "lucide-react";
import heroCoupleCoffe from "@assets/hero-couple-coffee_1775849358112.jpg";
import heroGrandma from "@assets/hero-grandma-grandchild_1775849337609.jpg";
import heroManYellow from "@assets/hero-man-yellow_1775849369466.jpg";
import heroWomenLaughing from "@assets/hero-women-laughing_1775849325225.jpg";
import heroFishingCouple from "@assets/hero-fishing-couple_1775849358110.jpg";
import heroCouplesky from "@assets/hero-couple-sky_1775849325223.jpg";
import familyDrawing from "@assets/family-drawing_1774730134242.png";
import timbukAvatar from "@assets/timbuk-avatar_1773957235129.png";

const PURPLE = "#7C3AED";

export default function Landing() {
  const [, navigate] = useLocation();
  const { isAuthenticated, signOut } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const localDay = localStorage.getItem("memory-amble-day");
    setCurrentDay(localDay ? parseInt(localDay, 10) : 1);
  }, []);

  const ctaLabel = currentDay > 1 ? `Continue Day ${currentDay}` : "Start My Free Day";

  return (
    <div className="min-h-dvh bg-white font-sans">

      {/* SECTION 1 — HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: PURPLE }}>
              🧠
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "Lora, serif" }}>MemoryAmble</span>
          </div>
          <div>
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2 text-gray-600">
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="border-gray-300 text-gray-700">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>

        {/* SECTION 2 — HERO */}
        <section className="bg-white py-12 md:py-20 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Photo trio */}
            <div className="flex gap-3 md:gap-4 mb-10 md:mb-14 justify-center items-end">
              <div className="w-1/3 rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                <img src={heroCoupleCoffe} alt="Couple with coffee" className="w-full h-full object-cover" />
              </div>
              <div className="w-1/3 rounded-2xl overflow-hidden" style={{ aspectRatio: "3/5" }}>
                <img src={heroWomenLaughing} alt="Women laughing" className="w-full h-full object-cover" />
              </div>
              <div className="w-1/3 rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                <img src={heroGrandma} alt="Grandmother and grandchild" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Centered text block */}
            <div className="text-center max-w-2xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white" style={{ backgroundColor: PURPLE }}>
                Used by memory champions for 2,500 years
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-gray-900" style={{ fontFamily: "Lora, serif" }}>
                A sharper memory.<br />Starting today.
              </h1>
              <p className="text-lg md:text-xl text-gray-500 leading-relaxed">
                Ten minutes a day. A technique used by scholars and memory champions for millennia. Guided by Timbuk — your warm, wise personal memory coach.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate("/amble")}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white text-lg font-semibold shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: PURPLE }}
                >
                  {ctaLabel} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-400">Day 1 is completely free. No card needed.</p>
            </div>
          </div>
        </section>

        {/* SECTION 3 — SOCIAL PROOF BAR */}
        <section className="py-8 px-4 bg-gray-50 border-y border-gray-100">
          <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">2,500+</p>
              <p className="text-sm text-gray-500 mt-1">Years of science</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">10 min</p>
              <p className="text-sm text-gray-500 mt-1">Per day</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">7 days</p>
              <p className="text-sm text-gray-500 mt-1">To your first palace</p>
            </div>
          </div>
        </section>

        {/* SECTION 4 — ANCHOR COPY */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
          <div className="max-w-2xl mx-auto">
            <hr className="border-gray-200 mb-8" />
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, serif" }}>
              Memory training courses run $1,200 to $3,000. Private memory coaches charge more. We priced MemoryAmble at $8.47 a month deliberately — not because it's worth less, but because we believe the people who need this most shouldn't have to pay what only some people can afford. A portion of every subscription funds Alzheimer's and Sanfilippo research. The more people we reach, the more we can fund the fight.
            </p>
            <hr className="border-gray-200 mt-8" />
          </div>
        </section>

        {/* SECTION 5 — HOW IT WORKS */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: "🏠", title: "Build Your Palace", body: "Pick a place you know well. Your home, a favourite walk. That's your memory palace. It already exists." },
                { icon: "🍍", title: "Plant Vivid Images", body: "Timbuk gives you items to place. You make them vivid, strange, personal. The weirder the better." },
                { icon: "🧠", title: "Walk & Recall", body: "Stroll through your palace in your mind. Whatever you planted will be waiting. Every time." },
              ].map(({ icon, title, body }) => (
                <div key={title} className="text-center space-y-3">
                  <div className="text-4xl mb-2">{icon}</div>
                  <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>{title}</h3>
                  <p className="text-gray-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 — MEET TIMBUK */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-amber-50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-shrink-0 flex justify-center">
              <img src={timbukAvatar} alt="Timbuk" className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover shadow-md" />
            </div>
            <div className="text-center md:text-left space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>Meet Timbuk</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                Timbuk is your personal memory coach — warm, wise, and slightly arch. He teaches through doing, not lecturing. He remembers your associations, celebrates your wins, and never makes you feel tested. He has been doing this for a very long time.
              </p>
              <p className="text-gray-400 italic text-sm">He also has opinions about penguins.</p>
            </div>
          </div>
        </section>

        {/* SECTION 7 — TESTIMONIALS */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10" style={{ fontFamily: "Lora, serif" }}>What people are saying</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { quote: "I remembered every name at my grandson's birthday party for the first time in three years. My daughter noticed.", name: "Margaret", age: 71 },
                { quote: "I was skeptical. Ten minutes later I had built something I was genuinely proud of.", name: "Robert", age: 68 },
                { quote: "Timbuk makes it feel like play, not work. I look forward to it every morning.", name: "Dorothy", age: 74 },
              ].map(({ quote, name, age }) => (
                <div key={name} className="border border-gray-200 rounded-2xl p-6 space-y-4">
                  <p className="text-gray-700 italic leading-relaxed" style={{ fontFamily: "Lora, serif" }}>"{quote}"</p>
                  <p className="text-sm text-gray-400 font-medium">— {name}, {age}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8 — OUR STORY */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-amber-50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start gap-10 md:gap-16">
            <div className="flex-shrink-0 flex justify-center w-full md:w-auto">
              <img src={familyDrawing} alt="Family illustration" className="w-56 md:w-72 rounded-xl shadow-md object-cover" />
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>Our story</h2>
              <div className="text-gray-600 leading-relaxed space-y-4">
                <p>MemoryAmble started with one person.</p>
                <p>My father is 84. Sharp, funny, present — but quietly losing confidence in his own memory. Not because anything was terribly wrong. Just the slow, ordinary erosion that comes with time. He'd forget a name. Lose a word mid-sentence. Wave it off with a laugh. But I could see it bothering him.</p>
                <p>I wanted to give him something. Not a puzzle app. Not a quiz. Something warm, patient, and genuinely useful — that made him feel capable, not tested.</p>
                <p>That's Timbuk. That's MemoryAmble.</p>
                <p>If you have someone in your life like my father — or if you are that person — this was built for you.</p>
                <p className="font-medium text-gray-800">— Jay</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9 — PRICING */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10" style={{ fontFamily: "Lora, serif" }}>Simple pricing</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Card 1 — Primary */}
              <div className="rounded-2xl border-2 p-8 space-y-6 flex flex-col" style={{ borderColor: PURPLE }}>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: PURPLE }}>MemoryAmble</p>
                  <p className="text-5xl font-bold text-gray-900">$8.47</p>
                  <p className="text-gray-400 mt-1">per month · Less than 30 cents a day</p>
                </div>
                <ul className="space-y-3 flex-1">
                  {[
                    "30-day guided memory bootcamp",
                    "Daily sessions with Timbuk",
                    "Your Amble Scroll after every session",
                    "Streak tracking",
                    "Round up to donate to memory research",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 font-bold" style={{ color: PURPLE }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/amble")}
                  className="w-full py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: PURPLE }}
                >
                  Start My Free Day
                </button>
              </div>

              {/* Card 2 — Pro */}
              <div className="rounded-2xl border border-gray-200 p-8 space-y-6 flex flex-col">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-1">MemoryAmble Pro</p>
                  <p className="text-5xl font-bold text-gray-900">$19.97</p>
                  <p className="text-gray-400 mt-1">per month</p>
                </div>
                <ul className="space-y-3 flex-1">
                  {[
                    "Everything in MemoryAmble",
                    "Extended session history",
                    "Advanced palace analytics",
                    "Family sharing — up to 3 members",
                    "Priority support",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 font-bold text-gray-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Learn More
                </button>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-6 max-w-lg mx-auto">
              Memory training courses cost $1,200–$3,000. You're getting the same ancient technique, guided daily, for less than one coffee a week.
            </p>
          </div>
        </section>

        {/* SECTION 10 — MISSION */}
        <section className="py-14 md:py-20 px-4 md:px-8" style={{ backgroundColor: PURPLE }}>
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Lora, serif" }}>Our mission</h2>
            <p className="text-white/80 leading-relaxed text-lg">
              We believe memory training should be accessible to everyone. A portion of every subscription goes to Alzheimer's research and Sanfilippo syndrome research — memory loss at both ends of life. The more people we help remember, the more we can fund the fight.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <div className="w-1/2 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={heroFishingCouple} alt="Couple fishing" className="w-full h-full object-cover" />
              </div>
              <div className="w-1/2 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={heroManYellow} alt="Man in yellow" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 11 — FINAL CTA */}
        <section className="py-16 md:py-24 px-4 md:px-8 bg-white text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>Your memory is waiting.</h2>
            <p className="text-lg text-gray-500">When you're ready — Day 1 is completely free. No card needed.</p>
            <div className="pt-2">
              <button
                onClick={() => navigate("/amble")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white text-lg font-semibold shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: PURPLE }}
              >
                {ctaLabel} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400">Founding member pricing available now — this rate won't last forever.</p>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© 2025 MemoryAmble</span>
          <span className="text-center">Built with care for those who deserve a sharper mind.</span>
          <a href="mailto:brightermindlabs@outlook.com" className="hover:text-gray-600 transition-colors">
            brightermindlabs@outlook.com
          </a>
        </div>
      </footer>

    </div>
  );
}
