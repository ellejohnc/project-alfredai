import { Award, Star } from "lucide-react";
import { motion } from "framer-motion";
import { ComingSoonOverlay } from "@/components/ui/ComingSoonOverlay";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";

const reviewPlatforms = [
  { name: "Capterra", rating: 4.9, reviews: 127 },
  { name: "Software Advice", rating: 4.8, reviews: 94 },
  { name: "GetApp", rating: 4.9, reviews: 156 },
  { name: "G2", rating: 4.7, reviews: 203 },
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={18}
          className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
};

export const ReviewBadgesSection = () => {
  const { isEnabled: showComingSoon } = useFeatureFlag("reviews_coming_soon");

  return (
    <section
      className="py-24 bg-background"
      aria-label="Third-party review platform ratings"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Trusted & Reviewed
          </h2>
          <p className="text-lg text-muted-foreground">
            See What Our Customers Are Saying
          </p>
        </div>

        {/* Wrapper with Coming Soon overlay */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Review cards grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${showComingSoon ? 'pointer-events-none' : ''}`}>
            {reviewPlatforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="glassmorphism-card rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-secondary/5 
                           transition-shadow duration-300 cursor-default"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <Award size={32} className="text-primary" />
                  <h3 className="font-bold text-xl text-foreground">
                    {platform.name}
                  </h3>
                  <StarRating rating={platform.rating} />
                  <span className="text-3xl font-bold text-primary">
                    {platform.rating}/5
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {platform.reviews} reviews
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Reusable Coming Soon Overlay (controlled by feature flag) */}
          {showComingSoon && (
            <ComingSoonOverlay
              message="Reviews Coming Soon..."
              blur="light"
              backgroundOpacity={30}
              fullPage={false}
            />
          )}
        </div>
      </div>
    </section>
  );
};
