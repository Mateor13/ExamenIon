import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const SUPABASE_PROFILES = 'profiles';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  private supabase: SupabaseClient;
  private _currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  constructor() {
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

  async getProfileById(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  }

  async saveProfile(name: string, imageFile: File) {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    let avatar_url = '';

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

    if (userId) {
      const { error: profileError } = await this.supabase
        .from(SUPABASE_PROFILES)
        .upsert([{ id: userId, name, avatar_url }]);
      if (profileError) throw profileError;
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