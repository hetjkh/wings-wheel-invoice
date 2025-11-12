"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

// RHF
import { useFormContext } from "react-hook-form";

// Hooks
import useToasts from "@/hooks/useToasts";
import { useAuth } from "@/contexts/AuthContext";

// ShadCn
import { toast } from "@/components/ui/use-toast";

// Services
import { exportInvoice } from "@/services/invoice/client/exportInvoice";
import { saveFileToDirectory } from "@/services/invoice/client/downloadToDirectory";

// Variables
import {
  FORM_DEFAULT_VALUES,
  GENERATE_PDF_API,
  SEND_PDF_API,
  SHORT_DATE_OPTIONS,
  LOCAL_STORAGE_INVOICE_DRAFT_KEY,
} from "@/lib/variables";

// Helpers
import { getNextInvoiceNumber } from "@/lib/helpers";

// Types
import { ExportTypes, InvoiceType } from "@/types";

const defaultInvoiceContext = {
  invoicePdf: new Blob(),
  invoicePdfLoading: false,
  savedInvoices: [] as InvoiceType[],
  pdfUrl: null as string | null,
  onFormSubmit: (values: InvoiceType) => {},
  newInvoice: () => {},
  generatePdf: async (data: InvoiceType) => {},
  removeFinalPdf: () => {},
  downloadPdf: async () => {},
  printPdf: () => {},
  previewPdfInTab: () => {},
  saveInvoice: () => {},
  deleteInvoice: (index: number) => {},
  sendPdfToMail: (email: string): Promise<void> => Promise.resolve(),
  exportInvoiceAs: (exportAs: ExportTypes) => {},
  importInvoice: (file: File) => {},
};

export const InvoiceContext = createContext(defaultInvoiceContext);

export const useInvoiceContext = () => {
  return useContext(InvoiceContext);
};

type InvoiceContextProviderProps = {
  children: React.ReactNode;
};

