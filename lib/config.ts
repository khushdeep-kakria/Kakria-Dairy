const rawWa = process.env.UNCLE_WHATSAPP || '919815342224';
const waDigits = rawWa.replace(/\D/g, '');

export const SHOP_PHONE_DISPLAY = '+91 98153 42224';
export const SHOP_PHONE_TEL = '+919815342224';
export const SHOP_PHONE_WA = waDigits.startsWith('91') ? waDigits : `91${waDigits}`;
export const SHOP_PHONE_RAW = '9815342224';
export const GOOGLE_MAPS_LINK = 'https://maps.app.goo.gl/4A3PC5V43FvNFDDY8';
export const DELIVERY_TOWN = 'Kotkapura';
export const DELIVERY_STATE = 'Punjab';
export const DELIVERY_BANNER = 'Delivery only within Kotkapura town';
