import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  darkHero?: boolean;
}

export function Navbar({ darkHero = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location, setLocation] = useLocation();

  const useLight = darkHero && !scrolled;

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
    { name: "CARM Calculator", href: "/carm-security-calculator" },
    { name: "Customs Calculator", href: "/customs-calculator" },
    { name: "Non-Residents", href: "/#non-resident" },
    { name: "FAQ", href: "/#faq" },
    { name: "Contact", href: "/#contact" },
  ];

  const isHome = location === "/";

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - navHeight, behavior: "smooth" });
    }
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("/#")) {
      const id = href.split("#")[1];
      if (isHome) {
        setTimeout(() => scrollToSection(id), 350);
      } else {
        setLocation("/");
        setTimeout(() => scrollToSection(id), 500);
      }
    } else if (href.startsWith("/")) {
      setLocation(href);
      window.scrollTo({ top: 0 });
    }
  };

  const handlePortalClick = () => {
    setIsOpen(false);
    setLocation("/portal");
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
          <Link href="/" className="flex items-center space-x-2 group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-primary p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className={`text-xl font-extrabold tracking-tight transition-colors duration-300 ${useLight ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}>
              AccessToNorth<span className={useLight ? "text-white/80" : "text-primary"}>.com</span>
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
                className={`text-sm font-medium transition-colors cursor-pointer ${useLight ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-primary'}`}
                data-testid={`nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.name}
              </a>
            ))}
            <Button
              variant="outline"
              className={`cursor-pointer ${useLight ? 'border-white/30 text-white' : 'border-primary/20 text-primary'}`}
              onClick={handlePortalClick}
              data-testid="button-check-status"
            >
              Check Status
            </Button>
            <Button 
              className={`shadow-lg cursor-pointer ${useLight ? 'bg-white text-slate-900 shadow-black/10' : 'bg-primary shadow-primary/20'}`}
              onClick={() => handleNavClick("/#pricing")}
              data-testid="button-register-now"
            >
              Register Now
            </Button>
          </div>

          <button
            className={`md:hidden cursor-pointer ${useLight ? 'text-white' : 'text-slate-700'}`}
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
                  className="text-base font-medium text-slate-600 hover:text-primary cursor-pointer"
                  data-testid={`mobile-nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {link.name}
                </a>
              ))}
              <hr className="border-slate-100" />
              <Button
                variant="outline"
                className="w-full justify-start cursor-pointer"
                onClick={handlePortalClick}
                data-testid="button-mobile-check-status"
              >
                Client Portal
              </Button>
              <Button
                className="w-full cursor-pointer"
                onClick={() => handleNavClick("/#pricing")}
                data-testid="button-mobile-register"
              >
                Start Registration
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
