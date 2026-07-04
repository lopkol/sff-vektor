import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash2, X } from "lucide-react";
import { Control, useFieldArray } from "react-hook-form";
import { CreateBook } from "@/types/book";
import { useEffect } from "react";

interface BookAlternativeItemProps {
  control: Control<CreateBook>;
  index: number;
  alternativeId: string;
  onRemove: () => void;
}

export function BookAlternativeItem({
  control,
  index,
  alternativeId,
  onRemove,
}: BookAlternativeItemProps) {
  const t = useTranslations("BookList.Admin");

  const { fields: urlFields, append: appendUrl, remove: removeUrl } =
    useFieldArray({
      control,
      name: `alternatives.${index}.urls` as any,
    });

  // Ensure we always have at least one URL field
  useEffect(() => {
    if (urlFields.length === 0) {
      appendUrl("");
    }
  }, [urlFields, appendUrl]);

  return (
    <div
      className="space-y-2 rounded-lg border p-4"
      data-alternative-id={alternativeId}
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {t("props.alternativeName")} {index + 1}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <FormField
        control={control}
        name={`alternatives.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                placeholder={t("form.alternativeNamePlaceholder")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <Label className="text-sm">{t("props.alternativeUrls")}</Label>
        {urlFields.map((urlFieldItem, urlIndex) => (
          <FormField
            key={urlFieldItem.id}
            control={control}
            name={`alternatives.${index}.urls.${urlIndex}`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("form.alternativeUrlPlaceholder")}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUrl(urlIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendUrl("")}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("form.addAlternativeUrl")}
        </Button>
      </div>
    </div>
  );
}
