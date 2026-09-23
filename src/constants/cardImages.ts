// Issuer-hosted promotional card-face images. These URLs may change when banks
// update their sites; callers keep the illustrated card as an error fallback.
const CARD_IMAGES: Record<string, Record<string, string>> = {
  bpi: {
    "Rewards Card": "https://www.bpi.com.ph/content/dam/bau/personal-banking/cards/credit-cards/credit-cards-rebranding/content-card/content_card_rewards.png",
    "Gold Rewards Card": "https://www.bpi.com.ph/content/dam/bau/personal-banking/cards/credit-cards/credit-cards-rebranding/content-card/content_card_Gold%20Rewards.png",
    "Platinum Rewards Card": "https://www.bpi.com.ph/content/dam/bau/personal-banking/cards/credit-cards/credit-cards-rebranding/content-card/content_card_Platinum%20Rewards.png",
    "Amore Cashback Card": "https://www.bpi.com.ph/content/dam/bau/personal-banking/cards/credit-cards/credit-cards-rebranding/content-card/content_card_Amore%20Cashback.png",
  },
  metrobank: {
    "Titanium Mastercard": "https://web-assets.metrobank.com.ph/1721889785-titanium-mastercard.png",
    "M Free Mastercard": "https://web-assets.metrobank.com.ph/1785825678-card-resizes_m-free_1010x645px.webp",
    "Rewards Plus Visa": "https://web-assets.metrobank.com.ph/1733380275-rewards-plus-visa.png",
    "World Mastercard": "https://web-assets.metrobank.com.ph/1785825679-card-resizes_world_1010x645px.webp",
  },
  "security-bank": {
    "Wave Mastercard": "https://www.securitybank.com/wp-content/uploads/2025/01/CCV2-Wave_Contactless_2024.png",
    "Gold Mastercard": "https://www.securitybank.com/wp-content/uploads/2025/01/CCV2-Gold_Contactless_2022-2026-300x200-1.png",
    "Platinum Mastercard": "https://www.securitybank.com/wp-content/uploads/2025/01/CCV2-Platinum_Contactless_2022-2026-300x200-1.png",
    "Complete Cashback Platinum": "https://www.securitybank.com/wp-content/uploads/2025/01/CCV2-CB_Platinum_Contactless_2022-2026.png",
  },
  chinabank: {
    "Cash Rewards Mastercard": "https://www.chinabank.ph/view-file/product-gallery/8JOlTV2TB1hsfYMksAETsn3c4YC7pS-metaY2FzaCByZXdhcmRzLnBuZw%3D%3D-.png",
    "Platinum Mastercard": "https://www.chinabank.ph/view-file/product-gallery/dNBRmE5Edj2J3Ek0h23u7QI1Sv7IRS-metacGxhdGludW0ucG5n-.png",
    "Freedom Mastercard": "https://www.chinabank.ph/view-file/product-gallery/YrNVKv3dtsitvR5LnUkGRcOzV0dk2W-metaZnJlZWRvbSBwbGF0aW51bS5wbmc%3D-.png",
    "Prime Mastercard": "https://www.chinabank.ph/view-file/product-gallery/rZFGClk5QLJRCgfxnPN77c4g5eZIvT-metacHJpbWUucG5n-.png",
  },
  bankcom: {
    "Classic Mastercard": "https://www.bankcom.com.ph/wp-content/uploads/2019/05/FA-MC-Emerald-Front.png",
    "Gold Mastercard": "https://www.bankcom.com.ph/wp-content/uploads/2019/05/FA-MC-Gold-Front.png",
    "Platinum Mastercard": "https://www.bankcom.com.ph/wp-content/uploads/2019/05/FA-MC-Platinum-Front.png",
    "World Mastercard": "https://www.bankcom.com.ph/wp-content/uploads/2019/05/BoC-WorldCard-front-FA.png",
  },
  unionbank: {
    "Rewards Platinum Mastercard": "https://www.unionbankph.com/sites/default/files/styles/thumbnail/public/tmp/2023-UB-Card-Rewards-No-Name-MC.jpg?itok=ncJ-XPvT",
    "Cash Back Titanium Mastercard": "https://www.unionbankph.com/sites/default/files/styles/thumbnail/public/tmp/2023-UB-Card-Cash-Back-No-Name-MC.jpg?itok=HUh67dPE",
    "Miles+ World Mastercard": "https://www.unionbankph.com/sites/default/files/styles/thumbnail/public/tmp/2023-UB-Card-Miles-No-Name-MC.jpg?itok=LdTw7Ktg",
    "U Platinum Mastercard": "https://www.unionbankph.com/sites/default/files/styles/thumbnail/public/tmp/ucard-mc_0.jpg?itok=bmwwyxNz",
  },
  maybank: {
    "Visa Classic": "https://www.maybank.com.ph/iwov-resources/maybank-ph/img/ph/en/personal/cards/credit-cards/visa-classic_inpage.jpg",
    "Gold Mastercard": "https://www.maybank.com.ph/iwov-resources/maybank-ph/img/ph/en/personal/cards/credit-cards/mastercard-gold_inpage.jpg",
    "Platinum Mastercard": "https://www.maybank.com.ph/iwov-resources/maybank-ph/img/ph/en/personal/cards/credit-cards/mastercard-platinum_inpage.jpg",
  },
  hsbc: {
    "Red Platinum Mastercard": "https://www.hsbc.com.ph/content/dam/hsbc/ph/images/credit-cards/16975-hsbc-red-credit-card-dummy-300x189.jpg",
    "Gold Visa Cash Back": "https://www.hsbc.com.ph/content/dam/hsbc/ph/images/credit-cards/card-face/cashback-gold-2020-dcm-46503.jpg",
  },
};

export function getCardImageUrl(bankId: string | undefined, cardName: string | undefined) {
  return bankId && cardName ? CARD_IMAGES[bankId]?.[cardName] : undefined;
}
