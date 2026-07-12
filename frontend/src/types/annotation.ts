export type AnnotationPoint = { x: number; y: number };

export type ImageRecord = {
  id: number;
  image_url: string;
  uploaded_at: string;
  annotation_count: number;
};

export type AnnotationRecord = {
  id: number;
  image: number;
  shape_type: "polygon";
  points: AnnotationPoint[];
  label: string;
  version: number;
  created_at: string;
  updated_at: string;
};
