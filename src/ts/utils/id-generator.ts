const USER_ID_STORAGE_KEY = 'msawicki.dev:user_id';
const SESSION_ID_STORAGE_KEY = 'msawicki.dev:session_id';

export function getUserId(): string {
  const existingValue = localStorage.getItem(USER_ID_STORAGE_KEY)
  if (existingValue && typeof existingValue === 'string') {
    return existingValue;
  }

  const randomId = randomUserId();
  localStorage.setItem(USER_ID_STORAGE_KEY, randomId)
  return randomId
}

export function getSessionId(): string {
  const existingValue = sessionStorage.getItem(SESSION_ID_STORAGE_KEY)
  if (existingValue && typeof existingValue === 'string') {
    return existingValue;
  }

  const randomId = randomSessionId();
  sessionStorage.setItem(SESSION_ID_STORAGE_KEY, randomId)
  return randomId
}


const viewId = randomViewId();

export function getViewId(): string {
  return viewId
}

function randomUserId(): string {
  return `u_${uuidv4()}`
}

function randomSessionId(): string {
  return `s_${uuidv4()}`
}

function randomViewId(): string {
  return `v_${uuidv4()}`
}

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
