export type ProductSpecTableRow = {
  label: string;
  values: string[];
};

export type ProductSpecTable = {
  firstColumnHeader: string;
  columnHeaders: string[];
  rows: ProductSpecTableRow[];
};

export const createEmptySpecTable = (): ProductSpecTable => ({
  firstColumnHeader: "Model",
  columnHeaders: [""],
  rows: [{ label: "", values: [""] }],
});
