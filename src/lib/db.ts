import { supabase } from './supabase';

export const db = { type: 'firestore_mock' };
export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (callback: any) => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      let user = session?.user || null;
      if (user) {
        (user as any).getIdToken = async () => {
          const { data } = await supabase.auth.getSession();
          return data.session?.access_token;
        };
      }
      auth.currentUser = user;
      callback(auth.currentUser);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      let user = session?.user || null;
      if (user) {
        (user as any).getIdToken = async () => {
          const { data } = await supabase.auth.getSession();
          return data.session?.access_token;
        };
      }
      auth.currentUser = user;
      callback(auth.currentUser);
    });
    return () => subscription.unsubscribe();
  },
  signOut: () => supabase.auth.signOut(),
  getToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }
};

export const onAuthStateChanged = (authObj, callback) => authObj.onAuthStateChanged(callback);
export const signOut = (authObj) => authObj.signOut();
export const signInWithEmailAndPassword = (authObj, email, password) => supabase.auth.signInWithPassword({ email, password });
export const createUserWithEmailAndPassword = (authObj, email, password) => supabase.auth.signUp({ email, password });

export const collection = (db, path) => ({ type: 'collection', path });

export const doc = (dbOrColl: any, pathOrId?: any, idParam?: any) => {
  let path = '';
  let id = '';
  if (dbOrColl && dbOrColl.type === 'firestore_mock') {
    path = pathOrId;
    id = idParam;
  } else if (dbOrColl && dbOrColl.type === 'collection') {
    path = dbOrColl.path;
    id = pathOrId || 'generated_' + Math.random().toString(36).substring(2);
  }
  return { type: 'doc', path, id };
};

export const query = (coll, ...constraints) => ({ type: 'query', coll, constraints });

export const where = (field, op, value) => ({ type: 'where', field, op, value });
export const orderBy = (field, dir = 'asc') => ({ type: 'orderBy', field, dir });
export const limit = (n) => ({ type: 'limit', n });

export const serverTimestamp = () => new Date().toISOString();

function buildSupabaseQuery(builder, constraints) {
  for (const c of constraints || []) {
    if (c.type === 'where') {
      let f = c.field;
      if (f === 'companyId') f = 'company_id';
      if (c.op === '==') builder = builder.eq(f, c.value);
      if (c.op === '!=') builder = builder.neq(f, c.value);
      if (c.op === '<') builder = builder.lt(f, c.value);
      if (c.op === '<=') builder = builder.lte(f, c.value);
      if (c.op === '>') builder = builder.gt(f, c.value);
      if (c.op === '>=') builder = builder.gte(f, c.value);
      if (c.op === 'in') builder = builder.in(f, c.value);
      if (c.op === 'array-contains') builder = builder.contains(f, [c.value]);
    }
    if (c.type === 'orderBy') {
      let f = c.field;
      if (f === 'createdAt') f = 'created_at';
      builder = builder.order(f, { ascending: c.dir === 'asc' });
    }
    if (c.type === 'limit') {
      builder = builder.limit(c.n);
    }
  }
  return builder;
}

function mapTableName(path) {
  if (path === 'companies') return 'company_profiles';
  if (path === 'crm_contacts') return 'contacts';
  if (path === 'crm_rfqs') return 'rfqs';
  if (path === 'inventory_items') return 'inventory_items';
  if (path === 'module_requests') return 'module_requests';
  return path;
}

function mapDataToDb(data: any) {
  const mapped = { ...data };
  if (mapped.createdAt) { mapped.created_at = mapped.createdAt; delete mapped.createdAt; }
  if (mapped.videoUrl !== undefined) { mapped.video_url = mapped.videoUrl; delete mapped.videoUrl; }
  if (mapped.sourceUrl !== undefined) { mapped.source_url = mapped.sourceUrl; delete mapped.sourceUrl; }
  return mapped;
}

