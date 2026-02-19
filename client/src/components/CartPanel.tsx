import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";

export function CartPanel() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const [, setLocation] = useLocation();

  const handleCheckout = () => {
    setIsOpen(false);
    setLocation("/canadian-customs-clearance/checkout");
    window.scrollTo({ top: 0 });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md" data-testid="cart-panel">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2" data-testid="cart-title">
            <ShoppingCart className="w-5 h-5" />
            Your Cart
          </SheetTitle>
          <SheetDescription>Customs clearance services</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500" data-testid="text-cart-empty">Your cart is empty</p>
              <p className="text-xs text-slate-400 mt-1">Add a clearance package or service to get started.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-3 mt-2" data-testid="cart-items-list">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                  data-testid={`cart-item-${item.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                      <Badge
                        variant="secondary"
                        className="no-default-hover-elevate no-default-active-elevate text-[10px] px-1.5 py-0"
                      >
                        {item.category === "package" ? "Package" : "Add-on"}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {item.priceLabel} CAD
                      {item.quantity > 1 && (
                        <span className="text-xs text-slate-400 font-normal ml-1">
                          x{item.quantity}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.category === "addon" && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-5 text-center" data-testid={`qty-${item.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-400"
                      onClick={() => removeItem(item.id)}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Subtotal</span>
                <span className="text-lg font-bold text-slate-900" data-testid="text-subtotal">
                  ${subtotal.toLocaleString()} CAD
                </span>
              </div>
              <Button
                className="w-full cursor-pointer"
                onClick={handleCheckout}
                data-testid="button-proceed-checkout"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="ghost"
                className="w-full cursor-pointer text-slate-400"
                onClick={clearCart}
                data-testid="button-clear-cart"
              >
                Clear Cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
