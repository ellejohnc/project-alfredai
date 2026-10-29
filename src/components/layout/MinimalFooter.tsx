import { memo } from "react";
import { Link } from "react-router-dom";
import alfredLogo from "@/assets/alfred-ai-white-mid.png";

export const MinimalFooter = memo(function MinimalFooter() {
  return (
    <footer className="bg-[hsl(220,25%,8%)] text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={alfredLogo} 
              alt="alfred ai" 
              className="h-6 w-auto flex-shrink-0 object-contain"
              loading="lazy"
              decoding="async"
            />
          </Link>

          {/* Copyright */}
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} alfred ai. All rights reserved.
          </p>

          {/* Essential Links */}
          <div className="flex items-center gap-4 text-xs text-white/50">
            <Link to="/admin" className="hover:text-white transition-colors">
              Admin
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default MinimalFooter;
