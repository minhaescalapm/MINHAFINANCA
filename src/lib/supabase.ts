import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Usuario,
  ContaBancaria,
  CartaoCredito,
  Transacao,
  Devedor,
  ContaAPagar,
} from '../types';

// Supabase configuration storage keys
const STORAGE_KEYS = {
  SUPABASE_URL: 'gpwa_supabase_url',
  SUPABASE_ANON_KEY: 'gpwa_supabase_anon_key',
  LOCAL_DB: 'gpwa_local_database_v1',
  CURRENT_USER: 'gpwa_current_user',
};

// Default Project Supabase Credentials provided by master user
const DEFAULT_SUPABASE_URL = 'https://ulqfqnnbcfrqfncpxufp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscWZxbm5iY2ZycWZuY3B4dWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDg1OTcsImV4cCI6MjEwMjkyNDU5N30.Bhwt0f6umaG1iHZbw3XWcYv2o37_eB6P06WLC11NaII';

// Retrieve configured Supabase credentials or environment variables
export function getSupabaseCredentials(): { url: string; anonKey: string; isCustom: boolean } {
  const customUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const customKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  let cleanedUrl = (customUrl || envUrl || DEFAULT_SUPABASE_URL).trim();
  if (cleanedUrl) {
    cleanedUrl = cleanedUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
  const anonKey = (customKey || envKey || DEFAULT_SUPABASE_ANON_KEY).trim();

  return {
    url: cleanedUrl,
    anonKey: anonKey,
    isCustom: Boolean(customUrl || customKey || DEFAULT_SUPABASE_URL),
  };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string) {
  if (url.trim()) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  }

  if (anonKey.trim()) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  }

  // Reset cached client
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;

  try {
    if (!cachedClient) {
      cachedClient = createClient(url, anonKey);
    }
    return cachedClient;
  } catch (error) {
    console.error('Erro ao inicializar cliente Supabase:', error);
    return null;
  }
}

// ----------------------------------------------------
// DEFAULT SEED DATA (Clean Empty State)
// ----------------------------------------------------
const SEED_USER_ID = 'usr_master_21975151937';

export const INITIAL_SEED_DATA = {
  usuarios: [
    {
      id: SEED_USER_ID,
      nome: 'Administrador Master',
      telefone: '21975151937',
      senha: '050805',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    },
  ] as Usuario[],

  contas_bancarias: [] as ContaBancaria[],
  cartoes_credito: [] as CartaoCredito[],
  devedores: [] as Devedor[],
  contas_a_pagar: [] as ContaAPagar[],
  transacoes: [] as Transacao[],
};

// ----------------------------------------------------
// LOCAL DATABASE HELPER (State persistence)
// ----------------------------------------------------
function getLocalDB(): typeof INITIAL_SEED_DATA {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_DB);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_DB, JSON.stringify(INITIAL_SEED_DATA));
    return INITIAL_SEED_DATA;
  }
  try {
    const parsed = JSON.parse(data);
    let changed = false;

    // Purge any old mock/seed data that might be stuck in user's browser localStorage
    if (parsed) {
      if (Array.isArray(parsed.contas_bancarias)) {
        const cleaned = parsed.contas_bancarias.filter(
          (c: ContaBancaria) => !c.id.startsWith('cta_nu_01') && !c.id.startsWith('cta_itau_02') && !c.id.startsWith('cta_inter_03') && !c.id.startsWith('cta_caixa_04')
        );
        if (cleaned.length !== parsed.contas_bancarias.length) {
          parsed.contas_bancarias = cleaned;
          changed = true;
        }
      }
      if (Array.isArray(parsed.cartoes_credito)) {
        const cleaned = parsed.cartoes_credito.filter(
          (c: CartaoCredito) => !c.id.startsWith('crt_black_01') && !c.id.startsWith('crt_itau_02')
        );
        if (cleaned.length !== parsed.cartoes_credito.length) {
          parsed.cartoes_credito = cleaned;
          changed = true;
        }
      }
      if (Array.isArray(parsed.devedores)) {
        const cleaned = parsed.devedores.filter(
          (d: Devedor) => !d.id.startsWith('dev_zafira_00') && !d.id.startsWith('dev_civic_01') && !d.id.startsWith('dev_consultoria_02') && !d.id.startsWith('dev_reforma_03')
        );
        if (cleaned.length !== parsed.devedores.length) {
          parsed.devedores = cleaned;
          changed = true;
        }
      }
      if (Array.isArray(parsed.contas_a_pagar)) {
        const cleaned = parsed.contas_a_pagar.filter(
          (c: ContaAPagar) => !c.id.startsWith('cap_hilux_01') && !c.id.startsWith('cap_galpao_02') && !c.id.startsWith('cap_servidores_03')
        );
        if (cleaned.length !== parsed.contas_a_pagar.length) {
          parsed.contas_a_pagar = cleaned;
          changed = true;
        }
      }
      if (Array.isArray(parsed.transacoes)) {
        const cleaned = parsed.transacoes.filter(
          (t: Transacao) =>
            !t.id.startsWith('trx_01') &&
            !t.id.startsWith('trx_02') &&
            !t.id.startsWith('trx_03') &&
            !t.id.startsWith('trx_04') &&
            !t.id.startsWith('trx_05') &&
            !t.id.startsWith('trx_06')
        );
        if (cleaned.length !== parsed.transacoes.length) {
          parsed.transacoes = cleaned;
          changed = true;
        }
      }
      if (Array.isArray(parsed.usuarios)) {
        const hasMaster = parsed.usuarios.some(
          (u: Usuario) => u.telefone.replace(/\D/g, '') === '21975151937'
        );
        if (!hasMaster) {
          parsed.usuarios.unshift(INITIAL_SEED_DATA.usuarios[0]);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.LOCAL_DB, JSON.stringify(parsed));
      }
    }
    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEYS.LOCAL_DB, JSON.stringify(INITIAL_SEED_DATA));
    return INITIAL_SEED_DATA;
  }
}