function mapDataFromDb(data: any) {
  const mapped = { ...data };
  if (mapped.created_at) { mapped.createdAt = mapped.created_at; }
  if (mapped.user_uid) { mapped.userId = mapped.user_uid; }
  if (mapped.company_id) { mapped.companyId = mapped.company_id; }
  if (mapped.video_url !== undefined) { mapped.videoUrl = mapped.video_url; }
  if (mapped.source_url !== undefined) { mapped.sourceUrl = mapped.source_url; }
  return mapped;
}

export const getDocs = async (qOrColl) => {
  const isQuery = qOrColl.type === 'query';
  const path = mapTableName(isQuery ? qOrColl.coll.path : qOrColl.path);
  let builder = supabase.from(path).select('*');
  
  if (isQuery) {
    builder = buildSupabaseQuery(builder, qOrColl.constraints);
  }
  
  const { data, error } = await builder;
  if (error) {
    console.error(`Error in getDocs (${path}):`, error);
    throw error;
  }
  
  return {
    forEach: (cb) => (data || []).forEach(item => cb({ id: item.id || item.uid, data: () => mapDataFromDb(item) })),
    docs: (data || []).map(item => ({ id: item.id || item.uid, data: () => mapDataFromDb(item), exists: () => true })),
    empty: !data || data.length === 0,
    size: data?.length || 0
  };
};

export const getDoc = async (docRef) => {
  const path = mapTableName(docRef.path);
  const field = path === 'company_profiles' ? 'user_uid' : 'id';
  
  let val = docRef.id;
  if (!isNaN(val) && field === 'id') val = Number(val);
  
  const { data, error } = await supabase.from(path).select('*').eq(field, val).single();
  
  if (error && error.code !== 'PGRST116') {
    console.error(`Error in getDoc (${path}/${docRef.id}):`, error);
  }
  
  if (!data) return { exists: () => false, data: () => null, id: docRef.id };
  return { exists: () => true, data: () => mapDataFromDb(data), id: docRef.id };
};

export const addDoc = async (coll, data) => {
  const path = mapTableName(coll.path);
  const payload = mapDataToDb(data);
  const { data: result, error } = await supabase.from(path).insert(payload).select().single();
  if (error) throw error;
  return { id: result.id };
};

export const setDoc = async (docRef, data, options = {}) => {
  const path = mapTableName(docRef.path);
  const field = path === 'company_profiles' ? 'user_uid' : 'id';
  let val = docRef.id;
  if (!isNaN(val) && field === 'id') val = Number(val);
  const payload = { ...mapDataToDb(data), [field]: val };
  
  const { error } = await supabase.from(path).upsert(payload);
  if (error) throw error;
};

export const updateDoc = async (docRef, data) => {
  const path = mapTableName(docRef.path);
  const field = path === 'company_profiles' ? 'user_uid' : 'id';
  let val = docRef.id;
  if (!isNaN(val) && field === 'id') val = Number(val);
  const payload = mapDataToDb(data);
  const { error } = await supabase.from(path).update(payload).eq(field, val);
  if (error) throw error;
};

export const deleteDoc = async (docRef) => {
  const path = mapTableName(docRef.path);
  const field = path === 'company_profiles' ? 'user_uid' : 'id';
  let val = docRef.id;
  if (!isNaN(val) && field === 'id') val = Number(val);
  const { error } = await supabase.from(path).delete().eq(field, val);
  if (error) throw error;
};

export const onSnapshot = (qOrColl: any, callback: any, errorCallback?: any) => {
  let isCancelled = false;
  const fetchAndCallback = async () => {
    if (isCancelled) return;
    try {
      const snap = await getDocs(qOrColl);
      if (!isCancelled) callback(snap);
    } catch (e) {
      if (!isCancelled && errorCallback) errorCallback(e);
    }
  };
  
  fetchAndCallback();
  const interval = setInterval(fetchAndCallback, 3000);
  
  return () => {
    isCancelled = true;
    clearInterval(interval);
  };
};

export const writeBatch = () => {
  const promises = [];
  return {
    set: (docRef, data) => promises.push(() => setDoc(docRef, data)),
    update: (docRef, data) => promises.push(() => updateDoc(docRef, data)),
    delete: (docRef) => promises.push(() => deleteDoc(docRef)),
    commit: async () => {
      for (const p of promises) {
        await p();
      }
    }
  };
};

