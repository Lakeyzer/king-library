import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { UButton, UCheckbox } from "#components";

export function sortableHeader<T>(label: string): TableColumn<T>["header"] {
  return ({ column }) => {
    const isSorted = column.getIsSorted();

    return h(UButton, {
      color: "neutral",
      variant: "ghost",
      label,
      icon:
        isSorted === "asc"
          ? "i-lucide-arrow-up"
          : isSorted === "desc"
            ? "i-lucide-arrow-down"
            : "i-lucide-arrow-up-down",
      onClick: () => column.toggleSorting(isSorted === "asc"),
    });
  };
}

export function flagIndicator(value: boolean) {
  return h(UCheckbox, {
    modelValue: value,
    disabled: true,
  });
}

export function formatTypeLabel(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
