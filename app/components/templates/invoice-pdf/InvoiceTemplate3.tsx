import React from "react";

// Components
import { InvoiceLayout } from "@/app/components";

// Helpers
import { formatNumberWithCommas, isDataUrl } from "@/lib/helpers";
import { DATE_OPTIONS } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

const InvoiceTemplate = (data: InvoiceType) => {
  const { sender, receiver, details } = data;

  const itinerary = details.items || [];

  const renderMultiline = (value?: string) => {
    if (!value) return null;
    return value
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line, index) => (
        <p key={`${line}-${index}`} className="leading-tight">
          {line}
        </p>
      ));
  };

  return (
    <InvoiceLayout data={data}>
      <div className="border border-gray-300 p-6 rounded-xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-6">
          <div className="max-w-xs space-y-2">
            {details.invoiceLogo && (
              <img
                src={details.invoiceLogo}
                width={160}
                height={90}
                alt={`Logo of ${sender.name}`}
              />
            )}
            <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-800">
              {sender.name}
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{sender.address}</p>
              <p>
                {sender.city}, {sender.country} {sender.zipCode}
              </p>
              <p>{sender.email}</p>
              <p>{sender.phone}</p>
            </div>
          </div>

          <div className="text-right space-y-2">
            <h2 className="text-3xl font-semibold tracking-wide text-gray-900">
              Travel Invoice
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium text-gray-800">Invoice #:</span>{" "}
                {details.invoiceNumber}
              </p>
              <p>
                <span className="font-medium text-gray-800">Issued:</span>{" "}
                {details.invoiceDate
                  ? new Date(details.invoiceDate).toLocaleDateString(
                      "en-US",
                      DATE_OPTIONS
                    )
                  : "-"}
              </p>
              <p>
                <span className="font-medium text-gray-800">Due:</span>{" "}
                {details.dueDate
                  ? new Date(details.dueDate).toLocaleDateString(
                      "en-US",
                      DATE_OPTIONS
                    )
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Passenger & itinerary table */}
        <div className="overflow-hidden rounded-lg border border-gray-400">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 text-gray-800 uppercase text-xs tracking-widest">
              <tr>
                <th className="border border-gray-400 px-4 py-3 text-left w-44">
                  Passenger Name
                </th>
                <th className="border border-gray-400 px-4 py-3 text-left">
                  Routine &amp; Dates of Travel
                </th>
                <th className="border border-gray-400 px-4 py-3 text-left w-48">
                  Airlines
                </th>
                <th className="border border-gray-400 px-4 py-3 text-right w-44">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {itinerary.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="border border-gray-400 px-4 py-6 text-center italic text-gray-500"
                  >
                    No travel segments provided.
                  </td>
                </tr>
              ) : (
                itinerary.map((item, index) => (
                  <tr key={index} className="align-top">
                    {index === 0 && (
                      <td
                        rowSpan={itinerary.length}
                        className="border border-gray-400 px-4 py-4 font-semibold text-gray-900"
                      >
                        {receiver.name}
                      </td>
                    )}
                    <td className="border border-gray-400 px-4 py-4 space-y-1">
                      {renderMultiline(item.description)}
                      {!item.description && (
                        <p className="italic text-gray-400">
                          Add travel details in the item description field.
                        </p>
                      )}
                    </td>
                    <td className="border border-gray-400 px-4 py-4 space-y-1">
                      {renderMultiline(item.name)}
                      {!item.name && (
                        <p className="italic text-gray-400">
                          Specify airline names in the item title.
                        </p>
                      )}
                    </td>
                    <td className="border border-gray-400 px-4 py-4 text-right font-medium">
                      {formatNumberWithCommas(Number(item.total) || 0)}{" "}
                      {details.currency}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="uppercase text-xs font-semibold tracking-widest text-gray-500">
                Billed To
              </p>
              <p className="font-semibold text-gray-900">{receiver.name}</p>
              <p>{receiver.address}</p>
              <p>
                {receiver.city}, {receiver.country} {receiver.zipCode}
              </p>
              <p>{receiver.email}</p>
              <p>{receiver.phone}</p>
            </div>
            {details.additionalNotes && (
              <div>
                <p className="uppercase text-xs font-semibold tracking-widest text-gray-500">
                  Notes
                </p>
                <p className="whitespace-pre-line">{details.additionalNotes}</p>
              </div>
            )}
            {details.paymentTerms && (
              <div>
                <p className="uppercase text-xs font-semibold tracking-widest text-gray-500">
                  Payment Terms
                </p>
                <p className="whitespace-pre-line">{details.paymentTerms}</p>
              </div>
            )}
          </div>

          <div className="border border-gray-300 rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-700">
              <span className="font-semibold">Subtotal</span>
              <span>
                {formatNumberWithCommas(Number(details.subTotal) || 0)}{" "}
                {details.currency}
              </span>
            </div>
            {details.discountDetails?.amount ? (
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-semibold">Discount</span>
                <span>
                  {details.discountDetails.amountType === "amount"
                    ? `- ${formatNumberWithCommas(
                        Number(details.discountDetails.amount) || 0
                      )} ${details.currency}`
                    : `- ${details.discountDetails.amount}%`}
                </span>
              </div>
            ) : null}
            {details.taxDetails?.amount ? (
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-semibold">Tax</span>
                <span>
                  {details.taxDetails.amountType === "amount"
                    ? `+ ${formatNumberWithCommas(
                        Number(details.taxDetails.amount) || 0
                      )} ${details.currency}`
                    : `+ ${details.taxDetails.amount}%`}
                </span>
              </div>
            ) : null}
            {details.shippingDetails?.cost ? (
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-semibold">Service Fees</span>
                <span>
                  {details.shippingDetails.costType === "amount"
                    ? `+ ${formatNumberWithCommas(
                        Number(details.shippingDetails.cost) || 0
                      )} ${details.currency}`
                    : `+ ${details.shippingDetails.cost}%`}
                </span>
              </div>
            ) : null}
            <div className="border-t border-gray-300 pt-3 flex justify-between text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>
                {formatNumberWithCommas(Number(details.totalAmount) || 0)}{" "}
                {details.currency}
              </span>
            </div>
            {details.totalAmountInWords && (
              <p className="text-xs text-gray-600 italic">
                Amount in words: {details.totalAmountInWords}{" "}
                {details.currency}
              </p>
            )}
          </div>
        </div>

        {/* Payment details */}
        {details.paymentInformation && (
          <div className="rounded-lg border border-gray-300 p-4 text-sm text-gray-700">
            <p className="uppercase text-xs font-semibold tracking-widest text-gray-500">
              Payment Instructions
            </p>
            <p>Bank: {details.paymentInformation.bankName}</p>
            <p>Account Name: {details.paymentInformation.accountName}</p>
            <p>Account Number: {details.paymentInformation.accountNumber}</p>
          </div>
        )}

        {/* Signature */}
        {details.signature?.data ? (
          <div className="pt-6">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest">
              Authorized Signature
            </p>
            {isDataUrl(details.signature.data) ? (
              <img
                src={details.signature.data}
                width={140}
                height={70}
                alt={`Signature of ${sender.name}`}
              />
            ) : (
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 400,
                  fontFamily: `${details.signature.fontFamily}, cursive`,
                }}
              >
                {details.signature.data}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2">{sender.name}</p>
          </div>
        ) : null}
      </div>
    </InvoiceLayout>
  );
};

export default InvoiceTemplate;

