import React from "react";

// Components
import { InvoiceLayout } from "@/app/components";

// Helpers
import { formatNumberWithCommas, isDataUrl, isImageUrl } from "@/lib/helpers";
import { DATE_OPTIONS } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

const InvoiceTemplate = (data: InvoiceType) => {
  const { sender, receiver, details } = data;

  const itinerary = details.items || [];
  const showVat = details.showVat || false;

  const renderMultiline = (value?: string) => {
    if (!value) return null;
    return value
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line, index) => (
        <p key={`${line}-${index}`} className="leading-tight break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {line}
        </p>
      ));
  };

  return (
    <InvoiceLayout data={data}>
      <div className="border border-gray-300 p-6 rounded-xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-6">
          <div className="max-w-xs space-y-2">
            {details.invoiceLogo && (
              <img
                src={details.invoiceLogo}
                width={120}
                height={68}
                alt={`Logo of ${sender.name}`}
              />
            )}
            <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-800">
              {sender.name}
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                {sender.city}, {sender.country}
              </p>
              <p>{sender.email}</p>
              <p>{sender.phone}</p>
            </div>
          </div>

          <div className="ml-auto text-right space-y-3">
            <h2 className="text-3xl font-semibold tracking-wide text-gray-900">
              Travel Invoice
            </h2>
            <div className="space-y-2.5">
              <p className="text-base">
                <span className="font-bold text-gray-900">Invoice #:</span>{" "}
                <span className="font-bold text-gray-900 text-lg">{details.invoiceNumber}</span>
              </p>
              <p className="text-base">
                <span className="font-bold text-gray-900">Issued:</span>{" "}
                <span className="font-semibold text-gray-800">
                  {details.invoiceDate
                    ? new Date(details.invoiceDate).toLocaleDateString(
                        "en-US",
                        DATE_OPTIONS
                      )
                    : "-"}
                </span>
              </p>
              {details.numberOfPassengers && (
                <p className="text-base">
                  <span className="font-bold text-gray-900">Total Passengers:</span>{" "}
                  <span className="font-bold text-gray-900 text-lg">{details.numberOfPassengers}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Billed To - Right Side */}
        <div className="flex justify-end">
          <div className="text-right space-y-2.5 min-w-[280px]">
            <p className="uppercase text-sm font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-2">
              Billed To
            </p>
            <p className="font-bold text-base text-gray-900">{receiver.name}</p>
            <p className="text-sm font-medium text-gray-800">
              {receiver.city}, {receiver.country}
            </p>
            <p className="text-sm font-medium text-gray-800">{receiver.email}</p>
            <p className="text-sm font-medium text-gray-800">{receiver.phone}</p>
          </div>
        </div>

        {/* Passenger & itinerary table */}
        <div className="overflow-hidden rounded-lg border border-gray-400">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-100 text-gray-800 uppercase text-xs tracking-widest">
              <tr>
                <th className="border border-gray-400 px-4 py-3 text-left" style={{ width: '18%' }}>
                  Passenger Name
                </th>
                <th className="border border-gray-400 px-4 py-3 text-left" style={{ width: '32%' }}>
                  Route
                </th>
                <th className="border border-gray-400 px-4 py-3 text-left" style={{ width: '15%' }}>
                  Airlines
                </th>
                <th className="border border-gray-400 px-4 py-3 text-left" style={{ width: '15%' }}>
                  Type of Service
                </th>
                <th className="border border-gray-400 px-4 py-3 text-right" style={{ width: '20%' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {itinerary.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-gray-400 px-4 py-6 text-center italic text-gray-500"
                  >
                    No travel segments provided.
                  </td>
                </tr>
              ) : (
                itinerary.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr className="align-top">
                      <td className="border border-gray-400 px-4 py-4 font-semibold text-gray-900" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
                        {item.passengerName || `Passenger ${index + 1}`}
                      </td>
                      <td className="border border-gray-400 px-4 py-4 space-y-1 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {renderMultiline(item.description)}
                        {!item.description && (
                          <p className="italic text-gray-400">
                            Add travel details in the item description field.
                          </p>
                        )}
                      </td>
                      <td className="border border-gray-400 px-4 py-4 space-y-1 break-words">
                        {renderMultiline(item.name)}
                        {!item.name && (
                          <p className="italic text-gray-400">
                            Specify airline names in the item title.
                          </p>
                        )}
                      </td>
                      <td className="border border-gray-400 px-4 py-4 text-gray-700 break-words">
                        {item.serviceType || "-"}
                      </td>
                      <td className="border border-gray-400 px-4 py-4 text-right font-medium" style={{ minWidth: '120px' }}>
                        {formatNumberWithCommas(Number(item.unitPrice) || 0)}{" "}
                        {details.currency}
                      </td>
                    </tr>
                    {showVat && item.vat !== undefined && Number(item.vat) > 0 && (
                      <tr className="align-top">
                        <td className="border border-gray-400 px-4 py-2 text-gray-700" colSpan={4}>
                          <span className="font-medium">
                            VAT{item.vatPercentage ? ` = ${item.vatPercentage}%` : ''}
                          </span>
                        </td>
                        <td className="border border-gray-400 px-4 py-2 text-right font-medium">
                          {formatNumberWithCommas(Number(item.vat) || 0)}{" "}
                          {details.currency}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-3 text-sm text-gray-700">
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

          <div className="border border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50">
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

        {/* Payment details and Signature */}
        <div className="flex flex-wrap justify-between items-start mt-4 gap-8" style={{ pageBreakInside: 'avoid' }}>
          {details.paymentInformation && (
            <div className="rounded-lg border border-gray-300 p-2 text-sm text-gray-700 max-w-md">
              <p className="uppercase text-xs font-semibold tracking-widest text-gray-500 mb-1">
                Payment Instructions
              </p>
              <p className="mb-0.5">Bank: {details.paymentInformation.bankName}</p>
              <p className="mb-0.5">Account Name: {details.paymentInformation.accountName}</p>
              <p className="mb-0.5">Account Number: {details.paymentInformation.accountNumber}</p>
              {details.paymentInformation.iban && (
                <p className="mb-0.5">IBAN No: {details.paymentInformation.iban}</p>
              )}
              {details.paymentInformation.swiftCode && (
                <p className="mb-0.5">SWIFT Code: {details.paymentInformation.swiftCode}</p>
              )}
            </div>
          )}

          {/* Signature */}
          {details.signature?.data ? (
            <div className="ml-auto">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-1">
                Authorized Signature
              </p>
              {isImageUrl(details.signature.data) ? (
                <img
                  src={details.signature.data}
                  width={120}
                  height={60}
                  alt={`Signature of ${sender.name}`}
                />
              ) : (
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 400,
                    fontFamily: `${details.signature.fontFamily}, cursive`,
                    margin: 0,
                  }}
                >
                  {details.signature.data}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">{sender.name}</p>
            </div>
          ) : null}
        </div>
      </div>
    </InvoiceLayout>
  );
};

export default InvoiceTemplate;

