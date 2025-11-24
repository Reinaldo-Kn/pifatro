import pbClient from '../utils/pocketbaseClient.js';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
    this.containerId = 'pb-login-ui';
  }

  create() {
    // ensure pb is initialized
    try {
      pbClient.initPocketBase();
    } catch (e) {
      // ignore if already initialized
    }

    // create a simple HTML form overlay (appended to document.body)
    const existing = document.getElementById(this.containerId);
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = `${this.containerId}-style`;
    style.innerHTML = `
      #${this.containerId} { position:fixed; left:50%; top:12%; transform:translateX(-50%); z-index:9999; background:rgba(0,0,0,0.8); padding:16px; color:#fff; border-radius:8px; font-family: Arial, sans-serif; }
      #${this.containerId} input { display:block; margin:8px 0; padding:8px; width:320px; }
      #${this.containerId} button { margin-right:8px; padding:8px 12px; }
      #${this.containerId} .msg { margin-top:8px; color:#ffdddd; }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = this.containerId;

    container.innerHTML = `
      <div style="font-weight:700; margin-bottom:8px">Pifatro — Login / Signup</div>
      <input id="pb-email" type="email" placeholder="email@example.com" />
      <input id="pb-password" type="password" placeholder="password" />
      <div>
        <button id="pb-login">Login</button>
        <button id="pb-signup">Sign Up</button>
        <button id="pb-guest">Continue as Guest</button>
      </div>
      <div class="msg" id="pb-msg"></div>
      <pre id="pb-debug" style="max-height:160px; overflow:auto; background:#111; color:#ddd; padding:8px; margin-top:8px; display:none; white-space:pre-wrap; font-size:12px;"></pre>
    `;

    document.body.appendChild(container);

    const emailInput = container.querySelector('#pb-email');
    const passwordInput = container.querySelector('#pb-password');
    const loginBtn = container.querySelector('#pb-login');
    const signupBtn = container.querySelector('#pb-signup');
    const guestBtn = container.querySelector('#pb-guest');
    const msg = container.querySelector('#pb-msg');
    const debug = container.querySelector('#pb-debug');

    const formatPbError = (err) => {
      try {
        const data = err?.data || err?.response || null;
        if (data && data.data) {
          // validation errors: data.data is an object
          return Object.entries(data.data).map(([k, v]) => `${k}: ${v.message || JSON.stringify(v)}`).join(' | ');
        }
        if (data && data.message) return data.message;
        return err.message || String(err);
      } catch (e) {
        return String(err);
      }
    };

    loginBtn.addEventListener('click', async () => {
      msg.textContent = 'Signing in...';
      try {
        await pbClient.loginWithEmail(emailInput.value, passwordInput.value);
        msg.textContent = 'Signed in';
        this.onAuthenticated();
        } catch (err) {
        console.error('Login error', err);
        msg.textContent = 'Login failed: ' + formatPbError(err);
        try { debug.style.display = 'block'; debug.textContent = JSON.stringify(err, Object.getOwnPropertyNames(err), 2); } catch(e){ debug.textContent = String(err); }
      }
    });

    signupBtn.addEventListener('click', async () => {
      msg.textContent = 'Signing up...';
      try {
        await pbClient.signUp(emailInput.value, passwordInput.value, passwordInput.value, emailInput.value.split('@')[0] || 'player');
        // after signup, automatically login
        await pbClient.loginWithEmail(emailInput.value, passwordInput.value);
        msg.textContent = 'Signed up and logged in';
        this.onAuthenticated();
      } catch (err) {
        console.error('Signup error', err);
        msg.textContent = 'Signup failed: ' + formatPbError(err);
        try { debug.style.display = 'block'; debug.textContent = JSON.stringify(err, Object.getOwnPropertyNames(err), 2); } catch(e){ debug.textContent = String(err); }
      }
    });

    guestBtn.addEventListener('click', () => {
      // continue without auth
      this.onAuthenticated(true);
    });
  }

  onAuthenticated(guest = false) {
    const container = document.getElementById(this.containerId);
    const style = document.getElementById(`${this.containerId}-style`);
    if (container) container.remove();
    if (style) style.remove();

    // notify MainScene (if exists)
    const main = this.scene.get('MainScene');
    if (main) {
      main.events.emit('playerAuthenticated', { guest });
    }

    // stop this scene
    this.scene.stop();
  }

  // ensure cleanup if scene is shutdown
  shutdown() {
    const container = document.getElementById(this.containerId);
    const style = document.getElementById(`${this.containerId}-style`);
    if (container) container.remove();
    if (style) style.remove();
  }
}
