import { motion } from "framer-motion";
import { CheckCircle2, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DataSource } from "./types";

interface DataSourcesStepProps {
  dataSources: DataSource[];
  onToggleSource: (id: string) => void;
}

export default function DataSourcesStep({ dataSources, onToggleSource }: DataSourcesStepProps) {
  const selectedCount = dataSources.filter(s => s.selected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="w-4 h-4" />
          Select data sources to include in report
        </div>
        <Badge variant="secondary" className="text-xs">
          {selectedCount} selected
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dataSources.map((source, index) => {
          const Icon = source.icon;
          return (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all min-h-[88px] ${
                  source.selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "hover:border-primary/50 hover:bg-muted/30"
                }`}
                onClick={() => onToggleSource(source.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        source.selected
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {source.name}
                        </h4>
                        {source.selected && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {source.description}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-1.5">
                        {source.recordCount.toLocaleString()} records
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-muted-foreground pt-2"
        >
          Click next to start AI data extraction
        </motion.div>
      )}
    </motion.div>
  );
}
