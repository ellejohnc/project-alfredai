import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const brands = [
  "Home Plus Group", "Wall Planning", "Wattyl", "WEIR ESCO", "WSP", "The Law Courts",
  "TAFE NSW", "Tom Foolery", "St Helena", "Strukton Rail", "KLW",
  "TIADA", "SGS", "Swoosh Technologies", "Sharda University", "HOBSON", "CENTRL",
  "Sydney Energy Institute", "Smart Ads", "St Brigid's", "RoofXPro", "Salesian College", "iF", "bild.",
  "Scouts Victoria", "Queensland Government", "Rollins", "HATCH", "Bleuwave",
  "O'Keefe", "Monsta", "Optum", "PG Integrated", "H★MEBY5", "Australian Islamic College",
  "Mint Construct", "M GROUP", "Leisure Focus", "Lending Automator", "LHH", "iseekplant", "hostadvice.",
  "MORSE GROUP", "KBR", "LISAM", "HYECORP", "Grand Canyon University", "BIGHEAD DIGITAL",
  "Malek Fahd Islamic School", "HALO", "EPOKA", "Fronted",
  "go autonomous", "E-WEB Marketing", "EMMAUS", "EHT", "DUNSTEEL",
  "Estaniel Enterprises", "ENGAGE Construction", "EMPOWER U", "Elevate Sales",
  "Easy 7 IB Sciences", "Calrossy Anglican School", "Elevate", "Allina Health",
  "Crédit Agricole", "ALMANAC Hotels", "AVPM", "Allen&Hoshall"
];

const BrandsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-16 md:py-24 bg-background overflow-hidden">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Brands On Our Platform
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto" />
        </motion.div>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* First row - scrolls left */}
        <div className="flex mb-4 overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              x: {
                duration: 40,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          >
            {[...brands.slice(0, 34), ...brands.slice(0, 34)].map((brand, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 px-5 py-3 bg-card border border-border rounded-lg hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {brand}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Second row - scrolls right */}
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{ x: ["-50%", "0%"] }}
            transition={{
              x: {
                duration: 45,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          >
            {[...brands.slice(34), ...brands.slice(34)].map((brand, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 px-5 py-3 bg-card border border-border rounded-lg hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {brand}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;
