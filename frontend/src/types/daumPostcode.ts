export interface DaumPostcodeResult {
  zonecode: string;
  address: string;
  addressType: 'R' | 'J';
  bname: string;
  buildingName: string;
}

export interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeResult) => void;
  onclose?: () => void;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: DaumPostcodeOptions) => { open: () => void };
    };
  }
}
