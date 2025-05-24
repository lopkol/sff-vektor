import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Control, useFieldArray } from "react-hook-form";
import { CreateBook } from "@/types/book";
import { BookAlternativeItem } from "./book-alternative-item";

interface BookAlternativeInputProps {
  control: Control<CreateBook>;
  errors?: any;
}

export function BookAlternativeInput(
  { control, errors }: BookAlternativeInputProps,
) {
  const t = useTranslations("BookList.Admin.props");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "alternatives",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <Label>{t("alternatives")}</Label>
        {fields.map((field, index) => (
          <BookAlternativeItem
            key={field.id}
            control={control}
            errors={errors}
            index={index}
            alternativeId={field.id}
            onRemove={() => remove(index)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ name: "", urls: [""] })}
        className="w-fit"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("addAlternative")}
      </Button>
    </div>
  );
}
