"use client";

import { useState } from "react";

// RHF
import { useFormContext } from "react-hook-form";

// Components
import { FormInput, Subheading, BaseButton, SavedPaymentInfoModal } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Variables
import { LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY, SHORT_DATE_OPTIONS } from "@/lib/variables";

// Hooks
import useToasts from "@/hooks/useToasts";

// Types
import { InvoiceType } from "@/types";

// Icons
import { Save, FolderOpen } from "lucide-react";

type PaymentInfoType = {
    id: string;
    name: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban?: string;
    swiftCode?: string;
    savedAt: string;
};

const PaymentInformation = () => {
    const { _t } = useTranslationContext();
    const { setValue, watch } = useFormContext<InvoiceType>();
    const { saveInvoiceSuccess } = useToasts();
    const [saveName, setSaveName] = useState("");

    const paymentInfo = watch("details.paymentInformation");

    const handleSave = () => {
        if (!paymentInfo?.bankName || !paymentInfo?.accountName || !paymentInfo?.accountNumber) {
            alert("Please fill in at least Bank Name, Account Name, and Account Number before saving.");
            return;
        }

        const name = saveName.trim() || `${paymentInfo.bankName} - ${paymentInfo.accountName}`;
        
        const savedAt = new Date().toLocaleDateString("en-US", SHORT_DATE_OPTIONS);
        
        const newPaymentInfo: PaymentInfoType = {
            id: Date.now().toString(),
            name: name,
            bankName: paymentInfo.bankName || "",
            accountName: paymentInfo.accountName || "",
            accountNumber: paymentInfo.accountNumber || "",
            iban: paymentInfo.iban || "",
            swiftCode: paymentInfo.swiftCode || "",
            savedAt: savedAt,
        };

        if (typeof window !== "undefined") {
            const saved = window.localStorage.getItem(LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY);
            const savedList: PaymentInfoType[] = saved ? JSON.parse(saved) : [];
            savedList.push(newPaymentInfo);
            window.localStorage.setItem(
                LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY,
                JSON.stringify(savedList)
            );
            saveInvoiceSuccess();
            setSaveName("");
        }
    };

    const handleLoad = (paymentInfo: PaymentInfoType) => {
        setValue("details.paymentInformation", {
            bankName: paymentInfo.bankName,
            accountName: paymentInfo.accountName,
            accountNumber: paymentInfo.accountNumber,
            iban: paymentInfo.iban || "",
            swiftCode: paymentInfo.swiftCode || "",
        });
    };

    return (
        <section>
            <div className="flex justify-between items-center mb-2">
                <Subheading>{_t("form.steps.paymentInfo.heading")}:</Subheading>
                <div className="flex gap-2">
                    <SavedPaymentInfoModal onLoad={handleLoad}>
                        <BaseButton
                            variant="outline"
                            size="sm"
                            tooltipLabel="Load saved payment information"
                        >
                            <FolderOpen className="w-4 h-4" />
                            Load Saved
                        </BaseButton>
                    </SavedPaymentInfoModal>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Save as..."
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            className="px-3 py-1 text-sm border rounded-md w-32"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSave();
                                }
                            }}
                        />
                        <BaseButton
                            variant="outline"
                            size="sm"
                            onClick={handleSave}
                            tooltipLabel="Save current payment information"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </BaseButton>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-10 mt-5">
                <FormInput
                    name="details.paymentInformation.bankName"
                    label={_t("form.steps.paymentInfo.bankName")}
                    placeholder={_t("form.steps.paymentInfo.bankName")}
                    vertical
                />
                <FormInput
                    name="details.paymentInformation.accountName"
                    label={_t("form.steps.paymentInfo.accountName")}
                    placeholder={_t("form.steps.paymentInfo.accountName")}
                    vertical
                />
                <FormInput
                    name="details.paymentInformation.accountNumber"
                    label={_t("form.steps.paymentInfo.accountNumber")}
                    placeholder={_t("form.steps.paymentInfo.accountNumber")}
                    vertical
                />
                <FormInput
                    name="details.paymentInformation.iban"
                    label="IBAN No"
                    placeholder="IBAN Number"
                    vertical
                />
                <FormInput
                    name="details.paymentInformation.swiftCode"
                    label="SWIFT Code"
                    placeholder="SWIFT Code"
                    vertical
                />
            </div>
        </section>
    );
};

export default PaymentInformation;
