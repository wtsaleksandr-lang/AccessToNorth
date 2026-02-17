import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Services", href: "/#services" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Non-Residents", href: "/#non-resident" },
    { name: "FAQ", href: "/#faq" },
    { name: "Contact", href: "/#contact" },
  ];

  const isHome = location === "/";

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("/#")) {
      const id = href.split("#")[1];
      if (isHome) {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        window.location.href = href;
      }
    }
  };

  return (
    <nav
      data-testid="navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-primary p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className={`text-xl font-bold font-display tracking-tight ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>
              AccessToNorth<span className="text-primary">.com</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                data-testid={`nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.name}
              </a>
            ))}
            <Link href="/portal">
              <Button variant="outline" className="border-primary/20 hover:bg-primary/5 text-primary" data-testid="button-check-status">
                Check Status
              </Button>
            </Link>
            <Button 
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={() => handleNavClick("/#pricing")}
              data-testid="button-register-now"
            >
              Register Now
            </Button>
          </div>

          <button
            className="md:hidden text-slate-700"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t mt-4"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className="text-base font-medium text-slate-600 hover:text-primary"
                >
                  {link.name}
                </a>
              ))}
              <hr className="border-slate-100" />
              <Link href="/portal">
                <Button variant="outline" className="w-full justify-start">
                  Client Portal
                </Button>
              </Link>
              <Button className="w-full" onClick={() => handleNavClick("/#pricing")}>
                Start Registration
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
