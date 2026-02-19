import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6" data-testid="breadcrumbs">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-slate-500">
        <li>
          <Link href="/" className="hover:text-primary transition-colors" data-testid="breadcrumb-home">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {item.href ? (
              <Link href={item.href} className="hover:text-primary transition-colors" data-testid={`breadcrumb-${i}`}>
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-700 font-medium" data-testid={`breadcrumb-${i}`}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
