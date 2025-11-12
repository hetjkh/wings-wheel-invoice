"use client";

import { useEffect } from "react";

// RHF
import { FieldArrayWithId, useFormContext, useWatch } from "react-hook-form";

// DnD
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ShadCn
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Components
import { BaseButton, FormInput, FormTextarea } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";

// Types
import { ItemType, NameType } from "@/types";

type SingleItemProps = {
    name: NameType;
    index: number;
    fields: ItemType[];
    field: FieldArrayWithId<ItemType>;
    moveFieldUp: (index: number) => void;
    moveFieldDown: (index: number) => void;
    removeField: (index: number) => void;
};

const SingleItem = ({
    name,
    index,
    fields,
    field,
    moveFieldUp,
    moveFieldDown,
    removeField,
}: SingleItemProps) => {
    const { control, setValue } = useFormContext();

    const { _t } = useTranslationContext();

    // Items
    const rate = useWatch({
        name: `${name}[${index}].unitPrice`,
        control,
    });

    const quantity = useWatch({
        name: `${name}[${index}].quantity`,
        control,
    });

    const total = useWatch({
        name: `${name}[${index}].total`,
        control,
    });

    // Currency
    const currency = useWatch({
        name: `details.currency`,
        control,
    });

    // Template
    const pdfTemplate = useWatch({
        name: `details.pdfTemplate`,
        control,
    });

    useEffect(() => {
        // Calculate total when rate changes (quantity is always 1 for passengers)
        if (rate != undefined) {
            const calculatedTotal = (rate * 1).toFixed(2);
            setValue(`${name}[${index}].total`, calculatedTotal);
            setValue(`${name}[${index}].quantity`, 1);
        }
    }, [rate, setValue, name, index]);

    // DnD
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const boxDragClasses = isDragging
        ? "border-2 bg-gray-200 border-blue-600 dark:bg-slate-900 z-10"
        : "border";

    const gripDragClasses = isDragging
        ? "opacity-0 group-hover:opacity-100 transition-opacity cursor-grabbing"
        : "cursor-grab";

    return (
        <div
            style={style}
            {...attributes}
            className={`${boxDragClasses} group flex flex-col gap-y-5 p-3 my-2 cursor-default rounded-xl bg-gray-50 dark:bg-slate-800 dark:border-gray-600`}
        >
            {/* {isDragging && <div className="bg-blue-600 h-1 rounded-full"></div>} */}
            <div className="flex flex-wrap justify-between">
                <p className="font-medium">
                    Person {index + 1}
                </p>

                <div className="flex gap-3">
                    {/* Drag and Drop Button */}
                    <div
                        className={`${gripDragClasses} flex justify-center items-center`}
                        ref={setNodeRef}
                        {...listeners}
                    >
                        <GripVertical className="hover:text-blue-600" />
                    </div>

                    {/* Up Button */}
                    <BaseButton
                        size={"icon"}
                        tooltipLabel="Move the item up"
                        onClick={() => moveFieldUp(index)}
                        disabled={index === 0}
                    >
                        <ChevronUp />
                    </BaseButton>

                    {/* Down Button */}
                    <BaseButton
                        size={"icon"}
                        tooltipLabel="Move the item down"
                        onClick={() => moveFieldDown(index)}
                        disabled={index === fields.length - 1}
                    >
                        <ChevronDown />
                    </BaseButton>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex flex-wrap justify-between gap-y-5 gap-x-2">
                    <FormInput
                        name={`${name}[${index}].passengerName`}
                        label={`Passenger Name (Person ${index + 1})`}
                        placeholder={`Enter passenger ${index + 1} name`}
                        vertical
                    />

                    <FormInput
                        name={`${name}[${index}].name`}
                        label="Airlines"
                        placeholder="Enter airline name"
                        vertical
                    />

                    <FormField
                        control={control}
                        name={`${name}[${index}].serviceType` as any}
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Service Type</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-[12rem]">
                                            <SelectValue placeholder="Select service type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Economy class">Economy class</SelectItem>
                                        <SelectItem value="Business class">Business class</SelectItem>
                                        <SelectItem value="Premium economy class">Premium economy class</SelectItem>
                                        <SelectItem value="First class">First class</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormInput
                        name={`${name}[${index}].unitPrice`}
                        type="number"
                        label="Rate"
                        labelHelper={`(${currency})`}
                        placeholder="Enter rate"
                        className="w-[8rem]"
                        vertical
                    />

                    <div className="flex flex-col gap-2">
                        <div>
                            <Label>Total</Label>
                        </div>
                        <Input
                            value={`${total} ${currency}`}
                            readOnly
                            placeholder="Item total"
                            className="border-none font-medium text-lg bg-transparent"
                            size={10}
                        />
                    </div>
                </div>
                
                <FormTextarea
                    name={`${name}[${index}].description`}
                    label="Description"
                    placeholder="Enter description"
                />
            </div>
            <div>
                {/* Not allowing deletion for first item when there is only 1 item */}
                {fields.length > 1 && (
                    <BaseButton
                        variant="destructive"
                        onClick={() => removeField(index)}
                    >
                        <Trash2 />
                        {_t("form.steps.lineItems.removeItem")}
                    </BaseButton>
                )}
            </div>
        </div>
    );
};

export default SingleItem;
