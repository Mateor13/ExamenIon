import { Injectable, inject, runInInjectionContext } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';


const SUPABASE_PROFILES = 'profiles';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  private supabase: SupabaseClient;
  private _currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  constructor(private firestore: Firestore) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.loadUser();
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this._currentUser.next(session.user);
      } else if (event === 'SIGNED_OUT') {
        this._currentUser.next(null);
      }
    });
  }

  async loadUser() {
    const { data } = await this.supabase.auth.getUser();
    if (data?.user) {
      this._currentUser.next(data.user);
    } else {
      this._currentUser.next(null);
    }
  }

  get currentUser(): Observable<User | null> {
    return this._currentUser.asObservable();
  }

  async getFirestoreProfileById(userId: string): Promise<{ id: string, username?: string, avatar_url?: string } | null> {
    const userDocRef = doc(this.firestore, 'profiles', userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data() as { id: string, username?: string, avatar_url?: string };
    }
    return null;
  }

  async saveProfile(username: string, imageFile: File) {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    let avatar_url = '';

    // 1. Subir imagen a Supabase y obtener URL pública
    if (imageFile && userId) {
      const filePath = `profiles/${userId}/${imageFile.name}`;
      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, imageFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = this.supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath);
      avatar_url = publicUrlData.publicUrl;
    }

    // 2. Guardar perfil en Firebase Firestore
    if (userId) {
      const profileData = {
        id: userId,
        username,
        avatar_url
      };
      await setDoc(doc(this.firestore, 'profiles', userId), profileData);
    }
    return { success: true };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.loadUser();
    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    await this.loadUser();
    return data;
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this._currentUser.next(null);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}