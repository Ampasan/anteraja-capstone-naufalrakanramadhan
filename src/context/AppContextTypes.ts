export interface AppContextValue {
  selectedCourierId: string | null;
  selectCourier: (courierId: string | null) => void;
}
