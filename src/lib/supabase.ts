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

// Retrieve configured Supabase credentials or environment variables
export function getSupabaseCredentials(): { url: string; anonKey: string; isCustom: boolean } {
  const customUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const customKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  let cleanedUrl = (customUrl || envUrl || '').trim();
  if (cleanedUrl) {
    cleanedUrl = cleanedUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
  const anonKey = (customKey || envKey || '').trim();

  return {
    url: cleanedUrl,
    anonKey: anonKey,
    isCustom: Boolean(customUrl || customKey),
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
// DEFAULT SEED DATA (For Immediate Out-Of-The-Box Demo)
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

  contas_bancarias: [
    {
      id: 'cta_nu_01',
      user_id: SEED_USER_ID,
      nome: 'Nubank PJ Principal',
      instituicao: 'Nubank',
      tipo: 'pj' as const,
      saldo_inicial: 48500.0,
      cor: '#820ad1',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'cta_itau_02',
      user_id: SEED_USER_ID,
      nome: 'Itaú Personalité (PF)',
      instituicao: 'Itaú',
      tipo: 'corrente' as const,
      saldo_inicial: 22800.0,
      cor: '#ec7000',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'cta_inter_03',
      user_id: SEED_USER_ID,
      nome: 'Inter Investimentos (Reserva)',
      instituicao: 'Banco Inter',
      tipo: 'investimento' as const,
      saldo_inicial: 115000.0,
      cor: '#ff7a00',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'cta_caixa_04',
      user_id: SEED_USER_ID,
      nome: 'Caixa Físico / Cofre Operacional',
      instituicao: 'Espécie',
      tipo: 'caixa' as const,
      saldo_inicial: 6400.0,
      cor: '#10b981',
      created_at: '2026-01-10T10:00:00Z',
    },
  ] as ContaBancaria[],

  cartoes_credito: [
    {
      id: 'crt_black_01',
      user_id: SEED_USER_ID,
      nome: 'Nubank Ultravioleta Black',
      bandeira: 'mastercard' as const,
      limite_total: 50000.0,
      dia_vencimento: 10,
      melhor_dia_compra: 3,
      cor: '#820ad1',
      conta_debito_id: 'cta_nu_01',
      numero_cartao: '5428 9012 3456 1937',
      data_expiracao: '08/31',
      codigo_compra: '805',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'crt_itau_02',
      user_id: SEED_USER_ID,
      nome: 'ITAU',
      bandeira: 'mastercard' as const,
      limite_total: 20000.0,
      dia_vencimento: 10,
      melhor_dia_compra: 3,
      cor: '#18181b',
      conta_debito_id: 'cta_itau_02',
      numero_cartao: '4532 7810 9921 5193',
      data_expiracao: '12/29',
      codigo_compra: '508',
      created_at: '2026-01-10T10:00:00Z',
    },
  ] as CartaoCredito[],

  devedores: [
    {
      id: 'dev_zafira_00',
      user_id: SEED_USER_ID,
      nome: 'MAICON',
      telefone: '(11) 98888-7777',
      item_servico: 'ZAFIRA PRATA',
      valor_total: 42000.0,
      valor_parcela: 140.0,
      qtd_parcelas: 300,
      parcelas_pagas: 5,
      valor_pago: 700.0,
      data_inicio: '2026-08-21',
      conta_destino_id: 'cta_nu_01',
      status: 'parcial' as const,
      created_at: '2026-08-21T10:00:00Z',
    },
    {
      id: 'dev_civic_01',
      user_id: SEED_USER_ID,
      nome: 'Carlos Eduardo Fontes',
      telefone: '(11) 98765-4321',
      item_servico: 'Venda do Civic Touring G10',
      valor_total: 110000.0,
      valor_parcela: 11000.0,
      qtd_parcelas: 10,
      parcelas_pagas: 3,
      valor_pago: 33000.0,
      data_inicio: '2026-05-10',
      conta_destino_id: 'cta_nu_01',
      status: 'parcial' as const,
      created_at: '2026-05-10T10:00:00Z',
    },
    {
      id: 'dev_consultoria_02',
      user_id: SEED_USER_ID,
      nome: 'Nexus Logística & Transportes',
      telefone: '(19) 99123-9988',
      item_servico: 'Contrato de Consultoria Empresarial Q3',
      valor_total: 36000.0,
      qtd_parcelas: 4,
      parcelas_pagas: 2,
      valor_pago: 18000.0,
      data_inicio: '2026-07-01',
      conta_destino_id: 'cta_nu_01',
      status: 'parcial' as const,
      created_at: '2026-07-01T10:00:00Z',
    },
    {
      id: 'dev_reforma_03',
      user_id: SEED_USER_ID,
      nome: 'Marcos Vinícius Prado',
      telefone: '(11) 97711-2233',
      item_servico: 'Empréstimo Ponte / Reforma Apartamento',
      valor_total: 15000.0,
      qtd_parcelas: 3,
      parcelas_pagas: 0,
      valor_pago: 0.0,
      data_inicio: '2026-08-05',
      conta_destino_id: 'cta_itau_02',
      status: 'pendente' as const,
      created_at: '2026-08-05T10:00:00Z',
    },
  ] as Devedor[],

  contas_a_pagar: [
    {
      id: 'cap_hilux_01',
      user_id: SEED_USER_ID,
      descricao: 'Financiamento Hilux SRX 4x4',
      fornecedor_credor: 'Banco Toyota Finance',
      valor_total: 180000.0,
      qtd_prestacoes: 36,
      prestacoes_pagas: 14,
      valor_pago: 70000.0,
      vencimento: '2026-08-28',
      categoria: 'Veículos & Frota',
      conta_padrao_id: 'cta_nu_01',
      status: 'parcial' as const,
      created_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'cap_galpao_02',
      user_id: SEED_USER_ID,
      descricao: 'Aluguel do Galpão Logístico Matriz',
      fornecedor_credor: 'Imobiliária Alpha Prime',
      valor_total: 14400.0,
      qtd_prestacoes: 12,
      prestacoes_pagas: 7,
      valor_pago: 8400.0,
      vencimento: '2026-08-20',
      categoria: 'Imóveis & Infra',
      conta_padrao_id: 'cta_nu_01',
      status: 'vencendo' as const,
      created_at: '2026-01-05T10:00:00Z',
    },
    {
      id: 'cap_servidores_03',
      user_id: SEED_USER_ID,
      descricao: 'Infraestrutura Cloud & IA Dedicada',
      fornecedor_credor: 'Google Cloud & AWS',
      valor_total: 3850.0,
      qtd_prestacoes: 1,
      prestacoes_pagas: 0,
      valor_pago: 0.0,
      vencimento: '2026-08-25',
      categoria: 'Tecnologia & Servidores',
      conta_padrao_id: 'cta_nu_01',
      status: 'pendente' as const,
      created_at: '2026-08-01T10:00:00Z',
    },
  ] as ContaAPagar[],

  transacoes: [
    {
      id: 'trx_01',
      user_id: SEED_USER_ID,
      descricao: 'Parcela 03/10 - Venda do Civic Touring',
      valor: 11000.0,
      tipo: 'entrada' as const,
      categoria: 'Venda de Carros',
      conta_id: 'cta_nu_01',
      data: '2026-08-10',
      observacao: 'Recebido via Pix - Pagamento pontual do Carlos',
      devedor_id: 'dev_civic_01',
      created_at: '2026-08-10T14:30:00Z',
    },
    {
      id: 'trx_02',
      user_id: SEED_USER_ID,
      descricao: 'Pro-Labore / Retirada Executiva Mensal',
      valor: 25000.0,
      tipo: 'entrada' as const,
      categoria: 'Salário & Retirada',
      conta_id: 'cta_itau_02',
      data: '2026-08-05',
      observacao: 'Transferência automática da holding',
      created_at: '2026-08-05T09:00:00Z',
    },
    {
      id: 'trx_03',
      user_id: SEED_USER_ID,
      descricao: 'Prestação 14/36 - Financiamento Hilux SRX',
      valor: 5000.0,
      tipo: 'saida' as const,
      categoria: 'Veículos & Frota',
      conta_id: 'cta_nu_01',
      data: '2026-08-02',
      observacao: 'Débito automático Banco Toyota',
      conta_a_pagar_id: 'cap_hilux_01',
      created_at: '2026-08-02T11:00:00Z',
    },
    {
      id: 'trx_04',
      user_id: SEED_USER_ID,
      descricao: 'Abastecimento Frota & Gasolina Podium',
      valor: 850.0,
      tipo: 'saida' as const,
      categoria: 'Transporte & Combustível',
      cartao_id: 'crt_black_01',
      data: '2026-08-14',
      observacao: 'Posto Ipiranga Rodoanel',
      created_at: '2026-08-14T16:20:00Z',
    },
    {
      id: 'trx_05',
      user_id: SEED_USER_ID,
      descricao: 'Almoço de Negócios Diretoria',
      valor: 640.0,
      tipo: 'saida' as const,
      categoria: 'Alimentação & Negócios',
      cartao_id: 'crt_black_01',
      data: '2026-08-15',
      observacao: 'Restaurante Figueira Rubaiyat',
      created_at: '2026-08-15T13:40:00Z',
    },
    {
      id: 'trx_06',
      user_id: SEED_USER_ID,
      descricao: 'Licenças Software Adobe & Figma Enterprise',
      valor: 1420.0,
      tipo: 'saida' as const,
      categoria: 'Tecnologia & Softwares',
      cartao_id: 'crt_itau_02',
      data: '2026-08-12',
      observacao: 'Cobrança mensal em USD convertida',
      created_at: '2026-08-12T10:15:00Z',
    },
  ] as Transacao[],
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
    // Ensure the master user 21975151937 is always present with full access
    if (parsed && Array.isArray(parsed.usuarios)) {
      const hasMaster = parsed.usuarios.some(
        (u: Usuario) => u.telefone.replace(/\D/g, '') === '21975151937'
      );
      if (!hasMaster) {
        parsed.usuarios.unshift(INITIAL_SEED_DATA.usuarios[0]);
        localStorage.setItem(STORAGE_KEYS.LOCAL_DB, JSON.stringify(parsed));
      }
    }
    // Ensure devedores have MAICON / valor_parcela
    if (parsed && Array.isArray(parsed.devedores)) {
      const hasMaicon = parsed.devedores.some((d: Devedor) => d.nome.toUpperCase().includes('MAICON'));
      if (!hasMaicon) {
        parsed.devedores.unshift(INITIAL_SEED_DATA.devedores[0]);
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

export function resetLocalDatabaseToSeed() {
  localStorage.setItem(STORAGE_KEYS.LOCAL_DB, JSON.stringify(INITIAL_SEED_DATA));
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
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) return data as ContaBancaria[];
    } catch (e) {
      console.warn('Supabase error on getContasBancarias:', e);
    }
  }

  const db = getLocalDB();
  return db.contas_bancarias.filter((c) => c.user_id === userId);
}

export async function saveContaBancaria(conta: Omit<ContaBancaria, 'id' | 'created_at'> & { id?: string }): Promise<ContaBancaria> {
  const supabase = getSupabaseClient();
  const id = conta.id || `cta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalConta: ContaBancaria = { ...conta, id, created_at };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .upsert([finalConta])
        .select()
        .single();

      if (!error && data) return data as ContaBancaria;
    } catch (e) {
      console.warn('Supabase saveContaBancaria error:', e);
    }
  }

  const db = getLocalDB();
  const idx = db.contas_bancarias.findIndex((c) => c.id === id);
  if (idx >= 0) {
    db.contas_bancarias[idx] = finalConta;
  } else {
    db.contas_bancarias.unshift(finalConta);
  }
  saveLocalDB(db);
  return finalConta;
}

export async function deleteContaBancaria(contaId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('contas_bancarias').delete().eq('id', contaId);
    } catch (e) {
      console.warn('Supabase deleteContaBancaria error:', e);
    }
  }
  const db = getLocalDB();
  db.contas_bancarias = db.contas_bancarias.filter((c) => c.id !== contaId);
  saveLocalDB(db);
  return true;
}

// ----------------------------------------------------
// CARTÕES DE CRÉDITO
// ----------------------------------------------------
export async function getCartoesCredito(userId: string): Promise<CartaoCredito[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cartoes_credito')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) return data as CartaoCredito[];
    } catch (e) {
      console.warn('Supabase error on getCartoesCredito:', e);
    }
  }

  const db = getLocalDB();
  return db.cartoes_credito.filter((c) => c.user_id === userId);
}

export async function saveCartaoCredito(cartao: Omit<CartaoCredito, 'id' | 'created_at'> & { id?: string }): Promise<CartaoCredito> {
  const supabase = getSupabaseClient();
  const id = cartao.id || `crt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalCartao: CartaoCredito = { ...cartao, id, created_at };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cartoes_credito')
        .upsert([finalCartao])
        .select()
        .single();

      if (!error && data) return data as CartaoCredito;
    } catch (e) {
      console.warn('Supabase saveCartaoCredito error:', e);
    }
  }

  const db = getLocalDB();
  const idx = db.cartoes_credito.findIndex((c) => c.id === id);
  if (idx >= 0) {
    db.cartoes_credito[idx] = finalCartao;
  } else {
    db.cartoes_credito.unshift(finalCartao);
  }
  saveLocalDB(db);
  return finalCartao;
}

