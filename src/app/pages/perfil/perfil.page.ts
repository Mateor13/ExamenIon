import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonInput, IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AutenticacionService } from 'src/app/services/autenticacion.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    IonInput,      
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar
  ]
})
export class PerfilPage implements OnInit {
  name: string = '';
  imageFile: File | null = null;
  error: string = '';
  userSupabase: any = null; // <-- Agrega esta línea
  email: string = '';

  constructor(private router: Router, private authService: AutenticacionService) { }

  async ngOnInit() {
    const { data } = await this.authService.client.auth.getUser();
    if (data.user) {
      this.userSupabase = data.user;
      this.email = data.user.email || '';
      this.name = data.user.user_metadata?.['full_name'] || '';
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
    }
  }

  async guardarPerfil() {
  if (this.name.trim() && this.imageFile) {
    try {
      await this.authService.saveProfile(this.name, this.imageFile);
      alert('Perfil actualizado exitosamente.');
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.error = error.message || 'Error al guardar el perfil.';
    }
  } else {
    this.error = 'Por favor ingresa tu nombre y selecciona una imagen de perfil.';
  }
}
}
