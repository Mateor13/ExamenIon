import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection, addDoc, query, orderBy } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private firestore: Firestore, private auth: Auth) { }

  // Escuchar mensajes en tiempo real
  getMessages(): Observable<ChatMessage[]> {
    const messagesRef = collection(this.firestore, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<ChatMessage[]>;
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