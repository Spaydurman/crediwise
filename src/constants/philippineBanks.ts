export interface PhilippineBank {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  brandColor: string;
}

// Philippine banks that currently issue or service consumer credit cards.
export const PHILIPPINE_BANKS: PhilippineBank[] = [
  { id: "bdo", name: "BDO Unibank", shortName: "BDO", domain: "bdo.com.ph", brandColor: "#003b70" },
  { id: "bpi", name: "Bank of the Philippine Islands", shortName: "BPI", domain: "bpi.com.ph", brandColor: "#a6192e" },
  { id: "metrobank", name: "Metrobank", shortName: "MB", domain: "metrobank.com.ph", brandColor: "#0067b1" },
  { id: "unionbank", name: "UnionBank of the Philippines", shortName: "UB", domain: "unionbankph.com", brandColor: "#f58220" },
  { id: "rcbc", name: "RCBC", shortName: "RCBC", domain: "rcbc.com", brandColor: "#004b8d" },
  { id: "security-bank", name: "Security Bank", shortName: "SB", domain: "securitybank.com", brandColor: "#00529b" },
  { id: "eastwest", name: "EastWest Bank", shortName: "EW", domain: "eastwestbanker.com", brandColor: "#6d2077" },
  { id: "chinabank", name: "China Bank", shortName: "CBC", domain: "chinabank.ph", brandColor: "#b7192e" },
  { id: "pnb", name: "Philippine National Bank", shortName: "PNB", domain: "pnb.com.ph", brandColor: "#003b71" },
  { id: "landbank", name: "Land Bank of the Philippines", shortName: "LBP", domain: "landbank.com", brandColor: "#00843d" },
  { id: "maybank", name: "Maybank Philippines", shortName: "MAY", domain: "maybank.com.ph", brandColor: "#ffcc00" },
  { id: "aub", name: "Asia United Bank", shortName: "AUB", domain: "aub.com.ph", brandColor: "#0072bc" },
  { id: "bankcom", name: "Bank of Commerce", shortName: "BOC", domain: "bankcom.com.ph", brandColor: "#005baa" },
  { id: "hsbc", name: "HSBC Philippines", shortName: "HSBC", domain: "hsbc.com.ph", brandColor: "#db0011" },
];

export function getPhilippineBank(value: string) {
  const normalized = value.trim().toLocaleLowerCase();
  return PHILIPPINE_BANKS.find(
    (bank) =>
      bank.name.toLocaleLowerCase() === normalized ||
      bank.shortName.toLocaleLowerCase() === normalized,
  );
}
