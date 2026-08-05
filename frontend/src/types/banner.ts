export interface Banner {
  id: number;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  gradient: string;
  imageUrl?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface BannerInput {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  gradient: string;
  imageUrl?: string | null;
  sortOrder: number;
  active: boolean;
}