function saveLocalDB(db: typeof INITIAL_SEED_DATA) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_DB, JSON.stringify(db));
}

/**
 * Desativado para impedir qualquer lançamento automático de dados ou seeds.
 */
export async function syncLocalSeedToSupabaseIfEmpty(_userId: string) {
  // Intencionalmente vazio - não lançar nada automático
  return;
}

/**
 * Verifica o status de saúde da conexão com o Supabase
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { connected: false, message: 'Chaves do Supabase não configuradas.' };
  }

  try {
    const { data, error } = await supabase.from('usuarios').select('id').limit(1);
    if (error) {
      return { connected: false, message: 'Erro de permissão ou tabela no Supabase.', error: error.message };
    }
    return { connected: true, message: 'Conectado em tempo real com a nuvem Supabase!' };
  } catch (e: any) {
    return { connected: false, message: 'Falha de conexão com o Supabase.', error: e?.message };
  }
}

// ----------------------------------------------------
// SUPABASE / LOCAL API LAYER
// ----------------------------------------------------

/**
 * Autenticação via Telefone e Senha na tabela "usuarios"
 */
export async function authenticateUser(telefone: string, senha: string): Promise<{ user: Usuario | null; error: string | null }> {
  const cleanPhone = telefone.replace(/\D/g, '');
  const supabase = getSupabaseClient();

  // If master user credentials
  if (cleanPhone === '21975151937' && senha === '050805') {
    const masterUser: Usuario = {
      id: SEED_USER_ID,
      nome: 'Administrador Master',
      telefone: '21975151937',
      senha: '050805',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('telefone', cleanPhone)
          .maybeSingle();

        if (!error && data) {
          return { user: data as Usuario, error: null };
        } else if (!data) {
          // Auto create in Supabase if table exists
          await supabase.from('usuarios').upsert([masterUser]);
        }
      } catch (e) {
        console.warn('Supabase master auth check:', e);
      }
    }

    // Ensure present in local DB
    const db = getLocalDB();
    const existingIndex = db.usuarios.findIndex((u) => u.telefone.replace(/\D/g, '') === cleanPhone);
    if (existingIndex >= 0) {
      db.usuarios[existingIndex] = { ...db.usuarios[existingIndex], ...masterUser };
    } else {
      db.usuarios.unshift(masterUser);
    }
    saveLocalDB(db);

    return { user: masterUser, error: null };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('telefone', cleanPhone)
        .eq('senha', senha)
        .maybeSingle();

      if (error) {
        console.warn('Supabase query error, fallbacking to local DB:', error);
      } else if (data) {
        return { user: data as Usuario, error: null };
      } else {
        return { user: null, error: 'Telefone ou senha incorretos no banco Supabase.' };
      }
    } catch (e: any) {
      console.warn('Supabase request failed, using local DB:', e);
    }
  }

  // Fallback to local DB
  const db = getLocalDB();
  const foundUser = db.usuarios.find(
    (u) => u.telefone.replace(/\D/g, '') === cleanPhone && u.senha === senha
  );

  if (foundUser) {
    return { user: foundUser, error: null };
  }

  return { user: null, error: 'Credenciais inválidas. Verifique o telefone e a senha informados.' };
}

