import { useState, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut } from "lucide-react";
import heroRunners from "@assets/hero-runners_1778244069720.png";
import heroGrandmaChild from "@assets/hero-grandma-child_1778244069721.png";
import heroFriendsSunglasses from "@assets/hero-friends-sunglasses_1778244090716.png";
import iconHouse from "@assets/icon-house_1778244069718.png";
import iconPineapple from "@assets/icon-pineapple_1778244069701.png";
import iconBrain from "@assets/icon-brain_1778244082944.png";
import heroCouplesky from "@assets/hero-couple-sky_1775849325223.jpg";
import familyDrawing from "@assets/family-drawing_1775912885165.png";
import timbukAvatar from "@assets/timbuk-hero-clean-bg_1776110930296.png";
import { Brain, Sparkles, House } from "lucide-react";

const PURPLE = "#7C3AED";

function StepCard({ number, title, text, icon: Icon }: { number: string; title: string; text: string; icon: any }) {
  return (
    <div className="group rounded-[2rem] border border-purple-100 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-100">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5B35D5] text-sm font-bold text-white">{number}</div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#5B35D5]">
          <Icon size={26} />
        </div>
      </div>
      <h3 className="mb-3 font-serif text-2xl font-bold text-[#24114F]">{title}</h3>
      <p className="text-sm leading-6 text-[#635979]">{text}</p>
    </div>
  );
}

