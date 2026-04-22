"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const BRAND_STORAGE_KEY = "management-stock-brands";
const HIDDEN_BRAND_STORAGE_KEY = "management-hidden-stock-brands";

type ProductSummary = {
  brand?: string | null;
};

const normalizeBrand = (value: string) => value.trim().replace(/\s+/g, " ");

const dedupeBrands = (brands: string[]) => {
  const seen = new Set<string>();

  return brands
    .map(normalizeBrand)
    .filter(Boolean)
    .filter((brand) => {
      const key = brand.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
};

const loadStoredBrands = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BRAND_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? dedupeBrands(parsed) : [];
  } catch (error) {
    console.error("Unable to read stored brands", error);
    return [];
  }
};

const saveStoredBrands = (brands: string[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(dedupeBrands(brands)));
};

const loadHiddenBrands = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HIDDEN_BRAND_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? dedupeBrands(parsed) : [];
  } catch (error) {
    console.error("Unable to read hidden brands", error);
    return [];
  }
};

const saveHiddenBrands = (brands: string[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    HIDDEN_BRAND_STORAGE_KEY,
    JSON.stringify(dedupeBrands(brands))
  );
};

async function fetchProductBrands() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const payload = await response.json().catch(() => null);
  const products = payload?.data;

  if (!response.ok || !Array.isArray(products)) {
    throw new Error(payload?.message || "Failed to load brands");
  }

  return dedupeBrands(
    (products as ProductSummary[]).map((product) => product.brand ?? "")
  );
}

type BrandComboboxProps = {
  value: string;
  onChange: (value: string) => void;
};

export function BrandCombobox({ value, onChange }: BrandComboboxProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [hiddenBrands, setHiddenBrands] = useState<string[]>([]);
  const [draftBrand, setDraftBrand] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrateBrands = async () => {
      const storedBrands = loadStoredBrands();
      const localHiddenBrands = loadHiddenBrands();
      const currentBrand = normalizeBrand(value);
      const visibleStoredBrands = storedBrands.filter(
        (brand) =>
          !localHiddenBrands.some(
            (hiddenBrand) =>
              hiddenBrand.toLocaleLowerCase() === brand.toLocaleLowerCase()
          )
      );

      if (!cancelled) {
        setHiddenBrands(localHiddenBrands);
        setBrandOptions(dedupeBrands([...visibleStoredBrands, currentBrand]));
      }

      try {
        const remoteBrands = await fetchProductBrands();
        if (cancelled) return;

        setBrandOptions(
          dedupeBrands(
            [...remoteBrands, ...visibleStoredBrands, currentBrand].filter(
              (brand) =>
                !localHiddenBrands.some(
                  (hiddenBrand) =>
                    hiddenBrand.toLocaleLowerCase() === brand.toLocaleLowerCase()
                )
            )
          )
        );
      } catch (error) {
        console.error("Failed to fetch brands", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    hydrateBrands();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const currentBrand = normalizeBrand(value);
    if (!currentBrand) return;

    setBrandOptions((prev) => {
      if (
        hiddenBrands.some(
          (hiddenBrand) =>
            hiddenBrand.toLocaleLowerCase() === currentBrand.toLocaleLowerCase()
        )
      ) {
        return prev;
      }

      return dedupeBrands([...prev, currentBrand]);
    });
  }, [hiddenBrands, value]);

  const selectedBrand = useMemo(() => normalizeBrand(value), [value]);

  const handleSelectBrand = (brand: string) => {
    onChange(brand);
    setOpen(false);
  };

  const handleDeleteBrand = (brandToDelete: string) => {
    const nextHiddenBrands = dedupeBrands([...hiddenBrands, brandToDelete]);
    const nextBrandOptions = brandOptions.filter(
      (brand) => brand.toLocaleLowerCase() !== brandToDelete.toLocaleLowerCase()
    );
    const nextStoredBrands = loadStoredBrands().filter(
      (brand) => brand.toLocaleLowerCase() !== brandToDelete.toLocaleLowerCase()
    );

    setHiddenBrands(nextHiddenBrands);
    setBrandOptions(nextBrandOptions);
    saveStoredBrands(nextStoredBrands);
    saveHiddenBrands(nextHiddenBrands);

    if (selectedBrand.toLocaleLowerCase() === brandToDelete.toLocaleLowerCase()) {
      onChange("");
    }
  };

  const handleSaveNewBrand = () => {
    const nextBrand = normalizeBrand(draftBrand);

    if (!nextBrand) {
      setDialogError("Please enter a brand name");
      return;
    }

    const matchedBrand = brandOptions.find(
      (brand) => brand.toLocaleLowerCase() === nextBrand.toLocaleLowerCase()
    );

    const finalBrand = matchedBrand ?? nextBrand;
    const nextOptions = dedupeBrands([...brandOptions, finalBrand]);
    const nextHiddenBrands = hiddenBrands.filter(
      (brand) => brand.toLocaleLowerCase() !== finalBrand.toLocaleLowerCase()
    );

    setBrandOptions(nextOptions);
    setHiddenBrands(nextHiddenBrands);
    saveStoredBrands(nextOptions);
    saveHiddenBrands(nextHiddenBrands);
    onChange(finalBrand);
    setDraftBrand("");
    setDialogError("");
    setDialogOpen(false);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedBrand || (loading ? "Loading brands..." : "Select brand")}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search brand..." />
            <CommandList>
              <CommandEmpty>No brand found.</CommandEmpty>
              <CommandGroup heading="Brands">
                {brandOptions.map((brand) => (
                  <CommandItem
                    key={brand}
                    value={brand}
                    onSelect={() => handleSelectBrand(brand)}
                    className="justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedBrand === brand ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{brand}</span>
                    </div>

                    <button
                      type="button"
                      aria-label={`Delete ${brand}`}
                      className="text-muted-foreground hover:text-red-600"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDeleteBrand(brand);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup>
                <CommandItem
                  value="create-new-brand"
                  onSelect={() => {
                    setOpen(false);
                    setDraftBrand("");
                    setDialogError("");
                    setDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create new brand
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Brand</DialogTitle>
            <DialogDescription>
              Add a new brand option, then select it back in the product form.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              value={draftBrand}
              onChange={(event) => {
                setDraftBrand(event.target.value);
                if (dialogError) setDialogError("");
              }}
              placeholder="Enter new brand"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSaveNewBrand();
                }
              }}
            />
            {dialogError ? (
              <p className="text-sm text-red-600">{dialogError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setDialogError("");
                setDraftBrand("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveNewBrand}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
