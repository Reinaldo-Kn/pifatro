import PocketBase from 'pocketbase';

let pb = null;

export function initPocketBase(url = '/') {
  pb = new PocketBase(url);
  return pb;
}

export function getPocketBase() {
  if (!pb) throw new Error('PocketBase not initialized. Call initPocketBase(url) first.');
  return pb;
}

export async function signUp(email, password, passwordConfirm, username) {
  if (!pb) throw new Error('PocketBase not initialized.');
  try {
    return await pb.collection('users').create({
      email,
      password,
      passwordConfirm,
      username,
    });
  } catch (err) {
    console.error('PocketBase signUp error:', err);
    throw err;
  }
}

export async function loginWithEmail(email, password) {
  if (!pb) throw new Error('PocketBase not initialized.');
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return authData;
  } catch (err) {
    console.error('PocketBase login error:', err);
    throw err;
  }
}

export function logout() {
  if (!pb) return;
  pb.authStore.clear();
}

export function getCurrentUser() {
  if (!pb) return null;
  return pb.authStore.model || null;
}


// `state` deve ser um objeto: { lives: number, coins: number, hand: Array }
export async function saveGameState(state) {
  if (!pb) throw new Error('PocketBase not initialized.');
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated.');

  const collection = pb.collection('game_states');

  // Tenta encontrar registro existente para este usuário; busca o mais recente primeiro
  const existingPage = await collection.getList(1, 1, { filter: `user = "${user.id}"`, sort: '-created' }).catch(() => null);
  const existing = existingPage && existingPage.items ? existingPage.items : [];

  const payload = {
    user: [user.id],
    lives: state.lives ?? 0,
    coins: state.coins ?? 0,
    // Armazena a mão como string JSON para manter a estrutura simples
    hand: JSON.stringify(state.hand ?? []),
    lastUpdated: new Date().toISOString(),
  };

  if (existing && existing.length > 0) {
    const id = existing[0].id; 
    console.log('Updating existing game_state id=', id);
    return await collection.update(id, payload);
  } else {
    console.log('Creating new game_state for user=', user.id);
    return await collection.create(payload);
  }
}

export async function loadGameState() {
  if (!pb) throw new Error('PocketBase not initialized.');
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated.');

  const collection = pb.collection('game_states');
  // busca o registro mais recente para este usuário
  const page = await collection.getList(1, 1, { filter: `user = "${user.id}"`, sort: '-created' }).catch(() => null);
  const items = page && page.items ? page.items : [];
  if (items && items.length > 0) {
    const rec = items[0];
    console.log('Loaded game_state id=', rec.id, 'created=', rec.created);
    return {
      lives: Math.max(0, Math.min(3, Number(rec.lives) || 0)),
      coins: rec.coins ?? 0,
      hand: (() => {
        try {
          return JSON.parse(rec.hand || '[]');
        } catch (e) {
          return [];
        }
      })(),
      created: rec.created || null,
      lastUpdated: rec.lastUpdated || null,
    };
  }
  return null;
}

export default {
  initPocketBase,
  getPocketBase,
  signUp,
  loginWithEmail,
  logout,
  getCurrentUser,
  saveGameState,
  loadGameState,
};
