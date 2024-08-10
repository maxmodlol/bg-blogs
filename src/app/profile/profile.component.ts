import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user = {
    name: '',
    email: '',
    password: '',
  };

  isEditMode = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.authService.getUserProfile().subscribe(
      (profile) => {
        this.user.name = profile.data.name;
        this.user.email = profile.data.email;
      },
      (error) => {
        console.error('Failed to load user profile', error);
        this.showError('Failed to load profile.');
      }
    );
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  onSubmit(): void {
    this.authService.updateUserProfile(this.user).subscribe(
      (response) => {
        if (response.success) {
          this.showSuccess('Profile updated successfully');
          this.toggleEditMode();
        } else {
          this.showError('Failed to update profile');
        }
      },
      (error) => {
        console.error('Failed to update profile', error);
        this.showError('Failed to update profile');
      }
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar'],
    });
  }
}