export const InvoiceContextProvider = ({
  children,
}: InvoiceContextProviderProps) => {
  const router = useRouter();
  const { user } = useAuth();

  // Toasts
  const {
    newInvoiceSuccess,
    pdfGenerationSuccess,
    saveInvoiceSuccess,
    modifiedInvoiceSuccess,
    sendPdfSuccess,
    sendPdfError,
    importInvoiceError,
    downloadSuccess,
  } = useToasts();

  // Get form values and methods from form context
  const { getValues, reset, watch, setValue } = useFormContext<InvoiceType>();

  // Variables
  const [invoicePdf, setInvoicePdf] = useState<Blob>(new Blob());
  const [invoicePdfLoading, setInvoicePdfLoading] = useState<boolean>(false);

  // Saved invoices
  const [savedInvoices, setSavedInvoices] = useState<InvoiceType[]>([]);

  // Load invoices from database or localStorage
  useEffect(() => {
    const loadInvoices = async () => {
      if (user) {
        // Load from database
        try {
          const response = await fetch("/api/invoice/list");
          if (response.ok) {
            const data = await response.json();
            setSavedInvoices(data.invoices || []);
          } else {
            setSavedInvoices([]);
          }
        } catch (error) {
          console.error("Error loading invoices:", error);
          setSavedInvoices([]);
        }
      } else {
        // Load from localStorage
        if (typeof window !== "undefined") {
          const savedInvoicesJSON = window.localStorage.getItem("savedInvoices");
          const savedInvoicesDefault = savedInvoicesJSON
            ? JSON.parse(savedInvoicesJSON)
            : [];
          setSavedInvoices(savedInvoicesDefault);
        }
      }
    };

    loadInvoices();
  }, [user]);

  // Persist full form state with debounce
  useEffect(() => {
    if (typeof window === "undefined") return;
    const subscription = watch((value) => {
      try {
        window.localStorage.setItem(
          LOCAL_STORAGE_INVOICE_DRAFT_KEY,
          JSON.stringify(value)
        );
      } catch {}
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Get pdf url from blob
  const pdfUrl = useMemo(() => {
    if (invoicePdf.size > 0) {
      return window.URL.createObjectURL(invoicePdf);
    }
    return null;
  }, [invoicePdf]);

  /**
   * Handles form submission.
   *
   * @param {InvoiceType} data - The form values used to generate the PDF.
   */
  const onFormSubmit = (data: InvoiceType) => {
    console.log("VALUE");
    console.log(data);

    // Call generate pdf method
    generatePdf(data);
  };

  /**
   * Generates a new invoice.
   */
  const newInvoice = () => {
    // Get the next invoice number
    const nextInvoiceNumber = getNextInvoiceNumber();
    
    // Reset form with default values and set the new invoice number
    const defaultValuesWithInvoiceNumber = {
      ...FORM_DEFAULT_VALUES,
      details: {
        ...FORM_DEFAULT_VALUES.details,
        invoiceNumber: nextInvoiceNumber,
      },
    };
    
    reset(defaultValuesWithInvoiceNumber);
    setInvoicePdf(new Blob());

    // Clear the draft
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_INVOICE_DRAFT_KEY);
      } catch {}
    }

    router.refresh();

    // Toast
    newInvoiceSuccess();
  };

  /**
   * Generate a PDF document based on the provided data.
   *
   * @param {InvoiceType} data - The data used to generate the PDF.
   * @returns {Promise<void>} - A promise that resolves when the PDF is successfully generated.
   * @throws {Error} - If an error occurs during the PDF generation process.
   */
  const generatePdf = useCallback(async (data: InvoiceType) => {
    setInvoicePdfLoading(true);

    try {
      const response = await fetch(GENERATE_PDF_API, {
        method: "POST",
        body: JSON.stringify(data),
      });

      const result = await response.blob();
      setInvoicePdf(result);

      if (result.size > 0) {
        // Toast
        pdfGenerationSuccess();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setInvoicePdfLoading(false);
    }
  }, []);

  /**
   * Removes the final PDF file and switches to Live Preview
   */
  const removeFinalPdf = () => {
    setInvoicePdf(new Blob());
  };

  /**
   * Generates a preview of a PDF file and opens it in a new browser tab.
   */
  const previewPdfInTab = () => {
    if (invoicePdf) {
      const url = window.URL.createObjectURL(invoicePdf);
      window.open(url, "_blank");
    }
  };

  /**
   * Downloads a PDF file.
   */
  const downloadPdf = async () => {
    // Only download if there is an invoice
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      // Get invoice number from form values
      const formValues = getValues();
      const invoiceNumber = formValues.details.invoiceNumber || "invoice";
      // Sanitize filename (remove invalid characters)
      const sanitizedInvoiceNumber = invoiceNumber.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const filename = `${sanitizedInvoiceNumber}.pdf`;
      
      // Try to save to preferred directory first
      const saved = await saveFileToDirectory(invoicePdf, filename);
      
      if (!saved) {
        // Fallback to default browser download
        const url = window.URL.createObjectURL(invoicePdf);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      // Show success message
      downloadSuccess(invoiceNumber || undefined);
    }
  };

  /**
   * Prints a PDF file.
   */
  const printPdf = () => {
    if (invoicePdf) {
      const pdfUrl = URL.createObjectURL(invoicePdf);
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // TODO: Change function name. (saveInvoiceData maybe?)
  /**
   * Saves the invoice data to database (if logged in) or local storage.
   */
  const saveInvoice = async () => {
    if (invoicePdf) {
      // If get values function is provided, allow to save the invoice
      if (getValues) {
        const formValues = getValues();
        const updatedDate = new Date().toLocaleDateString(
          "en-US",
          SHORT_DATE_OPTIONS
        );
        formValues.details.updatedAt = updatedDate;

        if (user) {
          // Save to database
          try {
            const response = await fetch("/api/invoice/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formValues),
            });

            if (response.ok) {
              const data = await response.json();
              
              // Check if invoice already existed
              const existingInvoiceIndex = savedInvoices.findIndex(
                (invoice: InvoiceType) => {
                  return (
                    invoice.details.invoiceNumber === formValues.details.invoiceNumber
                  );
                }
              );

              if (existingInvoiceIndex !== -1) {
                // Update in local state
                const updated = [...savedInvoices];
                updated[existingInvoiceIndex] = formValues;
                setSavedInvoices(updated);
                modifiedInvoiceSuccess();
              } else {
                // Add to local state
                setSavedInvoices([...savedInvoices, formValues]);
                saveInvoiceSuccess();
              }
            } else {
              const error = await response.json();
              console.error("Save error:", error);
              toast({
                variant: "destructive",
                title: "Save failed",
                description: error.error || "Could not save invoice",
              });
            }
          } catch (error) {
            console.error("Save error:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to save invoice. Please try again.",
            });
          }
        } else {
          // Save to localStorage
          const savedInvoicesJSON = localStorage.getItem("savedInvoices");
          const savedInvoices = savedInvoicesJSON
            ? JSON.parse(savedInvoicesJSON)
            : [];

          const existingInvoiceIndex = savedInvoices.findIndex(
            (invoice: InvoiceType) => {
              return (
                invoice.details.invoiceNumber === formValues.details.invoiceNumber
              );
            }
          );

          // If invoice already exists
          if (existingInvoiceIndex !== -1) {
            savedInvoices[existingInvoiceIndex] = formValues;
            modifiedInvoiceSuccess();
          } else {
            // Add the form values to the array
            savedInvoices.push(formValues);
            saveInvoiceSuccess();
          }

          localStorage.setItem("savedInvoices", JSON.stringify(savedInvoices));
          setSavedInvoices(savedInvoices);
        }
      }
    }
  };

  // TODO: Change function name. (deleteInvoiceData maybe?)
  /**
   * Delete an invoice from database (if logged in) or local storage.
   *
   * @param {number} index - The index of the invoice to be deleted.
   */
  const deleteInvoice = async (index: number) => {
    if (index >= 0 && index < savedInvoices.length) {
      const invoice = savedInvoices[index];
      
      if (user && (invoice as any).id) {
        // Delete from database
        try {
          const response = await fetch(`/api/invoice/${(invoice as any).id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            // Remove from local state
            const updatedInvoices = [...savedInvoices];
            updatedInvoices.splice(index, 1);
            setSavedInvoices(updatedInvoices);
          } else {
            const error = await response.json();
            toast({
              variant: "destructive",
              title: "Delete failed",
              description: error.error || "Could not delete invoice",
            });
          }
        } catch (error) {
          console.error("Delete error:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete invoice. Please try again.",
          });
        }
      } else {
        // Delete from localStorage
        const updatedInvoices = [...savedInvoices];
        updatedInvoices.splice(index, 1);
        setSavedInvoices(updatedInvoices);

        const updatedInvoicesJSON = JSON.stringify(updatedInvoices);
        localStorage.setItem("savedInvoices", updatedInvoicesJSON);
      }
    }
  };

  /**
   * Send the invoice PDF to the specified email address.
   *
   * @param {string} email - The email address to which the Invoice PDF will be sent.
   * @returns {Promise<void>} A promise that resolves once the email is successfully sent.
   */
  const sendPdfToMail = (email: string) => {
    const fd = new FormData();
    fd.append("email", email);
    fd.append("invoicePdf", invoicePdf, "invoice.pdf");
    fd.append("invoiceNumber", getValues().details.invoiceNumber);

    return fetch(SEND_PDF_API, {
      method: "POST",
      body: fd,
    })
      .then((res) => {
        if (res.ok) {
          // Successful toast msg
          sendPdfSuccess();
        } else {
          // Error toast msg
          sendPdfError({ email, sendPdfToMail });
        }
      })
      .catch((error) => {
        console.log(error);

        // Error toast msg
        sendPdfError({ email, sendPdfToMail });
      });
  };

  /**
   * Export an invoice in the specified format using the provided form values.
   *
   * This function initiates the export process with the chosen export format and the form data.
   *
   * @param {ExportTypes} exportAs - The format in which to export the invoice.
   */
  const exportInvoiceAs = (exportAs: ExportTypes) => {
    const formValues = getValues();

    // Service to export invoice with given parameters
    exportInvoice(exportAs, formValues);
  };

  /**
   * Import an invoice from a JSON file.
   *
   * @param {File} file - The JSON file to import.
   */
  const importInvoice = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);

        // Parse the dates
        if (importedData.details) {
          if (importedData.details.invoiceDate) {
            importedData.details.invoiceDate = new Date(
              importedData.details.invoiceDate
            );
          }
          if (importedData.details.dueDate) {
            importedData.details.dueDate = new Date(
              importedData.details.dueDate
            );
          } else {
            // Remove dueDate if it doesn't exist
            delete importedData.details.dueDate;
          }
        }

        // Reset form with imported data
        reset(importedData);
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        importInvoiceError();
      }
    };
    reader.readAsText(file);
  };

  return (
    <InvoiceContext.Provider
      value={{
        invoicePdf,
        invoicePdfLoading,
        savedInvoices,
        pdfUrl,
        onFormSubmit,
        newInvoice,
        generatePdf,
        removeFinalPdf,
        downloadPdf,
        printPdf,
        previewPdfInTab,
        saveInvoice,
        deleteInvoice,
        sendPdfToMail,
        exportInvoiceAs,
        importInvoice,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
