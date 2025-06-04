import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonIcon } from '@ionic/angular/standalone';
import { AutenticacionService } from 'src/app/services/autenticacion.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonInput, IonIcon]
})
export class AuthPage {
  email = '';
  password = '';
  name = '';
  imageFile: File | null = null;
  error = '';

  constructor(private router: Router, private authService: AutenticacionService) { }

  async register() {
  try {
    await this.authService.signUp(this.email, this.password);
    alert('¡Registro exitoso! Por favor revisa tu correo para confirmar.');
    this.router.navigate(['/login']);
  } catch (error: any) {
    this.error = error.message;
  }
}

  async regresarLogin(){
    this.router.navigate(['/login']);
  }
}