import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput } from '@ionic/angular/standalone';
import { AutenticacionService } from 'src/app/services/autenticacion.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, CommonModule, FormsModule]
})
export class LoginPage {
  email = '';
  password = '';
  error = '';

  constructor(private router: Router, private authService: AutenticacionService) { }

  async login() {
    try {
      const { user } = await this.authService.signIn(this.email, this.password);
      if (user) {
        const profile = await this.authService.getProfileById(user.id);
        //if (!profile || !profile.url_profile) {
        //  this.router.navigate(['/perfil']);
        //} else {
          this.router.navigate(['/home']);
        //}
      }
    } catch (error: any) {
      this.error = error.message;
    }
  }

  goToRegister() {
    this.router.navigate(['/auth']);
  }
}