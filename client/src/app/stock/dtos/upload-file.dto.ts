export type UploadedFile = {
  id?: number;
  file: File | null;
  preview: string;
  type: "cover" | "slide" | "pdf";
  is_cover: boolean;
  isVideo?: boolean;
  isPdf?: boolean;
};
