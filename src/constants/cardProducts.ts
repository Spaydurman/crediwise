export interface CardProduct {
  name: string;
  background: string;
  accent: string;
  network: "VISA" | "mastercard" | "JCB" | "AMEX" | "UnionPay";
}

// Representative consumer cards for each bank. Colors are app illustrations,
// not reproductions of issuer artwork. Keep an "Other card" choice in the UI.
export const CARD_PRODUCTS: Record<string, CardProduct[]> = {
  bdo: [
    { name: "ShopMore Mastercard", background: "#103f71", accent: "#f4bf32", network: "mastercard" },
    { name: "Visa Classic", background: "#154c84", accent: "#e8edf5", network: "VISA" },
    { name: "Visa Gold", background: "#a77731", accent: "#f9e5a4", network: "VISA" },
    { name: "Mastercard Platinum", background: "#292e39", accent: "#c6d0db", network: "mastercard" },
  ],
  bpi: [
    { name: "Rewards Card", background: "#a6192e", accent: "#f5c9ce", network: "mastercard" },
    { name: "Gold Rewards Card", background: "#9c7535", accent: "#fff0be", network: "mastercard" },
    { name: "Platinum Rewards Card", background: "#34353c", accent: "#d7d5d0", network: "mastercard" },
    { name: "Amore Cashback Card", background: "#a31e48", accent: "#ffc9d8", network: "VISA" },
  ],
  metrobank: [
    { name: "Titanium Mastercard", background: "#4a535e", accent: "#c6d2df", network: "mastercard" },
    { name: "M Free Mastercard", background: "#13609a", accent: "#bce4f5", network: "mastercard" },
    { name: "Rewards Plus Visa", background: "#0c4784", accent: "#f6ca55", network: "VISA" },
    { name: "World Mastercard", background: "#171d28", accent: "#aebed0", network: "mastercard" },
  ],
  unionbank: [
    { name: "Rewards Card", background: "#e46b15", accent: "#fff0bf", network: "VISA" },
    { name: "Cash Back Card", background: "#1e5790", accent: "#ffb541", network: "VISA" },
    { name: "Miles+ Visa Signature", background: "#182b4b", accent: "#e9b75c", network: "VISA" },
    { name: "U Visa Platinum", background: "#292f65", accent: "#c1bcff", network: "VISA" },
  ],
  rcbc: [
    { name: "Flex Visa", background: "#07549c", accent: "#d6f1ff", network: "VISA" },
    { name: "Flex Gold Visa", background: "#a7752d", accent: "#ffe5a4", network: "VISA" },
    { name: "JCB Platinum", background: "#293643", accent: "#c7d4dc", network: "JCB" },
    { name: "Hexagon Club Platinum Mastercard", background: "#292c32", accent: "#ddc7a2", network: "mastercard" },
  ],
  "security-bank": [
    { name: "Wave Mastercard", background: "#0867a7", accent: "#8cdef3", network: "mastercard" },
    { name: "Gold Mastercard", background: "#9b7a3a", accent: "#ffe7a5", network: "mastercard" },
    { name: "Platinum Mastercard", background: "#343c4b", accent: "#c9d5e2", network: "mastercard" },
    { name: "Complete Cashback Platinum", background: "#184b83", accent: "#9ad5f1", network: "mastercard" },
  ],
  eastwest: [
    { name: "Privilege", background: "#6d2077", accent: "#e7bde7", network: "mastercard" },
    { name: "Gold Mastercard", background: "#a17635", accent: "#ffe3a2", network: "mastercard" },
    { name: "JCB Platinum", background: "#44334d", accent: "#dfcced", network: "JCB" },
    { name: "KrisFlyer Platinum Mastercard", background: "#292d4b", accent: "#c9c9e9", network: "mastercard" },
  ],
  chinabank: [
    { name: "Freedom Mastercard", background: "#ab2231", accent: "#ffd0d2", network: "mastercard" },
    { name: "Prime Mastercard", background: "#b7192e", accent: "#f1c6cd", network: "mastercard" },
    { name: "Cash Rewards Mastercard", background: "#863a52", accent: "#f4c8d4", network: "mastercard" },
    { name: "Platinum Mastercard", background: "#42434a", accent: "#d6d5d9", network: "mastercard" },
  ],
  pnb: [
    { name: "Ze-Lo Mastercard", background: "#124b80", accent: "#aed9f0", network: "mastercard" },
    { name: "Essentials Mastercard", background: "#0c3f75", accent: "#e2edf6", network: "mastercard" },
    { name: "Mabuhay Miles Platinum Mastercard", background: "#3a4654", accent: "#d4dce5", network: "mastercard" },
    { name: "Mabuhay Miles World Mastercard", background: "#192737", accent: "#d3bd91", network: "mastercard" },
  ],
  landbank: [
    { name: "Classic Mastercard", background: "#087547", accent: "#d5f4d9", network: "mastercard" },
    { name: "Gold Mastercard", background: "#8c7937", accent: "#fae5a7", network: "mastercard" },
  ],
  maybank: [
    { name: "Visa Classic", background: "#c89400", accent: "#fff1b0", network: "VISA" },
    { name: "Gold Mastercard", background: "#ad8420", accent: "#fff0b3", network: "mastercard" },
    { name: "Platinum Mastercard", background: "#373a40", accent: "#f5cf49", network: "mastercard" },
  ],
  aub: [
    { name: "Easy Mastercard", background: "#0870ae", accent: "#b8e7f8", network: "mastercard" },
    { name: "Platinum Mastercard", background: "#363f4c", accent: "#c9d8e7", network: "mastercard" },
  ],
  bankcom: [
    { name: "Classic Mastercard", background: "#135a95", accent: "#c2e5f8", network: "mastercard" },
    { name: "Gold Mastercard", background: "#a37828", accent: "#ffe4a3", network: "mastercard" },
    { name: "Platinum Mastercard", background: "#3e4852", accent: "#d9e0e9", network: "mastercard" },
    { name: "World Mastercard", background: "#182b42", accent: "#e1c98d", network: "mastercard" },
  ],
  hsbc: [
    { name: "Red Platinum Mastercard", background: "#ae1025", accent: "#ffb8c2", network: "mastercard" },
    { name: "Gold Visa Cash Back", background: "#a88135", accent: "#ffeab7", network: "VISA" },
    { name: "Live+ Credit Card", background: "#2a303a", accent: "#ff6975", network: "VISA" },
  ],
};

export function getCardProduct(bankId: string | undefined, name: string | undefined) {
  return bankId ? CARD_PRODUCTS[bankId]?.find((product) => product.name === name) : undefined;
}
