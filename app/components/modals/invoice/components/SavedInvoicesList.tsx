"use client";

import React, { useState, useMemo } from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";

// Helpers
import { formatNumberWithCommas } from "@/lib/helpers";

// Variables
import { DATE_OPTIONS, FORM_DEFAULT_VALUES } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

type SavedInvoicesListProps = {
    setModalState: React.Dispatch<React.SetStateAction<boolean>>;
};

const SavedInvoicesList = ({ setModalState }: SavedInvoicesListProps) => {
    const { savedInvoices, onFormSubmit, deleteInvoice } = useInvoiceContext();
    const [searchQuery, setSearchQuery] = useState("");

    const { reset } = useFormContext<InvoiceType>();

    // TODO: Remove "any" from the function below
    // Update fields when selected invoice is changed.
    // ? Reason: The fields don't go through validation when invoice loads
    const updateFields = (selected: any) => {
        // Remove database-specific fields
        if (selected.id) {
            delete selected.id;
        }
        if (selected._id) {
            delete selected._id;
        }
        if (selected.userId) {
            delete selected.userId;
        }
        if (selected.createdAt) {
            delete selected.createdAt;
        }

        // Next 2 lines are so that when invoice loads,
        // the dates won't be in the wrong format
        // ? Selected cannot be of type InvoiceType because of these 2 variables
        if (selected.details.dueDate) {
            selected.details.dueDate = new Date(selected.details.dueDate);
        }
        if (selected.details.invoiceDate) {
            selected.details.invoiceDate = new Date(selected.details.invoiceDate);
        }

        // Use default logo if not present
        if (!selected.details.invoiceLogo || selected.details.invoiceLogo.trim() === "") {
            selected.details.invoiceLogo = FORM_DEFAULT_VALUES.details.invoiceLogo;
        }
        // Use default signature if not present
        if (!selected.details.signature?.data || selected.details.signature.data.trim() === "") {
            selected.details.signature = FORM_DEFAULT_VALUES.details.signature;
        }
    };

    /**
     * Transform date values for next submission
     *
     * @param {InvoiceType} selected - The selected invoice
     */
    const transformDates = (selected: InvoiceType) => {
        if (selected.details.dueDate) {
            selected.details.dueDate = new Date(
                selected.details.dueDate
            ).toLocaleDateString("en-US", DATE_OPTIONS);
        }
        selected.details.invoiceDate = new Date(
            selected.details.invoiceDate
        ).toLocaleDateString("en-US", DATE_OPTIONS);
    };

    /**
     * Loads a given invoice into the form.
     *
     * @param {InvoiceType} selectedInvoice - The selected invoice
     */
    const load = (selectedInvoice: InvoiceType) => {
        if (selectedInvoice) {
            updateFields(selectedInvoice);
            reset(selectedInvoice);
            transformDates(selectedInvoice);

            // Close modal
            setModalState(false);
        }
    };

    /**
     * Loads a given invoice into the form and generates a pdf by submitting the form.
     *
     * @param {InvoiceType} selectedInvoice - The selected invoice
     */
    const loadAndGeneratePdf = (selectedInvoice: InvoiceType) => {
        load(selectedInvoice);

        // Submit form
        onFormSubmit(selectedInvoice);
    };

    // Filter invoices based on search query
    const filteredInvoices = useMemo(() => {
        if (!searchQuery.trim()) {
            return savedInvoices.map((invoice, idx) => ({ invoice, originalIdx: idx }));
        }

        const query = searchQuery.toLowerCase().trim();
        return savedInvoices
            .map((invoice, idx) => ({ invoice, originalIdx: idx }))
            .filter(({ invoice }) => {
                const invoiceNumber = invoice.details.invoiceNumber?.toLowerCase() || "";
                const senderName = invoice.sender.name?.toLowerCase() || "";
                const receiverName = invoice.receiver.name?.toLowerCase() || "";
                
                return (
                    invoiceNumber.includes(query) ||
                    senderName.includes(query) ||
                    receiverName.includes(query)
                );
            });
    }, [savedInvoices, searchQuery]);

    return (
        <>
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search by invoice number, sender name, or receiver name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                />
            </div>
            <div className="flex flex-col gap-5 overflow-y-auto max-h-72">
                {filteredInvoices.map(({ invoice, originalIdx }, idx) => (
                    <Card
                        key={idx}
                        className="p-2 border rounded-sm hover:border-blue-500 hover:shadow-lg cursor-pointer"
                        // onClick={() => handleSelect(invoice)}
                    >
                        <CardContent className="flex justify-between">
                            <div>
                                {/* <FileText /> */}
                                <p className="font-semibold">
                                    Invoice #{invoice.details.invoiceNumber}{" "}
                                </p>
                                <small className="text-gray-500">
                                    Updated at: {invoice.details.updatedAt}
                                </small>

                                <div>
                                    <p>Sender: {invoice.sender.name}</p>
                                    <p>Receiver: {invoice.receiver.name}</p>
                                    <p>
                                        Total:{" "}
                                        <span className="font-semibold">
                                            {formatNumberWithCommas(
                                                Number(
                                                    invoice.details.totalAmount
                                                )
                                            )}{" "}
                                            {invoice.details.currency}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <BaseButton
                                    tooltipLabel="Load invoice details into the form"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => load(invoice)}
                                >
                                    Load
                                </BaseButton>

                                <BaseButton
                                    tooltipLabel="Load invoice and generate PDF"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadAndGeneratePdf(invoice)}
                                >
                                    Load & Generate
                                </BaseButton>
                                {/* Remove Invoice Button */}
                                <BaseButton
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteInvoice(originalIdx);
                                    }}
                                >
                                    Delete
                                </BaseButton>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {savedInvoices.length === 0 && (
                    <div>
                        <p>No saved invoices</p>
                    </div>
                )}

                {savedInvoices.length > 0 && filteredInvoices.length === 0 && (
                    <div>
                        <p>No invoices found matching your search</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default SavedInvoicesList;
