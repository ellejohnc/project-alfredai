import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Users, BookOpen, Share2, Mail, ArrowRight, Sparkles, Clock } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Post-booking confirmation page.
 * Reachable from /book ("Already booked? See next steps →") or directly by
 * GHL redirect after a booking is confirmed.
 *
 * Mobile-first, touch-friendly. Every action has a graceful fallback —
 * if a link or share fails, the user gets a toast with a mailto recovery.
 */
const expectations = [
  {
    icon: Clock,
    title: "30 focused minutes",
    body: "We'll join on time, share screens if helpful, and end on the dot.",
  },
  {
    icon: Sparkles,
    title: "A working session — not a pitch",
    body: "We map your highest-leverage workflow and sketch what automation looks like.",
  },
  {
    icon: BookOpen,
    title: "You walk away with something",
    body: "An indicative payback in AUD, a recommended starting workflow, and next steps.",
  },
];

const BookingConfirmationPage = () => {
  // Generic add-to-calendar links — open user's calendar with a placeholder
  // event so they can sync before the GHL confirmation email arrives.
  const calendarLinks = useMemo(() => {
    const title = encodeURIComponent("alfred ai Impact Conversation");
    const details = encodeURIComponent(
      "30-minute working session with alfred ai. Calendar invite with the meeting link will follow shortly via email."
    );
    // Default: tomorrow at 10am local for 30 mins (purely a placeholder users can edit)
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${fmt(start)}/${fmt(end)}`;
    const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&body=${details}&startdt=${start.toISOString()}&enddt=${end.toISOString()}`;
    return { google, outlook };
  }, []);

  const handleShare = async () => {
    const url = "https://www.alfredai.bot/book";
    const text =
      "Just booked a 30-min Impact Conversation with alfred ai — they map your highest-leverage workflow and show payback in AUD. Worth a look:";
    try {
      if (navigator.share) {
        await navigator.share({ title: "alfred ai Impact Conversation", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copied", { description: "Paste it to a colleague." });
    } catch {
      // Fallback: open email composer
      window.location.href = `mailto:?subject=${encodeURIComponent(
        "Worth a look — alfred ai"
      )}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
    }
  };

  return (
    <>
      <SEO
        title="You're booked"
        description="Your alfred ai Impact Conversation is locked in. Here's what happens next and how to get the most out of the call."
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16">
          {/* Hero confirmation */}
          <section className="container-wide max-w-3xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-5">
                <CheckCircle2 className="w-8 h-8 text-primary" aria-hidden />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                You're booked
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                A calendar invite with the meeting link is on its way to your inbox.
                If you don't see it in 2 minutes, check spam or{" "}
                <a
                  href="mailto:hello@alfredai.bot?subject=Booking%20confirmation%20missing"
                  className="text-primary underline underline-offset-4"
                >
                  email us
                </a>
                .
              </p>
            </motion.div>

            {/* Add to calendar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" aria-hidden />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Add a placeholder to your calendar</h2>
                  <p className="text-sm text-muted-foreground">
                    Block the time now — we'll replace it with the confirmed invite when it lands.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
                <Button asChild variant="outline" className="h-12 justify-center">
                  <a href={calendarLinks.google} target="_blank" rel="noopener noreferrer">
                    Add to Google Calendar
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-12 justify-center">
                  <a href={calendarLinks.outlook} target="_blank" rel="noopener noreferrer">
                    Add to Outlook
                  </a>
                </Button>
              </div>
            </motion.div>

            {/* What to expect */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-10"
              aria-labelledby="what-to-expect"
            >
              <h2 id="what-to-expect" className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                What to expect
              </h2>
              <ul className="grid sm:grid-cols-3 gap-3">
                {expectations.map(({ icon: Icon, title, body }) => (
                  <li
                    key={title}
                    className="rounded-xl border border-border bg-card p-4 sm:p-5"
                  >
                    <Icon className="w-5 h-5 text-primary mb-2" aria-hidden />
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">{title}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Related case study */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-10 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-secondary/5 p-5 sm:p-7"
              aria-labelledby="related-case-study"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" aria-hidden />
                </div>
                <div>
                  <h2 id="related-case-study" className="text-lg font-semibold text-foreground">
                    While you wait — see what's possible
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    A real Australian firm that saved 22+ hours a week with alfred ai.
                  </p>
                </div>
              </div>
              <Button asChild className="w-full sm:w-auto h-12 mt-2">
                <Link to="/impact-studies/case-studies">
                  Read the WZW Construction case study
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden />
                </Link>
              </Button>
            </motion.section>

            {/* Invite a colleague */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-7"
              aria-labelledby="invite-colleague"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" aria-hidden />
                </div>
                <div>
                  <h2 id="invite-colleague" className="text-lg font-semibold text-foreground">
                    Bring a colleague
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Decisions stick when the right people hear them together. Share the booking link.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
                <Button onClick={handleShare} variant="default" className="h-12 justify-center">
                  <Share2 className="w-4 h-4 mr-2" aria-hidden />
                  Share booking link
                </Button>
                <Button asChild variant="outline" className="h-12 justify-center">
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      "Sit in on this with me?"
                    )}&body=${encodeURIComponent(
                      "I booked a 30-min Impact Conversation with alfred ai to map an automation opportunity. Could you join me?\n\nBook your slot here: https://www.alfredai.bot/book"
                    )}`}
                  >
                    <Mail className="w-4 h-4 mr-2" aria-hidden />
                    Email a teammate
                  </a>
                </Button>
              </div>
            </motion.section>

            {/* Recovery / fallback */}
            <div className="mt-10 text-center text-sm text-muted-foreground">
              Something not right?{" "}
              <a
                href={`mailto:hello@alfredai.bot?subject=${encodeURIComponent(
                  "Booking issue"
                )}&body=${encodeURIComponent(
                  `I just booked but ran into an issue.\n\nPage: ${typeof window !== "undefined" ? window.location.href : "/booked"}\n\nDetails:`
                )}`}
                className="text-primary underline underline-offset-4"
              >
                Email us with a screenshot
              </a>{" "}
              and we'll sort it within one business day.
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BookingConfirmationPage;