export default function Landing() {
  const [, navigate] = useLocation();
  const { isAuthenticated, signOut } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const localDay = localStorage.getItem("memory-amble-day");
    setCurrentDay(localDay ? parseInt(localDay, 10) : 1);
  }, []);

  const ctaLabel = currentDay > 1 ? `Continue Day ${currentDay}` : "Try Day 1 Free";

  return (
    <div className="min-h-dvh bg-white font-sans">

      {/* SECTION 1 — HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: PURPLE }}>
              <img src={iconBrain} alt="Brain" className="w-8 h-8 inline-block" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "Lora, serif" }}>MemoryAmble</span>
          </div>
          <div>
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2 text-gray-600">
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="border-gray-300 text-gray-700 hidden md:inline-flex">
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
                <img src={heroRunners} alt="Active couple running by the coast" className="w-full h-full object-cover" />
              </div>
              <div className="w-1/3 rounded-2xl overflow-hidden" style={{ aspectRatio: "3/5" }}>
                <img src={heroFriendsSunglasses} alt="Friends having fun together" className="w-full h-full object-cover" />
              </div>
              <div className="w-1/3 rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                <img src={heroGrandmaChild} alt="Grandmother and grandchild" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Centered text block */}
            <div className="text-center max-w-2xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white" style={{ backgroundColor: PURPLE }}>
                Your brain remembers more than you think.
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-gray-900" style={{ fontFamily: "Lora, serif" }}>
                A Brighter Mind. Sharper Memory.<br />10 Minutes a Day.
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                MemoryAmble teaches the ancient memory palace technique in a calm, warm, visual way designed for curious adults.
              </p>
              <div className="pt-3">
                <button data-testid="button-cta-hero" onClick={() => navigate("/amble")} className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: PURPLE }}>
                  {ctaLabel} <ArrowRight size={18} />
                </button>
                <p className="mt-3 text-sm text-gray-500">No card. No pressure. Start with Day 1.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — VALUE PROP */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
            <StepCard number="1" title="Choose a place" text="Pick a real place you know well. That becomes your memory palace." icon={House} />
            <StepCard number="2" title="Add vivid images" text="Timbuk gives you objects to place. You make them bold and memorable." icon={Sparkles} />
            <StepCard number="3" title="Walk and recall" text="Mentally walk through your palace and the items come back with it." icon={Brain} />
          </div>
        </section>

        {/* SECTION 4 — ANCHOR COPY */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
          <div className="max-w-2xl mx-auto">
            <hr className="border-gray-200 mb-8" />
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, serif" }}>
              Memory training courses run $1,200 to $3,000. Private memory coaches charge more. We priced MemoryAmble at $8.47 a month deliberately — not because it's worth less, but because we believe this should be available to everyone — not just those who can afford a private coach. A portion of every subscription funds Sanfilippo syndrome and Alzheimer's research. The more people we reach, the more we can fund the fight.
            </p>
            <hr className="border-gray-200 mt-8" />
          </div>
        </section>

        {/* SECTION 5 — HOW IT WORKS */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: iconHouse, title: "Build Your Palace", body: "Pick a place you know well. Your home, a favourite walk. That's your memory palace. It already exists." },
                { icon: iconPineapple, title: "Plant Vivid Images", body: "Timbuk gives you items to place. You make them vivid, strange, personal. The weirder the better." },
                { icon: iconBrain, title: "Walk & Recall", body: "Stroll through your palace in your mind. Whatever you planted will be waiting. Every time." },
              ].map(({ icon, title, body }) => (
                <div key={title} className="text-center space-y-3">
                  <img src={icon} alt={title} className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>{title}</h3>
                  <p className="text-gray-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center py-8">
            <Button size="lg" onClick={() => { playSound("click"); navigate("/amble"); }} style={{backgroundColor: '#7C3AED', color: 'white'}} className="gap-2 text-lg px-8">
              Try the Technique Free
            </Button>
            <p className="text-sm text-muted-foreground mt-2">Day 1 is on us.</p>
          </div>
        </section>

        {/* SECTION 6 — MEET TIMBUK */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-amber-50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="relative flex items-center justify-center">
              <div
                className="rounded-full flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: '#fef9f0', width: '280px', height: '280px' }}
              >
                <img
                  src={timbukAvatar}
                  alt="Timbuk"
                  style={{ width: '260px', height: '260px', objectFit: 'contain' }}
                />
              </div>
            </div>
            <div className="text-center md:text-left space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>Meet Timbuk</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                Timbuk is your personal memory coach — warm, wise, and slightly arch. He teaches through doing, not lecturing. He remembers your associations, celebrates your wins, and never makes you feel tested. He has been doing this for a very long time.
              </p>
              <p className="text-gray-400 italic text-sm">He also has opinions about penguins.</p>
            </div>
          </div>
          <div className="text-center py-8">
            <Button size="lg" onClick={() => { playSound("click"); navigate("/amble"); }} style={{backgroundColor: '#7C3AED', color: 'white'}} className="gap-2 text-lg px-8">
              Meet Timbuk — Day 1 is Free
            </Button>
            <p className="text-sm text-muted-foreground mt-2">No card needed. Just come see.</p>
          </div>
        </section>

        {/* SECTION 7 — TESTIMONIALS */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10" style={{ fontFamily: "Lora, serif" }}>They were skeptical too.</h2>
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
          <div className="text-center py-8">
            <Button size="lg" onClick={() => { playSound("click"); navigate("/amble"); }} style={{backgroundColor: '#7C3AED', color: 'white'}} className="gap-2 text-lg px-8">
              Try Day 1 Free — No Card Needed
            </Button>
            <p className="text-sm text-muted-foreground mt-2">Complete Day 1 and unlock your free week.</p>
          </div>
        </section>

        {/* SECTION 8 — OUR STORY */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-amber-50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start gap-10 md:gap-16">
            <div className="flex-shrink-0 flex justify-center w-full md:w-auto">
              <div className="flex flex-col items-center">
                <img src={familyDrawing} alt="Family illustration" className="w-56 md:w-72 rounded-xl shadow-md object-cover" />
                <p className="text-xs text-muted-foreground italic text-center mt-2">My dad and his granddaughter</p>
              </div>
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "Lora, serif" }}>Our story</h2>
              <div className="text-gray-600 leading-relaxed space-y-4">
                <p>I built this for one person first.</p>
                <p>My dad's sharp, funny, and present — a lifelong learner. But he noticed in the past few years he didn't feel quite as sharp as he always had.</p>
                <p>He was looking for a way to train his memory the way he trained his body. Not a puzzle app. Not a quiz. Something real.</p>
                <p>I'd learned memory training years before, used it myself, and saw how fun and powerful it could be — what could genuinely be accomplished by working on your memory for just a few minutes a day.</p>
                <p>That was the genesis for MemoryAmble. Something warm, patient, and genuinely useful — that made him feel capable, not tested.</p>
                <p>If you have someone in your life like that — or if you are that person — this was built for you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9 — PRICING */}
        <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10" style={{ fontFamily: "Lora, serif" }}>Priced for everyone. Because it should be.</h2>
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
                    "Streak tracking",
                    "Round up to donate to memory research",
                    "Your Amble Scroll after every session",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 font-bold" style={{ color: PURPLE }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { playSound("click"); navigate("/amble"); }}
                  className="w-full py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: PURPLE }}
                >
                  Try Day 1 Free
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
              We believe memory training should be accessible to everyone. A portion of every subscription goes to Sanfilippo syndrome and Alzheimer's research — because memory matters at every age. The more people we help remember, the more we can fund the fight.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <div className="w-1/2 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={heroRunners} alt="Active couple running by the coast" className="w-full h-full object-cover" style={{ objectPosition: "center top" }} />
              </div>
              <div className="w-1/2 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={heroFriendsSunglasses} alt="Friends having fun together" className="w-full h-full object-cover" style={{ objectPosition: "center" }} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
