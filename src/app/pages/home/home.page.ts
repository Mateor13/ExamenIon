import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ChatService, ChatMessage } from 'src/app/services/chat.service';
import { AutenticacionService } from 'src/app/services/autenticacion.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonInput 
  ]
})
export class HomePage implements OnInit {
  email = '';
  messages$: Observable<ChatMessage[]>;
  message = '';
  name = '';
  error = '';
  userSupabase: any = null;
  pokemonName = '';

  constructor(
    private router: Router,
    private authService: AutenticacionService,
    private chatService: ChatService,
    private http: HttpClient
  ) {
    this.messages$ = this.chatService.getMessages();
  }

  async ngOnInit() {
    const { data } = await this.authService.client.auth.getUser();
    if (!data.user) {
      this.router.navigate(['/login']);
    } else {
      this.userSupabase = data.user;
      this.email = data.user.email || '';
      this.name = data.user.user_metadata?.['full_name'] || data.user.email?.split('@')[0] || '';
    }
  }

  async sendMessage() {
    if (!this.message.trim() || !this.userSupabase) return;
    try {
      const user = {
        id: this.userSupabase.id,
        name: this.userSupabase.user_metadata?.full_name || this.userSupabase.email,
        photoURL: this.userSupabase.user_metadata?.avatar_url || ''
      };
      await this.chatService.sendMessage(this.message, user);
      this.message = '';
    } catch (error: any) {
      this.error = error.message;
    }
  }

  async sendLocation() {
    if (!this.userSupabase) return;
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const user = {
            id: this.userSupabase.id,
            name: this.userSupabase.user_metadata?.full_name || this.userSupabase.email,
            photoURL: this.userSupabase.user_metadata?.avatar_url || ''
          };
          await this.chatService.sendLocation(
            position.coords.latitude,
            position.coords.longitude,
            user
          );
        },
        (error) => {
          this.error = 'No se pudo obtener la ubicación.';
        }
      );
    } catch (error: any) {
      this.error = error.message;
    }
  }

  async onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0] || !this.userSupabase) return;
    const file = input.files[0];

    // 1. Sube la imagen a Supabase Storage
    const filePath = `chat/${this.userSupabase.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await this.authService.client.storage
      .from('chat-images')
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      console.log(uploadError)
      this.error = 'Error subiendo imagen';
      return;
    }

    // 2. Obtén la URL pública de la imagen
    const { data: publicUrlData } = this.authService.client
      .storage
      .from('chat-images')
      .getPublicUrl(filePath);
    const imageUrl = publicUrlData.publicUrl;

    // 3. Envía el mensaje con la URL de la imagen a Firebase
    const user = {
      id: this.userSupabase.id,
      name: this.userSupabase.user_metadata?.full_name || this.userSupabase.email,
      photoURL: this.userSupabase.user_metadata?.avatar_url || ''
    };
    await this.chatService.sendImageMessage(imageUrl, user);
  }

  async sendPokemon() {
    if (!this.pokemonName.trim() || !this.userSupabase) return;
    try {
      const response: any = await this.http
        .get(`https://pokeapi.co/api/v2/pokemon/${this.pokemonName.toLowerCase()}`)
        .toPromise();

      // 3 características: nombre, altura, peso
      const name = response.name;
      const height = response.height;
      const weight = response.weight;
      const message = `Pokémon: ${name}\nAltura: ${height}\nPeso: ${weight}`;

      const user = {
        id: this.userSupabase.id,
        name: this.userSupabase.user_metadata?.full_name || this.userSupabase.email,
        photoURL: this.userSupabase.user_metadata?.avatar_url || ''
      };
      await this.chatService.sendMessage(message, user);
      this.pokemonName = '';
    } catch (error: any) {
      this.error = 'Pokémon no encontrado';
    }
  }

  async logout() {
    await this.authService.client.auth.signOut();
    this.router.navigate(['/login']);
  }
}