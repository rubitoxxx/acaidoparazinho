import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  updatePassword, 
  updateProfile, 
  onAuthStateChanged, 
  reload,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCXQAbdKb2CTPWtdlpVaOovatT_5lnunY",
  authDomain: "mega-attic-q1ttq.firebaseapp.com",
  projectId: "mega-attic-q1ttq",
  storageBucket: "mega-attic-q1ttq.firebasestorage.app",
  messagingSenderId: "426451644181",
  appId: "1:426451644181:web:06fb8dcb951e7f9edd831c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function formatarErroFirebase(error) {
  const code = error && error.code ? error.code : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado em nossa plataforma.';
    case 'auth/weak-password':
      return 'A senha deve ter no mínimo 8 caracteres.';
    case 'auth/invalid-email':
      return 'Por favor, digite um e-mail válido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas consecutivas. Por favor, aguarde alguns minutos e tente novamente.';
    case 'auth/popup-closed-by-user':
      return 'A janela do Google foi fechada antes da conclusão.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela pop-up do Google. Por favor, permita pop-ups para este site e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'O login com Google precisa ser ativado no Firebase Console (Authentication > Sign-in method > Google).';
    case 'auth/unauthorized-domain':
      return 'Este domínio precisa ser adicionado aos "Domínios Autorizados" no Firebase Console (Authentication > Settings > Authorized domains).';
    case 'auth/requires-recent-login':
      return 'Para sua segurança, faça login novamente antes de alterar a senha.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com a internet. Verifique sua rede.';
    default:
      return error.message || 'Ocorreu um erro ao processar sua solicitação.';
  }
}

async function salvarPerfilFirestore(user, dadosAdicionais = {}) {
  try {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const payload = {
      firebaseUid: user.uid,
      email: user.email || '',
      nome: user.displayName || dadosAdicionais.nome || 'Cliente',
      foto: user.photoURL || '',
      emailVerified: user.emailVerified || user.providerData.some(p => p.providerId === 'google.com'),
      updatedAt: new Date().toISOString()
    };
    if (dadosAdicionais.telefone) {
      payload.telefone = dadosAdicionais.telefone;
    }
    if (!snap.exists()) {
      payload.createdAt = new Date().toISOString();
    }
    await setDoc(userRef, payload, { merge: true });
  } catch (e) {
    console.error("Erro ao salvar perfil no Firestore:", e);
  }
}

export const FirebaseAuth = {
  auth,
  db,
  formatarErroFirebase,

  getUsuarioAtual() {
    return auth.currentUser;
  },

  onAuthChange(callback) {
    return this.observarEstadoAuth(callback);
  },

  observarEstadoAuth(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }

      await salvarPerfilFirestore(user);

      // Sincronizar com o backend Node/Prisma
      try {
        const response = await fetch('/api/auth/firebase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: user.uid,
            email: user.email || `${user.uid}@google.user`,
            nome: user.displayName || 'Cliente',
            telefone: user.phoneNumber || ''
          })
        });
        const data = await response.json();
        if (response.ok && data.user) {
          callback({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified || user.providerData.some(p => p.providerId === 'google.com'),
            syncedUser: data.user,
            token: data.tokens ? data.tokens.access : null
          });
          return;
        }
      } catch (err) {
        console.error("Erro ao sincronizar com backend:", err);
      }

      callback({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified || user.providerData.some(p => p.providerId === 'google.com'),
        syncedUser: {
          id: user.uid,
          nome: user.displayName || 'Cliente',
          email: user.email,
          firebaseUid: user.uid
        },
        token: null
      });
    });
  },

  async loginComEmail(email, senha) {
    try {
      if (!email || !senha) {
        throw new Error("Por favor, preencha o e-mail e a senha.");
      }
      const cred = await signInWithEmailAndPassword(auth, email.trim(), senha);
      await salvarPerfilFirestore(cred.user);
      return cred.user;
    } catch (e) {
      throw new Error(formatarErroFirebase(e));
    }
  },

  async cadastrarComEmail(nome, email, senha, confirmarSenha, telefone = '') {
    try {
      if (!nome || !email || !senha || !confirmarSenha) {
        throw new Error("Preencha todos os campos obrigatórios.");
      }
      if (senha.length < 8) {
        throw new Error("A senha deve conter pelo menos 8 caracteres.");
      }
      if (senha !== confirmarSenha) {
        throw new Error("A confirmação da senha não confere.");
      }

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      const user = cred.user;

      await updateProfile(user, { displayName: nome.trim() });
      await sendEmailVerification(user);
      await salvarPerfilFirestore(user, { nome: nome.trim(), telefone: telefone.trim() });

      return user;
    } catch (e) {
      throw new Error(formatarErroFirebase(e));
    }
  },

  async loginComGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      await salvarPerfilFirestore(cred.user);
      return cred.user;
    } catch (e) {
      throw new Error(formatarErroFirebase(e));
    }
  },

  async reenviarEmailVerificacao() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não está autenticado.");
      await sendEmailVerification(user);
      return true;
    } catch (e) {
      throw new Error(formatarErroFirebase(e));
    }
  },

  async verificarSeJaConfirmou() {
    try {
      const user = auth.currentUser;
      if (!user) return false;
      await reload(user);
      return auth.currentUser.emailVerified;
    } catch (e) {
      throw new Error(formatarErroFirebase(e));
    }
  },

  async enviarRecuperacaoSenha(email) {
    try {
      if (!email) throw new Error("Informe o seu e-mail.");
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (e) {
      throw new Error(formatarErroFirebase(e));
    }
  },

  async alterarSenhaLogado(senhaAtual, novaSenha, confirmarNovaSenha) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado.");
      if (!novaSenha || novaSenha.length < 8) {
        throw new Error("A nova senha deve ter no mínimo 8 caracteres.");
      }
      if (novaSenha !== confirmarNovaSenha) {
        throw new Error("A confirmação da nova senha não confere.");
      }

      // Se o usuário possui provedor de e-mail/senha, exige a senha atual para reautenticar
      const isEmailProvider = user.providerData.some(p => p.providerId === 'password');
      if (isEmailProvider) {
        if (!senhaAtual) throw new Error("Digite sua senha atual para confirmar a alteração.");
        const credential = EmailAuthProvider.credential(user.email, senhaAtual);
        await reauthenticateWithCredential(user, credential);
      }

      await updatePassword(user, novaSenha);
      return true;
    } catch (e) {
      throw new Error(formatarErroFirebase(e));
    }
  },

  getUsuarioAtual() {
    return auth.currentUser;
  },

  async logout() {
    try {
      await signOut(auth);
      return true;
    } catch (e) {
      throw new Error(formatarErroFirebase(e));
    }
  }
};

window.FirebaseAuth = FirebaseAuth;
