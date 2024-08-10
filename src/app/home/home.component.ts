import { Component, OnInit } from '@angular/core';
import { PostService } from '../post/post.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  posts: any[] = [];
  newPost = { title: '', content: '' }; // Object to hold new post data

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.postService.getPosts().subscribe((response) => {
      this.posts = response?.data || [];
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.newPost.title.trim() && this.newPost.content.trim()) {
      this.postService.createPost(this.newPost).subscribe(
        (response) => {
          if (response.success) {
            this.showSuccess('Post added successfully');
            this.newPost = { title: '', content: '' }; // Reset form
            this.loadPosts(); // Reload posts
          } else {
            this.showError('Failed to add post');
          }
        },
        (error) => {
          console.error('Failed to add post', error);
          this.showError('Failed to add post');
        }
      );
    } else {
      this.showError('Title and content are required');
    }
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