/**
 * Cadastro de novo usuário
 */
export async function registerUser(nome: string, telefone: string, senha: string): Promise<{ user: Usuario | null; error: string | null }> {
  const cleanPhone = telefone.replace(/\D/g, '');
  const supabase = getSupabaseClient();
  const newUser: Usuario = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    nome: nome.trim(),
    telefone: cleanPhone,
    senha,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanPhone}`,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      // Check existing
      const { data: existing } = await supabase
        .from('usuarios')
        .select('id')
        .eq('telefone', cleanPhone)
        .maybeSingle();

      if (existing) {
        return { user: null, error: 'Já existe um usuário cadastrado com este telefone.' };
      }

      const { data, error } = await supabase
        .from('usuarios')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert failed:', error);
      } else if (data) {
        return { user: data as Usuario, error: null };
      }
    } catch (e) {
      console.warn('Supabase register error:', e);
    }
  }

  // Fallback / Local DB
  const db = getLocalDB();
  if (db.usuarios.some((u) => u.telefone.replace(/\D/g, '') === cleanPhone)) {
    return { user: null, error: 'Já existe um usuário cadastrado com este telefone.' };
  }

  db.usuarios.push(newUser);
  saveLocalDB(db);
  return { user: newUser, error: null };
}

// ----------------------------------------------------
// CONTAS BANCÁRIAS
// ----------------------------------------------------
export async function getContasBancarias(userId: string): Promise<ContaBancaria[]> {
  const db = getLocalDB();
  const localList = db.contas_bancarias.filter((c) => c.user_id === userId);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const remoteList = data as ContaBancaria[];
        db.contas_bancarias = db.contas_bancarias.filter((c) => c.user_id !== userId).concat(remoteList);
        saveLocalDB(db);
        return remoteList;
      }
    } catch (e) {
      console.warn('Supabase error on getContasBancarias:', e);
    }
  }

  return localList;
}

export async function saveContaBancaria(conta: Omit<ContaBancaria, 'id' | 'created_at'> & { id?: string }): Promise<ContaBancaria> {
  const id = conta.id || `cta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalConta: ContaBancaria = { ...conta, id, created_at };

  // 1. Salva imediatamente no LocalDB para resposta instantânea e garantida
  const db = getLocalDB();
  const idx = db.contas_bancarias.findIndex((c) => c.id === id);
  if (idx >= 0) {
    db.contas_bancarias[idx] = finalConta;
  } else {
    db.contas_bancarias.unshift(finalConta);
  }
  saveLocalDB(db);

  // 2. Sincroniza com o Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .upsert([finalConta], { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) return data as ContaBancaria;
    } catch (e) {
      console.warn('Supabase saveContaBancaria error:', e);
    }
  }

  return finalConta;
}

export async function deleteContaBancaria(contaId: string): Promise<boolean> {
  const db = getLocalDB();
  db.contas_bancarias = db.contas_bancarias.filter((c) => c.id !== contaId);
  saveLocalDB(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('contas_bancarias').delete().eq('id', contaId);
    } catch (e) {
      console.warn('Supabase deleteContaBancaria error:', e);
    }
  }
  return true;
}

// ----------------------------------------------------
// CARTÕES DE CRÉDITO
// ----------------------------------------------------
export async function getCartoesCredito(userId: string): Promise<CartaoCredito[]> {
  const db = getLocalDB();
  const localList = db.cartoes_credito.filter((c) => c.user_id === userId);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cartoes_credito')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const remoteList = data as CartaoCredito[];
        db.cartoes_credito = db.cartoes_credito.filter((c) => c.user_id !== userId).concat(remoteList);
        saveLocalDB(db);
        return remoteList;
      }
    } catch (e) {
      console.warn('Supabase error on getCartoesCredito:', e);
    }
  }

  return localList;
}

