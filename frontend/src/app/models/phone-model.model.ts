export interface PhoneModel {
  id: string;
  brandId: string;
  brandName: string;
  brandLogoUrl: string | null;
  name: string;
  createdAt: string;
}

export interface CreateModelRequest {
  brandId: string;
  name: string;
}

export interface PhoneModelFilter {
  brandId?: string;
  search?: string;
}
