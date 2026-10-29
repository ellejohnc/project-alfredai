import { getProductBySlug } from "@/data/products";

export interface ProductSchemaInput {
  name: string;
  description: string;
  category?: string;
  features?: string[];
}

/**
 * Builds Product structured-data input for the SEO component from the shared
 * product catalogue. Falls back to a safe minimal object if the slug is unknown,
 * so pages never break when a product is renamed or removed.
 */
export const productSchemaFor = (slug: string): ProductSchemaInput => {
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      name: "alfred ai",
      description:
        "alfred ai builds and delivers agentic AI systems for construction and mid-market businesses.",
      category: "BusinessApplication",
    };
  }

  return {
    name: product.name,
    description: product.description || product.intro,
    category: "BusinessApplication",
    features: product.features?.map((f) => f.title).filter(Boolean),
  };
};