export async function saveCartaoCredito(cartao: Omit<CartaoCredito, 'id' | 'created_at'> & { id?: string }): Promise<CartaoCredito> {
  const id = cartao.id || `crt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalCartao: CartaoCredito = { ...cartao, id, created_at };

  // 1. Salva imediatamente no LocalDB
  const db = getLocalDB();
  const idx = db.cartoes_credito.findIndex((c) => c.id === id);
  if (idx >= 0) {
    db.cartoes_credito[idx] = finalCartao;
  } else {
    db.cartoes_credito.unshift(finalCartao);
  }
  saveLocalDB(db);

  // 2. Sincroniza com o Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cartoes_credito')
        .upsert([finalCartao], { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) return data as CartaoCredito;
    } catch (e) {
      console.warn('Supabase saveCartaoCredito error:', e);
    }
  }

  return finalCartao;
}

export async function deleteCartaoCredito(cartaoId: string): Promise<boolean> {
  const db = getLocalDB();
  db.cartoes_credito = db.cartoes_credito.filter((c) => c.id !== cartaoId);
  saveLocalDB(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('cartoes_credito').delete().eq('id', cartaoId);
    } catch (e) {
      console.warn('Supabase deleteCartaoCredito error:', e);
    }
  }
  return true;
}

// ----------------------------------------------------
// TRANSAÇÕES (FLUXO DE CAIXA)
// ----------------------------------------------------
export async function getTransacoes(userId: string): Promise<Transacao[]> {
  const db = getLocalDB();
  const localList = db.transacoes.filter((t) => t.user_id === userId);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false });

      if (!error && Array.isArray(data)) {
        const remoteList = data as Transacao[];
        db.transacoes = db.transacoes.filter((t) => t.user_id !== userId).concat(remoteList);
        saveLocalDB(db);
        return remoteList.sort(
          (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
        );
      }
    } catch (e) {
      console.warn('Supabase error on getTransacoes:', e);
    }
  }

  return localList.sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );
}

export async function createTransacao(transacao: Omit<Transacao, 'id' | 'created_at'> & { id?: string }): Promise<Transacao> {
  const id = transacao.id || `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalTrx: Transacao = { ...transacao, id, created_at };

  // 1. Salva imediatamente no LocalDB
  const db = getLocalDB();
  db.transacoes.unshift(finalTrx);
  saveLocalDB(db);

  // 2. Sincroniza com o Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .upsert([finalTrx], { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) return data as Transacao;
    } catch (e) {
      console.warn('Supabase createTransacao error:', e);
    }
  }

  return finalTrx;
}

export async function deleteTransacao(transacaoId: string): Promise<boolean> {
  const db = getLocalDB();
  db.transacoes = db.transacoes.filter((t) => t.id !== transacaoId);
  saveLocalDB(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('transacoes').delete().eq('id', transacaoId);
    } catch (e) {
      console.warn('Supabase deleteTransacao error:', e);
    }
  }
  return true;
}

// ----------------------------------------------------
// DEVEDORES (CONTAS A RECEBER)
// ----------------------------------------------------
export async function getDevedores(userId: string): Promise<Devedor[]> {
  const db = getLocalDB();
  const localList = db.devedores.filter((d) => d.user_id === userId);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('devedores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const remoteList = data as Devedor[];
        db.devedores = db.devedores.filter((d) => d.user_id !== userId).concat(remoteList);
        saveLocalDB(db);
        return remoteList;
      }
    } catch (e) {
      console.warn('Supabase error on getDevedores:', e);
    }
  }

  return localList;
}

export async function saveDevedor(devedor: Omit<Devedor, 'id' | 'created_at'> & { id?: string }): Promise<Devedor> {
  const id = devedor.id || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalDevedor: Devedor = { ...devedor, id, created_at };

  // 1. Salva imediatamente no LocalDB
  const db = getLocalDB();
  const idx = db.devedores.findIndex((d) => d.id === id);
  if (idx >= 0) {
    db.devedores[idx] = finalDevedor;
  } else {
    db.devedores.unshift(finalDevedor);
  }
  saveLocalDB(db);

  // 2. Sincroniza com o Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('devedores')
        .upsert([finalDevedor], { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) return data as Devedor;
    } catch (e) {
      console.warn('Supabase saveDevedor error:', e);
    }
  }

  return finalDevedor;
}

export async function deleteDevedor(devedorId: string): Promise<boolean> {
  const db = getLocalDB();
  db.devedores = db.devedores.filter((d) => d.id !== devedorId);
  saveLocalDB(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('devedores').delete().eq('id', devedorId);
    } catch (e) {
      console.warn('Supabase deleteDevedor error:', e);
    }
  }
  return true;
}

