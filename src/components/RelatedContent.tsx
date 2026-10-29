import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Book, BookOpen, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LazyImage from "@/components/ui/lazy-image";
import { type RelatedContentItem } from "@/hooks/useRelatedContent";

interface RelatedContentProps {
  items: RelatedContentItem[];
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
}

const typeConfig = {
  blog: {
    icon: FileText,
    label: 'Article',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  guide: {
    icon: Book,
    label: 'Guide',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  documentation: {
    icon: BookOpen,
    label: 'Docs',
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  'beginner': { label: 'Beginner', color: 'bg-emerald-500/10 text-emerald-600' },
  'intermediate': { label: 'Intermediate', color: 'bg-amber-500/10 text-amber-600' },
  'advanced': { label: 'Advanced', color: 'bg-rose-500/10 text-rose-600' },
};

export function RelatedContent({
  items,
  title = "Related Content",
  subtitle,
  columns = 3,
}: RelatedContentProps) {
  if (items.length === 0) return null;

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>
          
          <div className={`grid gap-6 ${gridCols[columns]}`}>
            {items.map((item, index) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              const difficulty = item.difficulty ? difficultyConfig[item.difficulty.toLowerCase()] : null;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    to={item.url}
                    className="group block bg-background rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all h-full"
                  >
                    {/* Header with type badge and icon */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={`text-xs ${config.color}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                    </div>

                    {/* Image (if available) */}
                    {item.imageUrl && (
                      <div className="relative mb-4 overflow-hidden rounded-lg aspect-video">
                        <LazyImage
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          wrapperClassName="w-full h-full"
                          placeholderColor="bg-muted"
                        />
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.description}
                      </p>
                    )}

                    {/* Metadata footer */}
                    <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border/50">
                      {difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${difficulty.color}`}>
                          {difficulty.label}
                        </span>
                      )}
                      {item.readTime && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {item.readTime} min
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default RelatedContent;
