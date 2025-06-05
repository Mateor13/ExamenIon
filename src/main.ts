import { bootstrapApplication } from '@angular/platform-browser';

import { appRouting } from './app/app.routes';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { AppComponent } from './app/app.component';
import { IonicModule } from '@ionic/angular';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

// Importa Firebase y Firestore
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers:[
    importProvidersFrom(IonicModule.forRoot()),
    appRouting,
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
  ]
});

// Inicializa los elementos personalizados de Ionic PWA
defineCustomElements(window);