export enum ProductType {
  PHONE = 'phone',
  ACCESSORY = 'accessory',
  TABLET = 'tablet',
  LAPTOP = 'laptop'
}

export const ProductTypeLabels: Record<ProductType, string> = {
  [ProductType.PHONE]: 'Phone',
  [ProductType.ACCESSORY]: 'Accessory',
  [ProductType.TABLET]: 'Tablet',
  [ProductType.LAPTOP]: 'Laptop'
};

export const ProductTypeIcons: Record<ProductType, string> = {
  [ProductType.PHONE]: 'pi pi-mobile',
  [ProductType.ACCESSORY]: 'pi pi-box',
  [ProductType.TABLET]: 'pi pi-tablet',
  [ProductType.LAPTOP]: 'pi pi-desktop'
};
