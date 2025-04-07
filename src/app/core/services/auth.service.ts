declare var google: any;
import { inject, Inject, Injectable } from '@angular/core';
import { getFirebaseBackend } from '../../authUtils';
import { User } from 'src/app/store/Authentication/auth.models';
import { from, map } from 'rxjs';
import { Router } from '@angular/router';


@Injectable({ providedIn: 'root' })

export class AuthenticationService {
    router = inject(Router);
    user: User;

    constructor() {
    }

    initializeGoogleLogin(callback: (response: any) => void): void {
        google.accounts.id.initialize({
          client_id: '157634060385-i0580ilqdhoddjvnepssdgj8sd5elrep.apps.googleusercontent.com',
          callback,
        });
        google.accounts.id.renderButton(document.getElementById('google-btn'), {
          theme: 'outline',
          size: 'large',
          width: 300,
          shape: 'pill',
          logo_alignment: 'left',
        });
      }
    
      decodeToken(token: string): any {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          return JSON.parse(jsonPayload);
        } catch (error) {
          console.error('Invalid token:', error);
          return null;
        }
      }
    
      storeUser(user: any): void {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
      }
    
      isLoggedIn(): boolean {
        return !!sessionStorage.getItem('currentUser');
      }
    logout() {
        google.accounts.id.disableAutoSelect();
        this.router.navigate(['/auth/login']);
    }
    /**
     * Returns the current user
     */
    public currentUser(): User {
        return getFirebaseBackend().getAuthenticatedUser();
    }

    /**
     * Performs the auth
     * @param email email of user
     * @param password password of user
     */
    login(email: string, password: string) {
        return from(getFirebaseBackend().loginUser(email, password).pipe(map(user => {
            return user;
        }
        )));
    }

    /**
     * Performs the register
     * @param email email
     * @param password password
     */
    register(user: User) {
        // return from(getFirebaseBackend().registerUser(user));

        return from(getFirebaseBackend().registerUser(user).then((response: any) => {
            const user = response;
            return user;
        }));
    }

    /**
     * Reset password
     * @param email email
     */
    resetPassword(email: string) {
        return getFirebaseBackend().forgetPassword(email).then((response: any) => {
            const message = response.data;
            return message;
        });
    }

    /**
     * Logout the user
     */
    // logout() {
    //     // logout the user
    //     getFirebaseBackend().logout();
    // }
}

