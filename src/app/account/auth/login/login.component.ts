import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../../core/services/authfake.service';

import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { login } from 'src/app/store/Authentication/authentication.actions';
import { CommonModule } from '@angular/common';

declare const google: any;
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone:true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule]
})

/**
 * Login component
 */
export class LoginComponent implements OnInit {
  loginForm: UntypedFormGroup;
  submitted: any = false;
  error: any = '';
  returnUrl: string;
  fieldTextType!: boolean;
  
  // set the currenr year
  year: number = new Date().getFullYear();

  // tslint:disable-next-line: max-line-length
  constructor(private formBuilder: UntypedFormBuilder, private route: ActivatedRoute, private router: Router, private authenticationService: AuthenticationService, private store: Store,
    private authFackservice: AuthfakeauthenticationService, private authService: AuthenticationService) { }

  ngOnInit() {
    this.authService.initializeGoogleLogin((response: any) => {
      if (response && response.credential) {
        const payload = this.authService.decodeToken(response.credential);
        if (payload) {
          this.authService.storeUser(payload);
          this.router.navigate(['']).then((success) => {
            if (success) {
              console.log('Navigation to "" successful!');
            } else {
              console.error('Navigation to "" failed!');
            }
          });
        } else {
          console.error('Failed to decode token or invalid token payload.');
        }
      } else {
        console.error('Invalid response or missing credential.');
      }
    });


    if (localStorage.getItem('currentUser')) {
      this.router.navigate(['/']);
    }

    // form validation
    this.loginForm = this.formBuilder.group({
      email: ['admin@cardinal.com', [Validators.required, Validators.email]],
      password: ['123456', [Validators.required]],
    });
  }
  private decodeToken(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }

  handleGoogleLogin(response: any) {
    if (response && response.credential) {
      const payload = this.decodeToken(response.credential);
      if (payload) {
        sessionStorage.setItem('currentUser', JSON.stringify(payload));
        
        this.router.navigate(['']).then(success => {
          if (success) {
            console.log('Navigation to "" successful!');
          } else {
            console.error('Navigation to "" failed!');
          }
        });
      } else {
        console.error('Failed to decode token or invalid token payload.');
      }
    } else {
      console.error('Invalid response or missing credential.');
    }
  }
  

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  /**
   * Form submit
   */
  onSubmit() {
    this.submitted = true;

    const email = this.f['email'].value; // Get the username from the form
    const password = this.f['password'].value; // Get the password from the form

    // Login Api
    this.store.dispatch(login({ email: email, password: password }));
  }

  /**
 * Password Hide/Show
 */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
}
