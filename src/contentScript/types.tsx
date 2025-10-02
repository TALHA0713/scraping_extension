export type Tab = {
  label: string;
  icon: any;
  component: any;
};

export type PopupContainerProps = {
  tabs: Tab[];
  handleChange: (event: React.ChangeEvent<{}>, newValue: number) => void;
  handleOpen: (value: boolean) => void;
  value: number;
};

export type TabPanelProps = {
  tabs: Tab[];
  value: number;
  handleOpen: (value: boolean) => void;
};

export type TabSwitchProps = {
  value: number;
  handleChange: (event: React.ChangeEvent<{}>, newValue: number) => void;
  tabs: any[];
};

export type ImageType = {
  thumbnails: string[];
  largeSizes: string[];
  mediumSizes: string[];
};

export type Offers = {
  listPrice: number;
  price: number;
  title: string;
  merchant: string;
  shortDescription: string;
  images: ImageType;
  affiliateLink: string;
};

export type ProductCardProps = {
  offers: Offers[];
  innerLoading: string;
};

export type ProductInfo = {
  title: string;
  description: string;
  price: string;
  discountPrice: string;
  imageUrl: string;
  offers: Offers[];
  recommendations: Offers[];
  merchant:string;
};

export type ProductInfoProps = {
  product: ProductInfo;
  loading?: boolean;
};

export type MerchantObject = {
  internet?: string;
  category?: string;
  brand?: string;
  upc?: string[];
  gtin?: string;
  model?: string;
  sku?: string;
  merchant: string;
  title?: string;
  price?: string;
  img?: string;
};

export enum MerchantType {
  amazon = 'Amazon',
}
