const pad = (n: number) => String(n).padStart(2, '0');

const today = new Date();

export const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