/**
 * Registra o pagamento de uma ou mais parcelas do devedor e automaticamente cria a Entrada na Conta Bancária vinculada.
 */
export async function registrarPagamentoDevedor(
  devedor: Devedor,
  valorRecebido: number,
  contaDestinoId: string,
  observacao?: string
): Promise<{ updatedDevedor: Devedor; transacao: Transacao }> {
  const valorUnitParcela = devedor.valor_total / Math.max(1, devedor.qtd_parcelas);
  const parcelasPagasAdd = Math.max(1, Math.round(valorRecebido / valorUnitParcela));

  const novoValorPago = Math.min(devedor.valor_total, devedor.valor_pago + valorRecebido);
  const novasParcelasPagas = Math.min(devedor.qtd_parcelas, devedor.parcelas_pagas + parcelasPagasAdd);
  const novoStatus = novoValorPago >= devedor.valor_total ? ('quitado' as const) : ('parcial' as const);

  const updatedDevedor: Devedor = {
    ...devedor,
    valor_pago: novoValorPago,
    parcelas_pagas: novasParcelasPagas,
    status: novoStatus,
    conta_destino_id: contaDestinoId || devedor.conta_destino_id,
  };

  await saveDevedor(updatedDevedor);

  // Lança Entrada na Conta Bancária
  const transacao = await createTransacao({
    user_id: devedor.user_id,
    descricao: `Recebimento: ${devedor.nome} - ${devedor.item_servico} (Parc. ${novasParcelasPagas}/${devedor.qtd_parcelas})`,
    valor: valorRecebido,
    tipo: 'entrada',
    categoria: 'Contas a Receber (Devedores)',
    conta_id: contaDestinoId,
    data: new Date().toISOString().split('T')[0],
    observacao: observacao || `Recebimento de parcela referente a ${devedor.item_servico}`,
    devedor_id: devedor.id,
  });

  return { updatedDevedor, transacao };
}

/**
 * Desfaz/Exclui o pagamento de uma parcela de devedor (caso o usuário tenha clicado por engano)
 * e retorna os dias de cobrança ao cronograma correto.
 */
export async function desfazerPagamentoDevedor(
  devedor: Devedor,
  qtdParcelasADesfazer: number = 1
): Promise<{ updatedDevedor: Devedor }> {
  if (devedor.parcelas_pagas <= 0) {
    return { updatedDevedor: devedor };
  }

  const valorUnitParcela =
    devedor.valor_parcela || devedor.valor_total / Math.max(1, devedor.qtd_parcelas);
  const qtdEstorno = Math.min(devedor.parcelas_pagas, Math.max(1, qtdParcelasADesfazer));
  const novasParcelasPagas = Math.max(0, devedor.parcelas_pagas - qtdEstorno);
  const valorEstorno = valorUnitParcela * qtdEstorno;
  const novoValorPago = Math.max(0, devedor.valor_pago - valorEstorno);
  const novoStatus = novasParcelasPagas === 0 ? ('pendente' as const) : ('parcial' as const);

  const updatedDevedor: Devedor = {
    ...devedor,
    valor_pago: novoValorPago,
    parcelas_pagas: novasParcelasPagas,
    status: novoStatus,
  };

  await saveDevedor(updatedDevedor);

  // Remove a última transação de entrada associada a esse devedor se existir
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: lastTx } = await supabase
        .from('transacoes')
        .select('id')
        .eq('devedor_id', devedor.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastTx?.id) {
        await supabase.from('transacoes').delete().eq('id', lastTx.id);
      }
    } catch (e) {
      console.warn('Erro ao remover transacao vinculada:', e);
    }
  }

  const db = getLocalDB();
  const txIdx = db.transacoes.findIndex((t) => t.devedor_id === devedor.id);
  if (txIdx >= 0) {
    db.transacoes.splice(txIdx, 1);
    saveLocalDB(db);
  }

  return { updatedDevedor };
}

// ----------------------------------------------------
// CONTAS A PAGAR
// ----------------------------------------------------
export async function getContasAPagar(userId: string): Promise<ContaAPagar[]> {
  const db = getLocalDB();
  const localList = db.contas_a_pagar.filter((c) => c.user_id === userId);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .select('*')
        .eq('user_id', userId)
        .order('vencimento', { ascending: true });

      if (!error && Array.isArray(data)) {
        const remoteList = data as ContaAPagar[];
        db.contas_a_pagar = db.contas_a_pagar.filter((c) => c.user_id !== userId).concat(remoteList);
        saveLocalDB(db);
        return remoteList;
      }
    } catch (e) {
      console.warn('Supabase error on getContasAPagar:', e);
    }
  }

  return localList;
}

