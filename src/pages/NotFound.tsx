import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      <Helmet>
        <title>Page not found (404) | alfred ai</title>
        <meta name="description" content="The page you're looking for doesn't exist. Head back to alfred ai to explore agentic AI for construction." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="text-center relative z-10">
        <h1 className="mb-4 text-6xl font-bold text-gradient-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary-hover transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
