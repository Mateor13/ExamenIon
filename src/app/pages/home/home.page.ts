import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ChatService, ChatMessage } from 'src/app/services/chat.service';
import { AutenticacionService } from 'src/app/services/autenticacion.service';
import { HttpClient } from '@angular/common/http';
import { ActionSheetController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('galleryInput') galleryInput!: ElementRef<HTMLInputElement>;
  email = '';
  messages$!: Observable<ChatMessage[]>;
  message = '';
  name = '';
  error = '';
  userSupabase: any = null;

  constructor(
    private router: Router,
    private authService: AutenticacionService,
    private chatService: ChatService,
    private http: HttpClient,
    private actionSheetCtrl: ActionSheetController
  ) { }

  async ngOnInit() {
    const { data } = await this.authService.client.auth.getUser();
    if (!data.user) {
      this.router.navigate(['/login']);
    } else {
      this.userSupabase = data.user;
      this.email = data.user.email || '';
      this.name = data.user.user_metadata?.['full_name'] || data.user.email?.split('@')[0] || '';
      // Inicializa messages$ después de tener el userSupabase
      this.messages$ = this.chatService.getMessages(this.userSupabase.id);
    }
  }

  async sendMessage() {
    if (!this.message.trim() || !this.userSupabase) return;
    try {
      const user = await this.getUserProfile();
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
          const user = await this.getUserProfile();
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

    // Sube la imagen a Supabase Storage
    const filePath = `chat/${this.userSupabase.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await this.authService.client.storage
      .from('chat-images')
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      this.error = 'Error subiendo imagen';
      return;
    }

    // Obtén la URL pública de la imagen
    const { data: publicUrlData } = this.authService.client
      .storage
      .from('chat-images')
      .getPublicUrl(filePath);
    const imageUrl = publicUrlData.publicUrl;

    // Envía el mensaje con la URL de la imagen a Firebase
    const user = await this.getUserProfile();
    await this.chatService.sendImageMessage(imageUrl, user);
  }

  async sendPokemon() {
    const pokemonName = this.message.trim();
    if (!pokemonName || !this.userSupabase) return;

    try {
      const response: any = await this.http
        .get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`)
        .toPromise();

      const name = response.name.charAt(0).toUpperCase() + response.name.slice(1);
      const id = response.id;
      const height = (response.height / 10).toFixed(2); // metros
      const weight = (response.weight / 10).toFixed(2); // kg
      const abilities = response.abilities.map((a: any) => a.ability.name).join(', ');

      const message =
        `#${id} ${name}\n` +
        `Altura: ${height} m\n` +
        `Peso: ${weight} kg\n` +
        `Habilidades: ${abilities}`;

      const user = await this.getUserProfile();
      await this.chatService.sendMessage(message, user);
      this.message = '';
    } catch (error: any) {
      this.error = 'Pokémon no encontrado. Intenta con otro nombre.';
      setTimeout(() => this.error = '', 3000);
    }
  }

  async getUserProfile() {
    const profile = await this.authService.getFirestoreProfileById(this.userSupabase.id);
    return {
      id: this.userSupabase.id,
      name: profile?.username || this.userSupabase.email,
      photoURL: profile?.avatar_url || ''
    };
  }

  async presentPhotoOptions() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Enviar foto',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => this.takePhoto()
        },
        {
          text: 'Seleccionar de galería',
          icon: 'images',
          handler: () => this.selectFromGallery()
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async takePhoto() {
    // Usar Capacitor Camera para tomar foto
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });

    if (image.webPath) {
      await this.uploadImage(image.webPath);
    }
  }

  async selectFromGallery() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos
    });

    if (image.webPath) {
      await this.uploadImage(image.webPath);
    }
  }

  async uploadImage(imagePath: string) {
    try {
      // Convertir la imagen a blob
      const response = await fetch(imagePath);
      const blob = await response.blob();

      // Subir a Supabase Storage
      const filePath = `chat/${this.userSupabase.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await this.authService.client.storage
        .from('chat-images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: publicUrlData } = this.authService.client
        .storage
        .from('chat-images')
        .getPublicUrl(filePath);

      // Enviar mensaje con la imagen
      const user = await this.getUserProfile();
      await this.chatService.sendImageMessage(publicUrlData.publicUrl, user);
    } catch (error) {
      this.error = 'Error al subir la imagen';
      console.error(error);
    }
  }

  async logout() {
    await this.authService.client.auth.signOut();
    this.router.navigate(['/login']);
  }
}