export async function saveContaAPagar(conta: Omit<ContaAPagar, 'id' | 'created_at'> & { id?: string }): Promise<ContaAPagar> {
  const id = conta.id || `cap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalConta: ContaAPagar = { ...conta, id, created_at };

  // 1. Salva imediatamente no LocalDB
  const db = getLocalDB();
  const idx = db.contas_a_pagar.findIndex((c) => c.id === id);
  if (idx >= 0) {
    db.contas_a_pagar[idx] = finalConta;
  } else {
    db.contas_a_pagar.unshift(finalConta);
  }
  saveLocalDB(db);

  // 2. Sincroniza com o Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .upsert([finalConta], { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) return data as ContaAPagar;
    } catch (e) {
      console.warn('Supabase saveContaAPagar error:', e);
    }
  }

  return finalConta;
}

export async function deleteContaAPagar(contaId: string): Promise<boolean> {
  const db = getLocalDB();
  db.contas_a_pagar = db.contas_a_pagar.filter((c) => c.id !== contaId);
  saveLocalDB(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('contas_a_pagar').delete().eq('id', contaId);
    } catch (e) {
      console.warn('Supabase deleteContaAPagar error:', e);
    }
  }
  return true;
}

/**
 * Paga uma parcela da Conta a Pagar e lança a Saída na Conta Bancária.
 */
export async function pagarParcelaContaAPagar(
  conta: ContaAPagar,
  valorPago: number,
  contaOrigemId: string,
  observacao?: string
): Promise<{ updatedConta: ContaAPagar; transacao: Transacao }> {
  const valorUnitPrestacao = conta.valor_total / Math.max(1, conta.qtd_prestacoes);
  const prestacoesPagasAdd = Math.max(1, Math.round(valorPago / valorUnitPrestacao));

  const novoValorPago = Math.min(conta.valor_total, conta.valor_pago + valorPago);
  const novasPrestacoesPagas = Math.min(conta.qtd_prestacoes, conta.prestacoes_pagas + prestacoesPagasAdd);
  const novoStatus = novoValorPago >= conta.valor_total ? ('quitado' as const) : ('parcial' as const);

  const updatedConta: ContaAPagar = {
    ...conta,
    valor_pago: novoValorPago,
    prestacoes_pagas: novasPrestacoesPagas,
    status: novoStatus,
    conta_padrao_id: contaOrigemId || conta.conta_padrao_id,
  };

  await saveContaAPagar(updatedConta);

  // Lança Saída na Conta Bancária
  const transacao = await createTransacao({
    user_id: conta.user_id,
    descricao: `Pagamento: ${conta.descricao} - ${conta.fornecedor_credor} (Parc. ${novasPrestacoesPagas}/${conta.qtd_prestacoes})`,
    valor: valorPago,
    tipo: 'saida',
    categoria: conta.categoria || 'Contas a Pagar',
    conta_id: contaOrigemId,
    data: new Date().toISOString().split('T')[0],
    observacao: observacao || `Pagamento de parcela referente a ${conta.descricao}`,
    conta_a_pagar_id: conta.id,
  });

  return { updatedConta, transacao };
}

// ----------------------------------------------------
// ZERAR TODOS OS DADOS DO USUÁRIO
// ----------------------------------------------------
export async function zerarTodosDados(userId: string): Promise<void> {
  const db = getLocalDB();
  db.contas_bancarias = db.contas_bancarias.filter((c) => c.user_id !== userId);
  db.cartoes_credito = db.cartoes_credito.filter((c) => c.user_id !== userId);
  db.devedores = db.devedores.filter((d) => d.user_id !== userId);
  db.contas_a_pagar = db.contas_a_pagar.filter((c) => c.user_id !== userId);
  db.transacoes = db.transacoes.filter((t) => t.user_id !== userId);
  saveLocalDB(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await Promise.allSettled([
        supabase.from('transacoes').delete().eq('user_id', userId),
        supabase.from('devedores').delete().eq('user_id', userId),
        supabase.from('contas_a_pagar').delete().eq('user_id', userId),
        supabase.from('cartoes_credito').delete().eq('user_id', userId),
        supabase.from('contas_bancarias').delete().eq('user_id', userId),
      ]);
    } catch (e) {
      console.warn('Supabase zerarTodosDados warning:', e);
    }
  }
}

export async function zerarTransacoesApenas(userId: string): Promise<void> {
  const db = getLocalDB();
  db.transacoes = db.transacoes.filter((t) => t.user_id !== userId);
  saveLocalDB(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('transacoes').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Supabase zerarTransacoesApenas warning:', e);
    }
  }
}

// ----------------------------------------------------
// SQL DDL SCHEMA GENERATOR FOR SUPABASE
// ----------------------------------------------------
export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- SCRIPT SQL COMPLETO PARA CRIAR O BANCO DE DADOS NO SUPABASE
-- Execute no SQL Editor do Supabase (supabase.com/dashboard)
-- ==========================================================

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Contas Bancárias
CREATE TABLE IF NOT EXISTS contas_bancarias (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    instituicao TEXT NOT NULL,
    tipo TEXT NOT NULL,
    saldo_inicial NUMERIC(15,2) DEFAULT 0,
    cor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Cartões de Crédito
CREATE TABLE IF NOT EXISTS cartoes_credito (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    bandeira TEXT NOT NULL,
    limite_total NUMERIC(15,2) NOT NULL,
    fatura_atual NUMERIC(15,2) DEFAULT 0,
    total_gasto_acumulado NUMERIC(15,2) DEFAULT 0,
    dia_vencimento INTEGER NOT NULL,
    melhor_dia_compra INTEGER NOT NULL,
    cor TEXT,
    conta_debito_id TEXT,
    numero_cartao TEXT,
    data_expiracao TEXT,
    codigo_compra TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Transações (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS transacoes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    tipo TEXT NOT NULL, -- 'entrada' ou 'saida'
    categoria TEXT NOT NULL,
    conta_id TEXT,
    cartao_id TEXT,
    data DATE NOT NULL,
    observacao TEXT,
    comprovante TEXT,
    devedor_id TEXT,
    conta_a_pagar_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Contas a Receber (Devedores)
CREATE TABLE IF NOT EXISTS devedores (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    item_servico TEXT NOT NULL,
    valor_total NUMERIC(15,2) NOT NULL,
    valor_parcela NUMERIC(15,2),
    qtd_parcelas INTEGER NOT NULL,
    parcelas_pagas INTEGER DEFAULT 0,
    valor_pago NUMERIC(15,2) DEFAULT 0,
    data_inicio DATE NOT NULL,
    conta_destino_id TEXT,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Contas a Pagar
CREATE TABLE IF NOT EXISTS contas_a_pagar (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    descricao TEXT NOT NULL,
    fornecedor_credor TEXT NOT NULL,
    valor_total NUMERIC(15,2) NOT NULL,
    qtd_prestacoes INTEGER NOT NULL,
    prestacoes_pagas INTEGER DEFAULT 0,
    valor_pago NUMERIC(15,2) DEFAULT 0,
    vencimento DATE NOT NULL,
    categoria TEXT NOT NULL,
    conta_padrao_id TEXT,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- HABILITAR REALTIME (SINCRONIZAÇÃO INSTANTÂNEA CELULAR/PC)
-- ==========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE usuarios;
ALTER PUBLICATION supabase_realtime ADD TABLE contas_bancarias;
ALTER PUBLICATION supabase_realtime ADD TABLE cartoes_credito;
ALTER PUBLICATION supabase_realtime ADD TABLE transacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE devedores;
ALTER PUBLICATION supabase_realtime ADD TABLE contas_a_pagar;

-- ==========================================================
-- POLÍTICAS DE ACESSO (PERMITIR LEITURA E GRAVAÇÃO COM CHAVE ANON)
-- ==========================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_a_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso completo usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo contas_bancarias" ON contas_bancarias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo cartoes_credito" ON cartoes_credito FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo transacoes" ON transacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo devedores" ON devedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo contas_a_pagar" ON contas_a_pagar FOR ALL USING (true) WITH CHECK (true);

-- ==========================================================
-- USUÁRIO MASTER INICIAL (ACESSO TOTAL)
-- ==========================================================
INSERT INTO usuarios (id, nome, telefone, senha)
VALUES ('usr_master_21975151937', 'Administrador Master', '21975151937', '050805')
ON CONFLICT (telefone) DO NOTHING;
`;
