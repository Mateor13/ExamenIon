import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collectionData, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  DocumentData 
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ChatUser {
  id: string;
  username: string;
  avatar_url: string;
}

export interface ChatMessage {
  id?: string;
  uid: string;
  displayName: string;
  photoURL: string;
  message: string;
  timestamp: any;
  imageUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
  isCurrentUser?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private firestore: Firestore, private auth: Auth) { }

  async getAllChatUsers(): Promise<ChatUser[]> {
    const usersRef = collection(this.firestore, 'profiles');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs
      .map(doc => doc.data() as ChatUser)
      .filter(user => user.username && user.avatar_url);
  }

  // Escuchar mensajes en tiempo real con tipado correcto
  getMessages(currentUserId: string): Observable<ChatMessage[]> {
    const messagesRef = collection(this.firestore, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    return collectionData(q, { idField: 'id' }).pipe(
      map(messages => 
        (messages as any[]).map(msg => ({
          ...msg,
          isCurrentUser: msg['uid'] === currentUserId
        } as ChatMessage))
      )
    );
  }

  // Enviar mensaje de texto usando datos de Supabase
  async sendMessage(message: string, user: { id: string, name: string, photoURL: string }) {
    const msg: ChatMessage = {
      uid: user.id,
      displayName: user.name,
      photoURL: user.photoURL,
      message,
      timestamp: new Date()
    };
    await addDoc(collection(this.firestore, 'messages'), msg);
  }

  // Enviar ubicación usando datos de Supabase
  async sendLocation(lat: number, lng: number, user: { id: string, name: string, photoURL: string }) {
    const msg: ChatMessage = {
      uid: user.id,
      displayName: user.name,
      photoURL: user.photoURL,
      message: 'Ubicación enviada',
      timestamp: new Date(),
      location: { lat, lng }
    };
    await addDoc(collection(this.firestore, 'messages'), msg);
  }

  async sendImageMessage(imageUrl: string, user: { id: string, name: string, photoURL: string }) {
    const msg: ChatMessage = {
      uid: user.id,
      displayName: user.name,
      photoURL: user.photoURL,
      message: '', // o un texto opcional
      timestamp: new Date(),
      imageUrl
    };
    await addDoc(collection(this.firestore, 'messages'), msg);
  }
}