import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonInput, } from '@ionic/angular/standalone';
import { AutenticacionService } from 'src/app/services/autenticacion.service';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonInput, CommonModule, FormsModule]
})
export class LoginPage {
  email = '';
  password = '';
  error = '';

  constructor(private router: Router, private authService: AutenticacionService, private ngZone: NgZone) { }

  async login() {
    try {
      const { user } = await this.authService.signIn(this.email, this.password);
      if (user) {
        this.ngZone.run(async () => {
          console.log('Usuario autenticado:', user);
          console.log(user.id);
          const profile = await this.authService.getFirestoreProfileById(user.id);
          console.log(profile);
          if (profile && profile.username && profile.avatar_url) {
            // Si el perfil existe y está completo
            this.router.navigate(['/home']);
          } else {
            // Si no existe el perfil o le falta info
            this.error = 'Por favor, completa tu perfil antes de continuar.';
            this.router.navigate(['/perfil']);
          }
        });
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      this.error = error.message;
    }
  }

  goToRegister() {
    this.router.navigate(['/auth']);
  }
}