export async function deleteCartaoCredito(cartaoId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('cartoes_credito').delete().eq('id', cartaoId);
    } catch (e) {
      console.warn('Supabase deleteCartaoCredito error:', e);
    }
  }
  const db = getLocalDB();
  db.cartoes_credito = db.cartoes_credito.filter((c) => c.id !== cartaoId);
  saveLocalDB(db);
  return true;
}

// ----------------------------------------------------
// TRANSAÇÕES (FLUXO DE CAIXA)
// ----------------------------------------------------
export async function getTransacoes(userId: string): Promise<Transacao[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false });

      if (!error && data) return data as Transacao[];
    } catch (e) {
      console.warn('Supabase error on getTransacoes:', e);
    }
  }

  const db = getLocalDB();
  return (db.transacoes.filter((t) => t.user_id === userId) || []).sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );
}

export async function createTransacao(transacao: Omit<Transacao, 'id' | 'created_at'> & { id?: string }): Promise<Transacao> {
  const supabase = getSupabaseClient();
  const id = transacao.id || `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalTrx: Transacao = { ...transacao, id, created_at };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .insert([finalTrx])
        .select()
        .single();

      if (!error && data) return data as Transacao;
    } catch (e) {
      console.warn('Supabase createTransacao error:', e);
    }
  }

  const db = getLocalDB();
  db.transacoes.unshift(finalTrx);
  saveLocalDB(db);
  return finalTrx;
}

export async function deleteTransacao(transacaoId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('transacoes').delete().eq('id', transacaoId);
    } catch (e) {
      console.warn('Supabase deleteTransacao error:', e);
    }
  }
  const db = getLocalDB();
  db.transacoes = db.transacoes.filter((t) => t.id !== transacaoId);
  saveLocalDB(db);
  return true;
}

// ----------------------------------------------------
// DEVEDORES (CONTAS A RECEBER)
// ----------------------------------------------------
export async function getDevedores(userId: string): Promise<Devedor[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('devedores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) return data as Devedor[];
    } catch (e) {
      console.warn('Supabase error on getDevedores:', e);
    }
  }

  const db = getLocalDB();
  return db.devedores.filter((d) => d.user_id === userId);
}

export async function saveDevedor(devedor: Omit<Devedor, 'id' | 'created_at'> & { id?: string }): Promise<Devedor> {
  const supabase = getSupabaseClient();
  const id = devedor.id || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalDevedor: Devedor = { ...devedor, id, created_at };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('devedores')
        .upsert([finalDevedor])
        .select()
        .single();

      if (!error && data) return data as Devedor;
    } catch (e) {
      console.warn('Supabase saveDevedor error:', e);
    }
  }

  const db = getLocalDB();
  const idx = db.devedores.findIndex((d) => d.id === id);
  if (idx >= 0) {
    db.devedores[idx] = finalDevedor;
  } else {
    db.devedores.unshift(finalDevedor);
  }
  saveLocalDB(db);
  return finalDevedor;
}

export async function deleteDevedor(devedorId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('devedores').delete().eq('id', devedorId);
    } catch (e) {
      console.warn('Supabase deleteDevedor error:', e);
    }
  }
  const db = getLocalDB();
  db.devedores = db.devedores.filter((d) => d.id !== devedorId);
  saveLocalDB(db);
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
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .select('*')
        .eq('user_id', userId)
        .order('vencimento', { ascending: true });

      if (!error && data) return data as ContaAPagar[];
    } catch (e) {
      console.warn('Supabase error on getContasAPagar:', e);
    }
  }

  const db = getLocalDB();
  return db.contas_a_pagar.filter((c) => c.user_id === userId);
}

export async function saveContaAPagar(conta: Omit<ContaAPagar, 'id' | 'created_at'> & { id?: string }): Promise<ContaAPagar> {
  const supabase = getSupabaseClient();
  const id = conta.id || `cap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const created_at = new Date().toISOString();
  const finalConta: ContaAPagar = { ...conta, id, created_at };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .upsert([finalConta])
        .select()
        .single();

      if (!error && data) return data as ContaAPagar;
    } catch (e) {
      console.warn('Supabase saveContaAPagar error:', e);
    }
  }

  const db = getLocalDB();
  const idx = db.contas_a_pagar.findIndex((c) => c.id === id);
  if (idx >= 0) {
    db.contas_a_pagar[idx] = finalConta;
  } else {
    db.contas_a_pagar.unshift(finalConta);
  }
  saveLocalDB(db);
  return finalConta;
}

export async function deleteContaAPagar(contaId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('contas_a_pagar').delete().eq('id', contaId);
    } catch (e) {
      console.warn('Supabase deleteContaAPagar error:', e);
    }
  }
  const db = getLocalDB();
  db.contas_a_pagar = db.contas_a_pagar.filter((c) => c.id !== contaId);
  saveLocalDB(db);
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
