const STORAGE_KEY = 'msawicki.dev:user_id';

export function getUserId(): string {
  const existingValue = localStorage.getItem(STORAGE_KEY)
  if (existingValue && typeof existingValue === 'string') {
    return existingValue;
  }

  const randomId = generateRandomId();
  localStorage.setItem(STORAGE_KEY, randomId)
  return randomId
}


function generateRandomId(): string {
  return '_' + Math.random().toString(36).substr(2, 9);
}
