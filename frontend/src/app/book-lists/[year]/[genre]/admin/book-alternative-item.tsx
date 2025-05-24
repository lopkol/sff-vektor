import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormErrorMessage } from "@/components/ui/form";
import { Plus, Trash2, X } from "lucide-react";
import { Control, Controller, useFieldArray, useWatch } from "react-hook-form";
import { CreateBook } from "@/types/book";
import { useEffect } from "react";

interface BookAlternativeItemProps {
  control: Control<CreateBook>;
  errors?: any;
  index: number;
  alternativeId: string;
  onRemove: () => void;
}

export function BookAlternativeItem({
  control,
  errors,
  index,
  alternativeId,
  onRemove,
}: BookAlternativeItemProps) {
  const t = useTranslations("BookList.Admin.props");

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
          {t("alternativeName")} {index + 1}
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

      <div className="space-y-2">
        <Controller
          name={`alternatives.${index}.name`}
          control={control}
          render={({ field: nameField }) => (
            <Input
              {...nameField}
              placeholder={t("alternativeNamePlaceholder")}
            />
          )}
        />
        {errors?.alternatives?.[index]?.name && (
          <FormErrorMessage>
            {errors.alternatives[index].name.message}
          </FormErrorMessage>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">{t("alternativeUrls")}</Label>
        {urlFields.map((urlField, urlIndex) => (
          <div key={urlField.id} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Controller
                name={`alternatives.${index}.urls.${urlIndex}`}
                control={control}
                render={({ field: urlField }) => (
                  <Input
                    {...urlField}
                    placeholder={t("alternativeUrlPlaceholder")}
                  />
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  removeUrl(urlIndex)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {errors?.alternatives?.[index]?.urls?.[urlIndex] && (
              <FormErrorMessage>
                {errors.alternatives[index].urls[urlIndex].message}
              </FormErrorMessage>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendUrl("")}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("addAlternativeUrl")}
        </Button>
      </div>
    </div>
  );
}
