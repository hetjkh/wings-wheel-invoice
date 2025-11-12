"use client";

import React, { useEffect } from "react";

// RHF
import { FormProvider, useForm } from "react-hook-form";

// Zod
import { zodResolver } from "@hookform/resolvers/zod";

// Schema
import { InvoiceSchema } from "@/lib/schemas";

// Context
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { InvoiceContextProvider } from "@/contexts/InvoiceContext";
import { ChargesContextProvider } from "@/contexts/ChargesContext";

// Types
import { InvoiceType } from "@/types";

// Variables
import {
  FORM_DEFAULT_VALUES,
  LOCAL_STORAGE_INVOICE_DRAFT_KEY,
} from "@/lib/variables";

// Helpers
const readDraftFromLocalStorage = (): InvoiceType | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_INVOICE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // revive dates
    if (parsed?.details) {
      if (parsed.details.invoiceDate)
        parsed.details.invoiceDate = new Date(parsed.details.invoiceDate);
      if (parsed.details.dueDate)
        parsed.details.dueDate = new Date(parsed.details.dueDate);
      else
        // Remove dueDate if it doesn't exist
        delete parsed.details.dueDate;
    }
    return parsed;
  } catch {
    return null;
  }
};

type ProvidersProps = {
  children: React.ReactNode;
};

const Providers = ({ children }: ProvidersProps) => {
  const form = useForm<InvoiceType>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  });

  // Hydrate once on mount
  useEffect(() => {
    const draft = readDraftFromLocalStorage();
    if (draft) {
      // Always use the default sender values and logo, but keep other draft data
      const mergedDraft = {
        ...draft,
        sender: FORM_DEFAULT_VALUES.sender,
        details: {
          ...draft.details,
          // Use default logo if draft doesn't have one or if it's empty
          invoiceLogo: (draft.details?.invoiceLogo && draft.details.invoiceLogo.trim() !== "") 
            ? draft.details.invoiceLogo 
            : FORM_DEFAULT_VALUES.details.invoiceLogo,
        },
      };
      form.reset(mergedDraft, { keepDefaultValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TranslationProvider>
        <FormProvider {...form}>
          <InvoiceContextProvider>
            <ChargesContextProvider>{children}</ChargesContextProvider>
          </InvoiceContextProvider>
        </FormProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
};

export default Providers;
